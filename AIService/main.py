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
from langchain_community.document_loaders import WebBaseLoader
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langgraph.graph import START, StateGraph
from typing_extensions import List, TypedDict
from pydantic import BaseModel

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
loader = WebBaseLoader(
    web_paths=("https://laws-lois.justice.gc.ca/eng/acts/l-2/FullText.html",),
    bs_kwargs=dict(
        parse_only=bs4.SoupStrainer(["h1", "h2", "h3", "p"]),
    ),
)
docs = loader.load()
assert len(docs) == 1
print(f"Total characters: {len(docs[0].page_content)}")
print(docs[0].page_content[:500])

# Split the text into smaller chunks: a list of Document objects
text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, # chunk size (characters)
                                            chunk_overlap=200, # chunk overlap (characters)
                                                add_start_index=True,  # track index in original document
                                                )
all_splits = text_splitter.split_documents(docs)
print(f"Split blog post into {len(all_splits)} sub-documents.")
print(f"Total size: {sys.getsizeof(all_splits)} bytes")

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
def retrieve(state: State):
    retrieved_docs = vector_store.similarity_search(state["question"])
    return {"context": retrieved_docs}

# Put question and the retrieved context into the prompt, and generate an answer using the LLM
def generate(state: State):
    docs_content = "\n\n".join(doc.page_content for doc in state["context"])
    messages = prompt.invoke({"question": state["question"], "context": docs_content})
    response = llm.invoke(messages)
    return {"answer": response.content}


# Build the state graph so that POST /responses can invoke the graph
# with the user question, and return the answer
graph_builder = StateGraph(State).add_sequence([retrieve, generate])
graph_builder.add_edge(START, "retrieve")
graph = graph_builder.compile()
    
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
        response = graph.invoke({"question": userMessage.question})
        print(response["answer"])

        return {"response": response}
    except Exception as e:
        print(f"An error occurred: {e}")
        raise HTTPException(status_code=500, detail=str(e))