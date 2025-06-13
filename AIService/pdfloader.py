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

pdfloader = PyPDFLoader("https://www.nslegislature.ca/sites/default/files/legc/statutes/labour%20standards%20code.pdf", mode="page")
pdf_docs = pdfloader.load()
print(len(pdf_docs), "PDF documents loaded.")
# pprint.pp(pdf_docs[0].metadata)
# pprint.pp(pdf_docs[3].metadata)
# pprint.pp(pdf_docs[8].metadata)

# Split each page while preserving metadata (like page number)
pdf_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)

pdf_splits = pdf_splitter.split_documents(pdf_docs)

# Example: Check that page number is still in metadata
# print(pdf_splits[0].metadata)
# print(pdf_splits[1].metadata)
print(pdf_splits[5].metadata)
print(len(pdf_splits), "PDF splits created.")
