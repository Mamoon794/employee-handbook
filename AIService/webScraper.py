import json
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
from langchain.schema import Document

TARGET_KEYWORDS = [
    "employment", "labour", "wage", "overtime", "termination",
    "hours of work", "holiday", "statutory", "minimum wage", "layoff", "leave"
]
MAX_DEPTH = 2
VISITED = set()

def is_relevant(text):
    lower_text = text.lower()
    return any(keyword in lower_text for keyword in TARGET_KEYWORDS)

def get_domain(url):
    return urlparse(url).netloc

def clean_text(soup):
    # Remove scripts/styles
    for tag in soup(["script", "style", "nav", "footer", "aside"]):
        tag.decompose()
    return soup.get_text(separator=" ", strip=True)

def crawl(url, depth=0, max_depth=MAX_DEPTH, base_domain=None):
    if url in VISITED or depth > max_depth:
        return []

    VISITED.add(url)
    print(f"Crawling: {url}")

    try:
        res = requests.get(url, timeout=10)
        res.raise_for_status()
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
            full_url = urljoin(url, link["href"])
            if get_domain(full_url) == base_domain and full_url not in VISITED:
                docs.extend(crawl(full_url, depth + 1, max_depth, base_domain))

        return docs

    except Exception as e:
        print(f"Failed on {url}: {e}")
        return []

def load_seed_urls(json_path):
    with open(json_path, "r") as f:
        data = json.load(f)

    seed_urls = []
    for item in data.get("general", []):
        seed_urls.append(item["url"])

    for province in data.get("provinces", []):
        for doc in province.get("docs", []):
            seed_urls.append(doc["url"])
    
    return seed_urls