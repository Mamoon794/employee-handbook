"""webScraper.py
This script crawls a set of URLs to extract relevant documents related to employment law.
It identifies HTML and PDF documents, extracts text, and saves the results in a structured
format in a pickle file."""

import json
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse, urldefrag
from langchain.schema import Document
from langchain_community.document_loaders import WebBaseLoader, PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
import fitz # PyMuPDF for PDF handling
import io
import pickle


TARGET_KEYWORDS = [
    "employment", "labour", "wage", "overtime", "termination",
    "hours of work", "holiday", "statutory", "minimum wage", "layoff", "leave"
]
MAX_DEPTH = 2

VISITED = set()

splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200, add_start_index=True)

def is_relevant(text):
    lower_text = text.lower()
    return any(keyword in lower_text for keyword in TARGET_KEYWORDS)

def remove_fragment(url):
    """
    Remove URL fragment (the part after #) if it exists.
    """
    return urldefrag(url)[0]

def get_domain(url):
    return urlparse(url).netloc

def clean_text(soup):
    # Remove scripts/styles
    for tag in soup(["script", "style", "nav", "footer", "aside"]):
        tag.decompose()
    return soup.get_text(separator=" ", strip=True)

def extract_pdf_links(pdf_url):
    links = []
    try:
        response = requests.get(pdf_url)
        response.raise_for_status()
        with open("temp.pdf", "wb") as f:
            f.write(response.content)
        doc = fitz.open("temp.pdf")
        for page in doc:
            for link in page.get_links():
                uri = link.get("uri")
                if uri:
                    links.append(uri)
        doc.close()
    except Exception as e:
        print(f"Failed to extract links from {pdf_url}: {e}")
    return links

# returns a list of LangChain Documents from the crawled URL
def crawl(url, namespace="General", depth=0, max_depth=MAX_DEPTH, domain=None):
    if url in VISITED or depth > max_depth:
        return []

    VISITED.add(url)
    # print(f"Crawling: {url}")

    try:
        # add hyperlinks from the PDF
        if url.endswith((".pdf")):
            # print("url is a PDF:", url)
            links = []
            # use fitz to extract links from the PDF
            if url.startswith("http") or url.startswith("https"):
                res = requests.get(url, timeout=10)
                res.raise_for_status()
                pdf_stream = io.BytesIO(res.content)
                doc = fitz.open(stream=pdf_stream, filetype="pdf")
            else:
                doc = fitz.open(url)
            for page in doc:
                for link in page.get_links():
                    uri = link.get("uri")
                    if uri:
                        links.append(uri)
            doc.close()
            # make a langchain Document from the PDF
            pdfloader = PyPDFLoader(url, mode="page")
            docs = pdfloader.load()
            for page in docs:
                page.metadata["type"] = "pdf"
            for pdf_link in links:
                full_pdf_link = remove_fragment(urljoin(url, pdf_link))
                if domain == get_domain(full_pdf_link) and full_pdf_link not in VISITED:
                    docs.extend(crawl(full_pdf_link, namespace, depth + 1, max_depth, domain=domain))
            splitted_docs = splitter.split_documents(docs)
            return splitted_docs
        # add sublinks from HTML pages
        else:
            # print("url is a website:", url)
            res = requests.get(url, timeout=10)
            res.raise_for_status()
            if url.endswith(".xml"):
                return []
            soup = BeautifulSoup(res.content, "html.parser")
            page_text = clean_text(soup)
            page_title = soup.title.string.strip() if soup.title else ""

            if not is_relevant(page_text):
                return []

            # Build LangChain Document
            doc = Document(
                page_content=page_text,
                metadata={"type": "html", "source": url, "title": page_title, "namespace": namespace}
            )
            docs = [doc]
            for link in soup.find_all("a", href=True):
                full_url = remove_fragment(urljoin(url, link["href"]))
                if domain == get_domain(full_url) and full_url not in VISITED and not "/fr/" in full_url:
                    docs.extend(crawl(full_url, namespace, depth + 1, max_depth, domain=domain))

            splitted_docs = splitter.split_documents(docs)
            return splitted_docs

    except Exception as e:
        print(f"Failed on {url}: {e}")
        return []

# Load seed URLs from a JSON file
def crawl_seed_urls(json_path):
    with open(json_path, "r") as f:
        data = json.load(f)

    for item in data.get("General", []):
        url = item.get("url")
        domain = get_domain(url)
        docs = crawl(url, namespace="General", domain=domain)
        extracted_docs.setdefault("General", []).extend(docs)

    for province in data.get("provinces", []):
        for doc in province.get("docs", []):
            url = doc.get("url")
            domain = get_domain(url)
            docs = crawl(url, namespace=province["name"], domain=domain)
            extracted_docs.setdefault(province["name"], []).extend(docs)

    return

if __name__ == "__main__":
    extracted_docs = {}

    # Load your JSON file
    crawl_seed_urls("providedDocSample.json")

    # with same domain restriction: 21687, without domain restriction: 27398
    print(f"Total documents extracted: {len(extracted_docs)}")
    for namespace, docs in extracted_docs.items():
        print(f"number of documents in namespace '{namespace}': {len(docs)}")

    # Save the extracted documents to a pickle file
    with open("extracted_docs.pkl", "wb") as f:
        pickle.dump(extracted_docs, f)

    # print("Extracted documents:", extracted_docs)