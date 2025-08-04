from fastapi.testclient import TestClient
from main import app  # adjust to wherever your FastAPI app is
import re

client = TestClient(app)

def normalize(text: str) -> str:
    """Lowercase and remove non-alphanumeric characters except spaces."""
    return re.sub(r"[^\w\s]", "", text.lower())

def test_transcribe_audio_success():
    test_audio_path = "tests/assets/hello_world.wav"

    with open(test_audio_path, "rb") as f:
        response = client.post(
            "/transcribe",
            files={"file": ("hello_world.wav", f, "audio/wav")}
        )
    
    assert response.status_code == 200
    data = response.json()
    assert "language" in data
    assert "confidence" in data
    assert "transcript" in data

    transcript = data["transcript"]
    assert isinstance(transcript, str)
    assert len(transcript) > 0

    normalized = normalize(transcript)
    assert "hello world" in normalized, f"Transcript did not contain 'hello world': {transcript}"

