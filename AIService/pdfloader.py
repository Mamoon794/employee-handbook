from fastapi import FastAPI, HTTPException
from dotenv import load_dotenv
import os
import sys
import time
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

load_dotenv()

if not os.environ.get("GOOGLE_API_KEY"):
    print("Please set the GOOGLE_API_KEY environment variable.")

if not os.environ.get("PINECONE_API_KEY"):
    print("Please set the GOOGLE_API_KEY environment variable.")
pc_api_key = os.environ.get("PINECONE_API_KEY")

if not os.environ.get("PINECONE_INDEX_NAME"):
    print("Please set the PINECONE_INDEX_NAME environment variable.")
index_name = os.environ.get("PINECONE_INDEX_NAME")

pc = Pinecone(api_key=pc_api_key)
index = pc.Index(index_name)

# print("Clear all")

# index.delete(delete_all=True, namespace="Nova Scotia")
# index.delete(delete_all=True, namespace="Yukon")

print("Before usperting docs into vectore db", index.describe_index_stats())

embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
vector_store = PineconeVectorStore(embedding=embeddings, index=index)

results = vector_store.similarity_search("board's meaning", k=3, namespace="Isa")
print("results: ", results)

# pdfloader = PyPDFLoader("https://www.nslegislature.ca/sites/default/files/legc/statutes/labour%20standards%20code.pdf", mode="page")
# pdf_docs = pdfloader.load()
# print(len(pdf_docs), "PDF documents loaded.")
# # print("pdf_docs: ", pdf_docs)
# # print("pdf_docs[0]: ", pdf_docs[0])
# # pprint.pp(pdf_docs[0].metadata)
# # pprint.pp(pdf_docs[3].metadata)
# # pprint.pp(pdf_docs[8].metadata)

# # Split each page while preserving metadata (like page number)
# pdf_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)

# pdf_splits = pdf_splitter.split_documents(pdf_docs)

# # Example: Check that page number is still in metadata
# # print("pdf splits: ", pdf_splits)
# # print("pdf_splits[0]: ", pdf_splits[0])
# # print("pdf splits[0].metadata: ", pdf_splits[0].metadata)
# # print(pdf_splits[1].metadata)
# # print(pdf_splits[5].metadata)
# print(len(pdf_splits), "PDF splits created.")

# vector_store.add_documents(pdf_splits, namespace="Nova Scotia")
# print("PDF splits added to vector store's Nova Scotia namespace.")

# pdfloader = PyPDFLoader("https://laws.yukon.ca/cms/images/LEGISLATION/PRINCIPAL/2002/2002-0072/2002-0072.pdf", mode="page")
# pdf_docs = pdfloader.load()
# print(len(pdf_docs), "PDF documents loaded.")
# pdf_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
# pdf_splits = pdf_splitter.split_documents(pdf_docs)
# print(len(pdf_splits), "PDF splits created.")
# vector_store.add_documents(pdf_splits, namespace="Yukon")
# print("PDF splits added to vector store's Yukon namespace.")

# time.sleep(8)  # Wait for Pinecone to index the documents

# print("After upserting docs", index.describe_index_stats())