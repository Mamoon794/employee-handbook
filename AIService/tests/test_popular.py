from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_get_popular_questions_real_dependency():
    response = client.get("/popular-questions")
    assert response.status_code == 200

    data = response.json()
    assert "popular_questions" in data
    questions = data["popular_questions"]
    assert isinstance(questions, list)

    if questions:
        for q in questions:
            assert isinstance(q, dict), f"Expected dict, got {type(q)}"
            assert "province" in q, "Missing 'province' field"
            assert "company" in q, "Missing 'company' field"
            assert "text" in q, "Missing 'text' field"