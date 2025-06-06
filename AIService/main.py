from fastapi import FastAPI, HTTPException
from dotenv import load_dotenv
import os
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

load_dotenv()

if not os.environ.get("GOOGLE_API_KEY"):
    print("Please set the GOOGLE_API_KEY environment variable.")

if not os.environ.get("PINECONE_API_KEY"):
    print("Please set the GOOGLE_API_KEY environment variable.")
pc_api_key = os.environ.get("PINECONE_API_KEY")

if not os.environ.get("PINECONE_INDEX_NAME"):
    print("Please set the PINECONE_INDEX_NAME environment variable.")
index_name = os.environ.get("PINECONE_INDEX_NAME")

llm = init_chat_model("gemini-2.0-flash", model_provider="google_genai")
embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")

pc = Pinecone(api_key=pc_api_key)
index = pc.Index(index_name)

vector_store = PineconeVectorStore(embedding=embeddings, index=index)

app = FastAPI()

@app.get("/")
def root():
    return {"message": "Welcome to the AI Service!"}

class UserMessage(BaseModel):
    question: str

loader = WebBaseLoader(
    web_paths=("https://www.ontario.ca/document/your-guide-employment-standards-act-0",),
    bs_kwargs=dict(
        parse_only=bs4.SoupStrainer(
            tags=("h1", "h2", "h3", "p"),
            # class_=("post-content", "post-title", "post-header")
        )
    ),
)
docs = loader.load()
assert len(docs) == 1
print(f"Total characters: {len(docs[0].page_content)}")
print(docs[0].page_content[:500])

text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, # chunk size (characters)
                                            chunk_overlap=200, # chunk overlap (characters)
                                                add_start_index=True,  # track index in original document
                                                )
all_splits = text_splitter.split_documents(docs)
print(f"Split blog post into {len(all_splits)} sub-documents.")

# Index chunks
_ = vector_store.add_documents(documents=all_splits)

# Define prompt for question-answering
# N.B. for non-US LangSmith endpoints, you may need to specify
# api_url="https://api.smith.langchain.com" in hub.pull.
prompt = hub.pull("rlm/rag-prompt", 
                api_url="https://api.smith.langchain.com")


# Define state for application
class State(TypedDict):
    question: str
    context: List[Document]
    answer: str


# Define application steps
def retrieve(state: State):
    retrieved_docs = vector_store.similarity_search(state["question"])
    return {"context": retrieved_docs}


def generate(state: State):
    docs_content = "\n\n".join(doc.page_content for doc in state["context"])
    messages = prompt.invoke({"question": state["question"], "context": docs_content})
    response = llm.invoke(messages)
    return {"answer": response.content}


# Compile application and test
graph_builder = StateGraph(State).add_sequence([retrieve, generate])
graph_builder.add_edge(START, "retrieve")
graph = graph_builder.compile()
    

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