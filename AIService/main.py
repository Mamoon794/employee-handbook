from fastapi import FastAPI, HTTPException
from dotenv import load_dotenv
import os
import sys
from langchain.chat_models import init_chat_model
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_pinecone import PineconeVectorStore
from pinecone import Pinecone

import bs4
from langchain import hub
from langchain_community.document_loaders import WebBaseLoader, PyPDFLoader
from langchain_core.documents import Document
from langchain_core.tools import tool
from langchain_core.messages import SystemMessage
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.checkpoint.memory import MemorySaver
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langgraph.graph import START, StateGraph, MessagesState, END
from typing_extensions import List, TypedDict
from pydantic import BaseModel
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

# Initialize FastAPI application
app = FastAPI()

@app.get("/")
def root():
    return {"message": "Welcome to the AI Service!"}

# Scrape web page, only load specific tags: h1, h2, h3, p
webloader = WebBaseLoader(
    web_paths=("https://www.bclaws.gov.bc.ca/civix/document/id/complete/statreg/00_96113_01",),
    bs_kwargs=dict(
        parse_only=bs4.SoupStrainer(["h1", "h2", "h3", "p"]),
    ),
)
web_docs = webloader.load()
assert len(web_docs) == 1
print(f"Total characters: {len(web_docs[0].page_content)}")
print(web_docs[0].page_content[:500])

# Split the text into smaller chunks: a list of Document objects
text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, # chunk size (characters)
                                            chunk_overlap=200, # chunk overlap (characters)
                                                add_start_index=True,  # track index in original document
                                                )
web_splits = text_splitter.split_documents(web_docs)
print(f"Split website into {len(web_splits)} sub-documents.")
print(f"Total size: {sys.getsizeof(web_splits)} bytes")

pdfloader = PyPDFLoader("https://www.nslegislature.ca/sites/default/files/legc/statutes/labour%20standards%20code.pdf", mode="page")
pdf_docs = pdfloader.load()
print(len(pdf_docs), "PDF pages loaded.")
pdf_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)

pdf_splits = pdf_splitter.split_documents(pdf_docs)
print(f"Split pdf into {len(pdf_splits)} sub-documents.")
print(f"Total size: {sys.getsizeof(pdf_splits)} bytes")
all_splits = web_splits + pdf_splits

# Convert the Document objects to emmbeddings and upload to Pinecone vector store
def batch_add_documents(vector_store, documents, batch_size=100):
    for i in range(0, len(documents), batch_size):
        batch = documents[i:i + batch_size]
        try:
            vector_store.add_documents(batch)
        except Exception as e:
            print(f"Failed to upload batch {i // batch_size + 1}: {e}")

batch_add_documents(vector_store, all_splits, batch_size=50)

# Load prompt template from LangChain Hub
prompt = hub.pull("rlm/rag-prompt", 
                api_url="https://api.smith.langchain.com")


# Define what data is input and output of the application
class State(TypedDict):
    question: str
    context: List[Document]
    answer: str


# find chunks in vector store that are relevant to the question
# def retrieve(state: State):
#     retrieved_docs = vector_store.similarity_search(state["question"])
#     return {"context": retrieved_docs}

# Put question and the retrieved context into the prompt, and generate an answer using the LLM
# def generate(state: State):
#     docs_content = "\n\n".join(doc.page_content for doc in state["context"])
#     messages = prompt.invoke({"question": state["question"], "context": docs_content})
#     response = llm.invoke(messages)
#     return {"answer": response.content}

@tool(response_format="content_and_artifact")
def retrieve(query: str):
    """Retrieve information related to a query."""
    retrieved_docs = vector_store.similarity_search(query, k=8)
    serialized = "\n\n".join(
        (f"Source: {doc.metadata}\n" f"Content: {doc.page_content}")
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
        "You are an assistant for question-answering tasks. "
        "Use the following pieces of retrieved context to answer "
        "the question. If you don't know the answer, say that you "
        "don't know. Use three sentences maximum and keep the "
        "answer concise."
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


# Build the state graph so that POST /responses can invoke the graph
# with the user question, and return the answer
# graph_builder = StateGraph(State).add_sequence([retrieve, generate])
# graph_builder.add_edge(START, "retrieve")
# graph = graph_builder.compile()

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

config = {"configurable": {"thread_id": "abc123"}}

# param class for user input in POST /responses
class UserMessage(BaseModel):
    province: str
    question: str

@app.post("/responses")
def get_response(userMessage: UserMessage):
    """
    Get a response from the AI model based on the query.
    """
    try:
        # response = graph.invoke({"question": userMessage.question})
        # print(response["answer"])

        for step in graph.stream(
            {"messages": [{"role": "user", "content": userMessage.question}]},
            stream_mode="values",
            config=config,
        ):
            response = step["messages"][-1]
            step["messages"][-1].pretty_print()

        return {"response": response}
    except Exception as e:
        print(f"An error occurred: {e}")
        raise HTTPException(status_code=500, detail=str(e))