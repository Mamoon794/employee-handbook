import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse, urldefrag
from langchain.schema import Document
from langchain_community.document_loaders import WebBaseLoader, PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
import fitz # PyMuPDF for PDF handling
import io
from config import vector_store, index

TARGET_KEYWORDS = [
    "employment", "labour", "wage", "overtime", "termination",
    "hours of work", "holiday", "statutory", "minimum wage", "layoff", "leave"
]
MAX_DEPTH = 2

VISITED = set()

splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200, add_start_index=True)

def is_relevant(text):
    # lower_text = text.lower()
    # return any(keyword in lower_text for keyword in TARGET_KEYWORDS)
    return True

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
def crawl_company_docs(url, company, namespace="General", depth=0, max_depth=MAX_DEPTH, domain=None):
    if url in VISITED or depth > max_depth:
        return []

    VISITED.add(url)
    print(f"Crawling: {url}")

    try:
        headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        }
        res = requests.get(url, headers=headers, timeout=10)
        res.raise_for_status()
        content_type = res.headers.get("Content-Type", "")
        if "application/pdf" not in content_type.lower():
            urlType = "html"
        else:
            urlType = "pdf"

        # add hyperlinks from the PDF
        if urlType == "pdf":
            # print("url is a PDF:", url)
            links = []
            # use fitz to extract links from the PDF
            if url.startswith("http") or url.startswith("https"):
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
                page.metadata["namespace"] = namespace
                page.metadata["company"] = company
            for pdf_link in links:
                full_pdf_link = remove_fragment(urljoin(url, pdf_link))
                if domain == get_domain(full_pdf_link) and full_pdf_link not in VISITED:
                    docs.extend(crawl_company_docs(full_pdf_link, company, namespace, depth + 1, max_depth, domain=domain))
            splitted_docs = splitter.split_documents(docs)
            return splitted_docs
        # add sublinks from HTML pages
        else:
            # print("url is a website:", url)
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
            }
            res = requests.get(url, headers=headers, timeout=10)
            res.raise_for_status()
            if url.endswith(".xml"):
                return []
            soup = BeautifulSoup(res.content, "html.parser")
            page_text = clean_text(soup)
            # print("Page text: ", page_text[:500])
            page_title = soup.title.string.strip() if soup.title else ""

            if not is_relevant(page_text):
                return []

            # Build LangChain Document
            doc = Document(
                page_content=page_text,
                metadata={"type": "html", "source": url, "title": page_title, "namespace": namespace, "company": company}
            )
            docs = [doc]
            for link in soup.find_all("a", href=True):
                full_url = remove_fragment(urljoin(url, link["href"]))
                if domain == get_domain(full_url) and full_url not in VISITED and not "/fr/" in full_url:
                    docs.extend(crawl_company_docs(full_url, company, namespace, depth + 1, max_depth, domain=domain))

            splitted_docs = splitter.split_documents(docs)
            return splitted_docs

    except Exception as e:
        print(f"Failed on {url}: {e}")
        return []
    
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