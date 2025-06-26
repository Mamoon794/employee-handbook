from dotenv import load_dotenv
import os
import sys
import time
from langchain.chat_models import init_chat_model
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_pinecone import PineconeVectorStore
from pinecone import Pinecone

import json
import bs4
from langchain import hub
from langchain_community.document_loaders import WebBaseLoader, PyPDFLoader
from langchain_core.tools import tool
from langchain_core.messages import SystemMessage
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.checkpoint.memory import MemorySaver
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langgraph.graph import START, StateGraph, MessagesState, END
from typing_extensions import List, TypedDict
import pprint

# Load environment variables
load_dotenv()

# Ensure required environment variables are set
if not os.environ.get("GOOGLE_API_KEY"):
    print("Please set the GOOGLE_API_KEY environment variable.")

if not os.environ.get("PINECONE_API_KEY"):
    print("Please set the GOOGLE_API_KEY environment variable.")
pc_api_key = os.environ.get("PINECONE_API_KEY")

if not os.environ.get("PINECONE_INDEX_NAME"):
    print("Please set the PINECONE_INDEX_NAME environment variable.")
index_name = os.environ.get("PINECONE_INDEX_NAME")

# Initialize llm models and vector store
llm = init_chat_model("gemini-2.0-flash", model_provider="google_genai")
embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")

# Initialize Pinecone vector store
pc = Pinecone(api_key=pc_api_key)
index = pc.Index(index_name)
vector_store = PineconeVectorStore(embedding=embeddings, index=index)

# Load prompt template from LangChain Hub
prompt = hub.pull("rlm/rag-prompt", api_url="https://api.smith.langchain.com")

@tool(response_format="content_and_artifact")
def retrieve(query: str, province: str):
    """Retrieve employment-related information by searching indexed documents in the given province. 
    Parameters:
    - query: the user's question.
    - province: province name like "Alberta", "British Columbia", etc."""
    print("province:", province)
    retrieved_docs = vector_store.similarity_search(query, k=8, namespace=province)
    serialized = "\n\n".join(
        (f"DocMetadata: {doc.metadata}\n" f"DocContent: {doc.page_content}")
        for doc in retrieved_docs
    )
    return serialized, retrieved_docs

# Step 1: Generate an AIMessage that may include a tool-call to be sent.
def query_or_respond(state: MessagesState):
    """Generate tool call for retrieval or respond."""
    llm_with_tools = llm.bind_tools([retrieve])
    response = llm_with_tools.invoke(state["messages"])
    # MessagesState appends messages to state instead of overwriting
    return {"messages": [response]}

# Step 2: Execute the retrieval.
tools = ToolNode([retrieve])

# Step 3: Generate a response using the retrieved content.
def generate(state: MessagesState):
    """Generate answer."""
    # Get generated ToolMessages
    recent_tool_messages = []
    for message in reversed(state["messages"]):
        if message.type == "tool":
            recent_tool_messages.append(message)
        else:
            break
    tool_messages = recent_tool_messages[::-1]

    # Format into prompt
    docs_content = "\n\n".join(doc.content for doc in tool_messages)
    system_message_content = (
        "You are an assistant for question-answering tasks. If a retrieval tool is available, use it to get relevant information before answering. Only answer without it if you're absolutely sure."
        "\n\n"
        f"{docs_content}"
    )
    conversation_messages = [
        message
        for message in state["messages"]
        if message.type in ("human", "system")
        or (message.type == "ai" and not message.tool_calls)
    ]
    prompt = [SystemMessage(system_message_content)] + conversation_messages

    # Run
    response = llm.invoke(prompt)
    return {"messages": [response]}


graph_builder = StateGraph(MessagesState)
graph_builder.add_node(query_or_respond)
graph_builder.add_node(tools)
graph_builder.add_node(generate)

graph_builder.set_entry_point("query_or_respond")
graph_builder.add_conditional_edges(
    "query_or_respond",
    tools_condition,
    {END: END, "tools": "tools"},
)
graph_builder.add_edge("tools", "generate")
graph_builder.add_edge("generate", END)

memory = MemorySaver()
graph = graph_builder.compile(checkpointer=memory)

def load_and_split_html(url, title):
    try:
        webloader = WebBaseLoader(
            web_paths=(url,),
            bs_kwargs=dict(parse_only=bs4.SoupStrainer(["h1", "h2", "h3", "h4", "p", "li"]))
        )
        web_docs = webloader.load()
        for doc in web_docs:
            doc.metadata["title"] = title
        web_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200, add_start_index=True)
        return web_splitter.split_documents(web_docs)
    except Exception as e:
        print(f"[HTML] Failed to load {url}: {e}")
        return []
    
def load_and_split_pdf(url):
    try:
        pdfloader = PyPDFLoader(url, mode="page")
        pdf_docs = pdfloader.load()
        pdf_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        return pdf_splitter.split_documents(pdf_docs)
    except Exception as e:
        print(f"[PDF] Failed to load {url}: {e}")
        return []
    
def process_docs(docs):
    splits = []
    for doc in docs:
        doc_type = doc.get("type")
        url = doc.get("url")
        title = doc.get("title")
        if not url:
            continue
        if doc_type == "html":
            splits.extend(load_and_split_html(url, title))
        elif doc_type == "pdf":
            splits.extend(load_and_split_pdf(url))
    return splits

# Convert the Document objects to emmbeddings and upload to Pinecone vector store
def batch_add_documents(vector_store, documents, namespace, batch_size=100):
    for i in range(0, len(documents), batch_size):
        batch = documents[i:i + batch_size]
        try:
            vector_store.add_documents(batch, namespace=namespace)
        except Exception as e:
            print(f"Failed to upload batch {i // batch_size + 1}: {e}")

def index_documents(namespaces):
    general_splits = process_docs(jsonData.get("general", []))
    if "general" in namespaces:
        index.delete(delete_all=True, namespace="general")
    batch_add_documents(vector_store, general_splits, namespace="general", batch_size=50)

    for province in jsonData.get("provinces", []):
        province_name = province.get("name")
        if not province_name:
            continue
        print(f"Processing province: {province_name}")
        province_splits = process_docs(province.get("docs", []))
        # Add namespace to each document's metadata
        if province_name in namespaces:
            index.delete(delete_all=True, namespace=province_name)
        batch_add_documents(vector_store, province_splits, namespace=province_name, batch_size=50)


if __name__ == "__main__":
    # Load your JSON file
    with open("providedDocSample.json") as f:
        jsonData = json.load(f)

    index.describe_index_stats()
    stats = index.describe_index_stats()
    namespaces = stats.get("namespaces", {})

    index_documents(namespaces)
    print("Indexing completed.")