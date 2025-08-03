import pytest

from fastapi.testclient import TestClient
from main import app  # wherever your FastAPI app is defined

client = TestClient(app)

def test_upload_and_delete_document_real_dependencies():
    # Upload
    upload_response = client.post("/company-document", json={
        "url": "https://www.thewednesdaychef.com/files/plain-vanilla-cake-1.pdf",
        "company": "FastAPITest"
    })
    assert upload_response.status_code == 200

    # Delete
    delete_response = client.patch("/company-document/source", json={
        "url": "https://www.thewednesdaychef.com/files/plain-vanilla-cake-1.pdf",
        "company": "FastAPITest"
    })
    assert delete_response.status_code == 200
    assert delete_response.json()["status"] == "success"