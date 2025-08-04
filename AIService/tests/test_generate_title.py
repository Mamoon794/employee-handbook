from fastapi.testclient import TestClient
from main import app  # Make sure this includes your FastAPI app + real llm setup

client = TestClient(app)

def test_generate_title_real_gemini():
    response = client.post("/generate-title", json={
        "message": "Can you help me create a travel itinerary for Japan?",
        "chatId": "testchat001",
        "userId": "usertest001"
    })
    assert response.status_code == 200

    data = response.json()
    assert "title" in data
    assert isinstance(data["title"], str)
    assert len(data["title"]) > 0
    assert data["chatId"] == "testchat001"
    assert data["saved"] is False
