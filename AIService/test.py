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

print("stats",index.describe_index_stats())
print("delete", index.delete(filter={"source": {"$eq": "https://employee-handbook-app.s3.us-east-2.amazonaws.com/1753328192268-0sywwn6a994"}}, namespace=
                             "IsaCompanyTest1")) # namespace is required
