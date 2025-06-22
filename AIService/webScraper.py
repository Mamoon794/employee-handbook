import json
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse, urldefrag
from langchain.schema import Document
from langchain_community.document_loaders import WebBaseLoader, PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
import fitz # PyMuPDF for PDF handling
import io


TARGET_KEYWORDS = [
    "employment", "labour", "wage", "overtime", "termination",
    "hours of work", "holiday", "statutory", "minimum wage", "layoff", "leave"
]
MAX_DEPTH = 2

VISITED = set()

extracted_docs = []

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
def crawl(url, depth=0, max_depth=MAX_DEPTH, base_domain=None):
    if url in VISITED or depth > max_depth:
        return []

    VISITED.add(url)
    print(f"Crawling: {url}")

    try:
        res = requests.get(url, timeout=10)
        res.raise_for_status()

        # add hyperlinks from the PDF
        if url.endswith((".pdf")):
            links = []
            pdf_stream = io.BytesIO(res.content)
            doc = fitz.open(stream=pdf_stream, filetype="pdf")
            for page in doc:
                for link in page.get_links():
                    uri = link.get("uri")
                    if uri:
                        links.append(uri)
            doc.close()
            pdfloader = PyPDFLoader(url, mode="page")
            docs = pdfloader.load()
            for pdf_link in links:
                full_pdf_link = remove_fragment(urljoin(url, pdf_link))
                if get_domain(full_pdf_link) == base_domain and full_pdf_link not in VISITED:
                    docs.extend(crawl(full_pdf_link, depth + 1, max_depth, base_domain))
            splitted_docs = splitter.split_documents(docs)
            return splitted_docs
        # add sublinks from HTML pages
        else:
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
                metadata={"source_url": url, "title": page_title}
            )
            docs = [doc]

            # Recursively crawl sub-links
            for link in soup.find_all("a", href=True):
                full_url = remove_fragment(urljoin(url, link["href"]))
                if get_domain(full_url) == base_domain and full_url not in VISITED:
                    docs.extend(crawl(full_url, depth + 1, max_depth, base_domain))

            splitted_docs = splitter.split_documents(docs)
            return splitted_docs

    except Exception as e:
        print(f"Failed on {url}: {e}")
        return []

# Load seed URLs from a JSON file
def load_seed_urls(json_path):
    with open(json_path, "r") as f:
        data = json.load(f)

    seed_urls = []
    for item in data.get("general", []):
        type = item.get("type")
        if type == "html":
            seed_urls.append(item["url"])

    for province in data.get("provinces", []):
        for doc in province.get("docs", []):
            type = doc.get("type")
            if type == "html":
                seed_urls.append(doc["url"])

    return seed_urls

if __name__ == "__main__":
    # Load your JSON file
    starter_urls = load_seed_urls("providedDocSmallSample.json")

    for url in starter_urls:
        domain = get_domain(url)
        extracted_docs.extend(crawl(url, base_domain=domain))
        print(f"Finished crawling {url}. Found {len(extracted_docs)} documents so far.")

    print(f"Total documents extracted: {len(extracted_docs)}")