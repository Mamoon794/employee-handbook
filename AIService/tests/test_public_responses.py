import pytest

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_get_response_real_dependencies():
    payload = {
        "province": "Ontario",
        "question": "What are the vacation entitlements in Ontario?",
        "thread_id": "test-thread-001",
        "company": ""
    }

    response = client.post("/responses", json=payload)
    assert response.status_code == 200
    data = response.json()

    # These assertions depend on your AI and doc response
    assert "publicResponse" in data
    assert "privateResponse" in data
    assert "publicFound" in data
    assert "privateFound" in data
    assert "publicMetadata" in data
    assert "privateMetadata" in data

    assert isinstance(data["publicResponse"], str)
    assert isinstance(data["privateResponse"], str)
    assert isinstance(data["publicFound"], bool)
    assert isinstance(data["privateFound"], bool)
    assert isinstance(data["publicMetadata"], list)
    assert isinstance(data["privateMetadata"], list)