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
import pickle
from langchain_core.documents import Document

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
def retrieve(query: str, province: str, company: str = ""):
    """
    Retrieve employment-related information by searching indexed documents 
    within the specified province. If no province is given, it defaults to "General". 
    If a company name is provided, it filters documents accordingly.

    Use this tool only when the user is asking a factual or research-based question 
    related to employment policies or company-specific matters. Do not use this tool for small talk, 
    greetings, or general conversational questions.

    Parameters:
    - query: the user's question.
    - province: province name such as "Alberta", "British Columbia", etc.
    - company: (optional) company name to filter documents.
    """
    # print("province:", province)
    province_docs = vector_store.similarity_search(query, k=4, namespace=province)
    general_docs = vector_store.similarity_search(query, k=4, namespace="General")
    company_docs = vector_store.similarity_search(query, k=4, namespace=company)
    retrieved_docs = province_docs + general_docs + company_docs
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

    # print("tool_messages:", tool_messages)
    # print("length", len(tool_messages))
    docs = tool_messages[-1].artifact 
    # Separate docs based on whether metadata has a "company" field
    company_docs = [doc for doc in docs if "company" in doc.metadata]
    non_company_docs = [doc for doc in docs if "company" not in doc.metadata]

    # Format the doc content for each group
    # print("company_docs:", company_docs)
    company_docs_content = "\n\n".join(f"DocMetadata: {doc.metadata}\n" f"DocContent: {doc.page_content}" for doc in company_docs)
    non_company_docs_content = "\n\n".join(f"DocMetadata: {doc.metadata}\n" f"DocContent: {doc.page_content}" for doc in non_company_docs)

    # Construct system prompt
    system_message_content = (
        "You are an assistant for question-answering tasks. Use the retrieved documents to answer the user's question. "
        "Format your response in **two clearly separated sections** as described below. "
        "This formatting is required to allow automatic parsing:\n\n"
        
        "1. **public-doc**:\n"
        "- Use only documents that do **not** have a company name in their metadata.\n"
        "- Begin with a legal-sounding tone such as:\n"
        "  \"Based on the applicable law, ...\" or \"According to relevant legal guidance, ...\"\n"
        "- If no relevant information is found, still write a sentence in the expected tone and end with [Found: No]\n"
        "- If relevant information is found, write the answer and end with [Found: Yes]\n"
        "- Start this section with exactly: **public-doc**:\n"
        
        "2. **company-doc**:\n"
        "- Use only documents that **do** have a company name in their metadata.\n"
        "- Begin with a company policy tone such as:\n"
        "  \"Based on the employee manual, ...\" or \"According to [Company]'s internal policy, ...\"\n"
        "- Replace `[Company]` with the **actual company name** from the metadata.\n"
        "- If the company name is not available, use 'the company' instead.\n"
        "- **Do not output the placeholder `[Company]` in your response.**\n"
        "- If no relevant information is found, still write a sentence in the expected tone and end with [Found: No]\n"
        "- If relevant information is found, write the answer and end with [Found: Yes]\n"
        "- Start this section with exactly: **company-doc**:\n"
        
        "Important:\n"
        "- Do not include any extra sections or commentary outside the two headers.\n"
        "- Each section must end with [Found: Yes] or [Found: No].\n"
        "- Do not number the sections. Do not prefix with “1.” or “2.”\n"
        "— just use the headers exactly as shown: **public-doc**: and **company-doc**:\n\n"
        
        "---\n"
        "public-doc documents:\n"
        f"{non_company_docs_content}\n\n"
        "---\n"
        "company-doc documents:\n"
        f"{company_docs_content}"
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
    
def split_html(doc):
    try:
        web_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200, add_start_index=True)
        return web_splitter.split_documents([doc])
    except Exception as e:
        print(f"[HTML] Failed to load {doc.metadata.get('title', '')}: {e}")
        return []
    
def split_pdf(doc):
    try:
        pdf_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        return pdf_splitter.split_documents([doc])
    except Exception as e:
        print(f"[PDF] Failed to load {doc.metadata.get('title', '')}: {e}")
        return []
    
def process_docs(docs):
    splits = []
    # print("Processing documents...")
    # print(docs[0])  # Print first 100 characters of the first document
    # print(f"Type of doc: {type(docs[0])}")
    for doc in docs:
        doc_type = doc.metadata.get("type", "")
        if doc_type == "html":
            splits.extend(split_html(doc))
        elif doc_type == "pdf":
            splits.extend(split_pdf(doc))
    return splits

# Convert the Document objects to emmbeddings and upload to Pinecone vector store
def batch_add_documents(vector_store, documents, namespace, batch_size=100, max_retries=5, base_delay=2):
    for i in range(0, len(documents), batch_size):
        batch = documents[i:i + batch_size]
        attempt = 0
        while attempt <= max_retries:
            try:
                vector_store.add_documents(batch, namespace=namespace)
                break  # success
            except Exception as e:
                if "429" in str(e) or "Rate limit" in str(e):
                    sleep_time = base_delay * (2 ** attempt)  # exponential backoff
                    print(f"[Retry {attempt+1}] Rate limited on batch {i // batch_size + 1}, sleeping {sleep_time}s...")
                    time.sleep(sleep_time)
                    attempt += 1
                else:
                    print(f"Failed to upload batch {i // batch_size + 1}: {e}")
                    break  # don't retry on non-rate errors
        else:
            print(f"[ERROR] Giving up on batch {i // batch_size + 1} after {max_retries} retries.")

def index_documents():
    stats = index.describe_index_stats()
    existing_namespaces = stats.get("namespaces", {})
    for namespace, docs in allData.items():
        # print("Processing namespace:", namespace)
        # print("Number of documents in namespace:", len(docs))
        if not isinstance(docs, list) or docs == []:
            print("docs == []: ", docs == [])
            print(f"Skipping non-list entry for namespace {namespace}: {docs}")
            continue
        splits = process_docs(docs)
        if namespace in existing_namespaces:
            index.delete(delete_all=True, namespace=namespace)
        # print("length of splits:", len(splits))
        batch_add_documents(vector_store, splits, namespace=namespace, batch_size=50)

# Convert the Document objects to emmbeddings and upload to Pinecone vector store
def batch_add_company_documents(vector_store, documents, company=None, batch_size=100):
    for i in range(0, len(documents), batch_size):
        batch = documents[i:i + batch_size]
        for doc in batch:
            doc.metadata.update({
                "company": company,
            })
        try:
            vector_store.add_documents(batch, namespace=company)
        except Exception as e:
            print(f"Failed to upload batch {i // batch_size + 1}: {e}")

def index_company_documents(splits, company):
    batch_add_company_documents(vector_store, splits, company=company, batch_size=50)

def delete_company_documents_from_vector_db(company):
    """
    Deletes all documents in the vector store for the specified company.
    """
    index.delete(delete_all=True, namespace=company)

def delete_document_from_vector_db(url, company):
    """
    Deletes a document from the vector store based on the provided URL and company.
    """
    index.delete(filter={"source": {"$eq": url}}, namespace=company)

if __name__ == "__main__":
    # Load your JSON file
    # with open("providedDocSample.json") as f:
    #     allData = json.load(f)

    with open("extracted_docs.pkl", "rb") as f:
        allData = pickle.load(f)

    index_documents()
    print("Indexing completed.")