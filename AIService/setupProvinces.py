from config import llm, vector_store, index

import time
import bs4
from langchain_community.document_loaders import WebBaseLoader, PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

import pickle

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

if __name__ == "__main__":
    # Load your JSON file
    # with open("providedDocSample.json") as f:
    #     allData = json.load(f)

    with open("extracted_docs.pkl", "rb") as f:
        allData = pickle.load(f)

    index_documents()
    print("Indexing completed.")