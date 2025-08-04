import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

@pytest.fixture(scope="module")
def test_doc():
    return {
        "url": "https://www.thewednesdaychef.com/files/plain-vanilla-cake-1.pdf",
        "company": "FastAPITest",
        "thread_id": "test-thread-001",
        "province": "Ontario",
        "question": "How to make a vanilla cake according to my company documents?",
    }


def test_upload_document_real_dependencies(test_doc):
    response = client.post("/company-document", json={
        "url": test_doc["url"],
        "company": test_doc["company"]
    })
    assert response.status_code == 200
    assert response.json()["status"] == "success"


def test_response_real_dependencies(test_doc):
    payload = {
        "province": test_doc["province"],
        "question": test_doc["question"],
        "thread_id": test_doc["thread_id"],
        "company": test_doc["company"]
    }

    response = client.post("/responses", json=payload)
    assert response.status_code == 200
    data = response.json()

    for field in ["publicResponse", "privateResponse", "publicFound", "privateFound", "publicMetadata", "privateMetadata"]:
        assert field in data

    assert isinstance(data["publicResponse"], str)
    assert isinstance(data["privateResponse"], str)
    assert isinstance(data["publicFound"], bool)
    assert isinstance(data["privateFound"], bool)
    assert isinstance(data["publicMetadata"], list)
    assert isinstance(data["privateMetadata"], list)

    # assert data["privateFound"] is True #
    # print("privateResponse: ", data["privateResponse"])


def test_delete_document_real_dependencies(test_doc):
    response = client.patch("/company-document/source", json={
        "url": test_doc["url"],
        "company": test_doc["company"]
    })
    assert response.status_code == 200
    assert response.json()["status"] == "success"
