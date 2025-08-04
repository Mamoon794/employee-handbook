**GET /**

- Description: Basic health check endpoint. Returns a welcome message to confirm the AI service is running.
- Example Request: None (simple GET request)
- Response:

  ```json
  {
    "message": "Welcome to the AI Service!"
  }
  ```

**POST /responses**

- Description: Generates an AI-powered response to a user question. Optionally filters based on province and company documents.
- Example Body:

  ```json
  {
    "province": "Ontario",
    "question": "What are the labor laws in Ontario?",
    "thread_id": "1",
    "company": "AcmeCorp"
  }
  ```

- Response: Returns AI-generated responses separated by public documents and company-specific documents, plus metadata and flags indicating if relevant documents were found.

  ```json
  {
    "publicResponse": "...",
    "publicFound": true,
    "publicMetadata": [
      {
        "source": "https://laws-lois.justice.gc.ca/PDF/L-2.pdf",
        "type": "pdf",
        "title": "...",
        "page": 356,
        "content": "..."
      }
    ],
    "privateResponse": "...",
    "privateFound": false,
    "privateMetadata": [
      {
        "source": "[company-doc-url]",
        "type": "pdf",
        "title": "...",
        "page": 10,
        "content": "..."
      }
    ]
  }
  ```

**POST /generate-title**

- Description: Generates a short, descriptive chat title based on the first user message using an LLM.
- Example Body:

  ```json
  {
    "message": "Can you tell me about employee benefits in BC?",
    "chatId": "abc123",
    "userId": "user456"
  }
  ```

- Response: Returns the generated chat title and associated chat ID. Indicates whether the title was saved (currently always false).

  ```json
  {
    "title": "Employee Benefits BC",
    "chatId": "abc123",
    "saved": false
  }
  ```

**POST /company-document**

- Description: Uploads and processes a company document by crawling the provided URL, splitting it into chunks, and indexing it in the vector store under the specified company namespace.
- Example Body:

  ```json
  {
    "url": "https://example.com/docs/employee-handbook.pdf",
    "company": "AcmeCorp"
  }
  ```

- Response: Returns the input URL, company, the number of documents processed, and a success status.

  ```json
  {
    "url": "https://example.com/docs/employee-handbook.pdf",
    "company": "AcmeCorp",
    "company_docs_len": 3,
    "status": "success"
  }
  ```

**PATCH /company-document**

- Description: Deletes all documents associated with the specified company from the vector store.
- Example Body:

  ```json
  {
    "company": "AcmeCorp"
  }
  ```

- Response: Confirms the company whose documents were deleted and a success status.

  ```json
  {
    "company": "AcmeCorp",
    "status": "success"
  }
  ```

**PATCH /company-document/source**

- Description: Deletes a specific document from the vector store by its source URL and associated company.
- Example Body:

  ```json
  {
    "url": "https://example.com/docs/employee-handbook.pdf",
    "company": "AcmeCorp"
  }
  ```

- Response: Confirms the URL and company of the deleted document and a success status.

  ```json
  {
    "url": "https://example.com/docs/employee-handbook.pdf",
    "company": "AcmeCorp",
    "status": "success"
  }
  ```

**POST /transcribe**

- Description: Accepts an audio file upload and returns the transcription of the spoken content using the Whisper speech-to-text model.
- Supported File Types: `audio/mpeg`, `audio/wav`, `audio/x-m4a`, `audio/mp4`
- Example Request: Upload form-data with an audio file field named `file`.
- Response:

  ```json
  {
    "language": "en",
    "confidence": 0.98,
    "transcript": "This is the transcribed text from the audio."
  }
  ```

**GET /popular-questions**

- Description: Retrieves a list of popular questions currently stored in the vector database.
- Example Request: None (simple GET)
- Response:

  ```json
  {
    "popular_questions": [
      "What are the company vacation policies?",
      "How do I reset my password?"
    ]
  }
  ```
