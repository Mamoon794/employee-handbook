### The routes defined for the API

1. **POST /api/public/message**
   - Description: Sends a public user's question, province, and thread ID to the AI service. The service returns a contextual response with relevant citations. The API returns citations including the original URL, a URL with a fragment identifier or text fragment, and the title.
   - Example Body:
     ```json
     {
       "province": "Ontario",
       "query": "What is the minimum wage?",
       "threadId": "1719337314562"
     }
     ```
   - Example Response:
     ```json
     {
       "response": "As of 2025, the minimum wage in Ontario is $16.55 per hour.",
       "citations": [
         {
           "originalUrl": "https://www.cfib-fcei.ca/en/tools-resources/minimum-wage-rates-overtime-rules-canada",
           "fragmentUrl": "https://www.cfib-fcei.ca/en/tools-resources/minimum-wage-rates-overtime-rules-canada",
           "title": "Minimum wage rates and overtime rules in Canada"
         }
       ]
     }
     ```

---

2. **GET /api/users/[userID]**

   - Description: Fetches a user by their ID.
   - Parameters:
     - `userID`: The ID of the user to fetch.
   - Response: Returns the user object.

3. **POST /api/users**

   - Description: Creates a new user.
   - Body: The user object to create.
   - Example Body:

     ```json
     {
       "clerkUserId": "clerk123",
       "firstName": "Test",
       "lastName": "User",
       "primaryEmail": "test@company.com",
       "userType": "Employee",
       "isSubscribed": true,
       "province": "ON",
       "companyId": "",
       "createdAt": "2025-08-03T00:00:00.000Z",
       "updatedAt": "2025-08-03T00:00:00.000Z"
     }
     ```

   - Response: Returns the created user object.

---

4. **POST /api/chat**

   - Description: Saves a chat message with the userID.
   - Body: Create a new chat with no messages:
   - Example Body:
     ```json
     {
       "userId": "abc123",
       "companyId": "company456",
       "createdAt": "2025-08-03T00:00:00.000Z",
       "updatedAt": "2025-08-03T12:34:56.000Z"
     }
     ```
   - Response: Returns the created chat id.

5. **GET /api/chat/[chatID]**

   - Description: Fetches all the chats for a user by the userID
   - Parameters:
     - `userID`: The ID of the user to fetch chats for.
   - Response: Returns an array of chat objects.

6. **DELETE /api/chat/[chatID]**

   - Description: Deletes a chat by its ID.
   - Parameters:
     - `chatID`: The ID of the chat to delete.
   - Response: Returns a success message or confirmation of deletion.

7. **POST /api/chat/[chatID]/add-message**

   - Description: Adds a new message to an existing chat.
   - Parameters:
     - `chatID`: The ID of the chat to which the message will be added.
   - Body: Create a new message with the chatID and messageData:

     ```json
     {
       "chatID": "string", // The ID of the chat
       "messageData": [
         {
           "content": "string", // The message text
           "isFromUser": false, // Indicates if the message is from the user
           "sources": ["string"] // Optional array of cited sources
         }
       ]
     }
     ```

   - Response: Returns the created message object.

---

8. **POST /api/company**

   - Description: Creates a new company.
   - Body: The company object to create.
   - Example Body:
     ```json
     {
       "name": "string",
       "ownerId": "string",
       "createdAt": "2025-08-04T15:30:00Z",
       "updatedAt": "2025-08-04T15:30:00Z"
     }
     ```
   - Response: Returns the created company object.

---

9. **POST /api/ai-summary/bullet-points**

   - Description: Generates bullet points from the provided summary message. Each bullet point starts with "- " and appears on a new line in the response.
   - Body: A JSON object containing the "summary" string to be converted into bullet points.
   - Example Body:
     ```json
     {
       "summary": "This is a summary."
     }
     ```
   - Response: A string with bullet points, each starting with - and separated by new lines.

10. **POST /api/ai-summary/employee-distribution**

    - Description: Generates a concise textual explanation of employee distribution across provinces using the provided data.
    - Body: A JSON object containing an array of province entries. Each entry should include:
      - province: Province abbreviation (e.g., "ON")
      - count: Number of employees
      - percentage: Percentage of total employees
    - Example Body:
      ```json
      {
        "provinceData": [
          {
            "province": "ON",
            "count": 3,
            "percentage": 60
          },
          {
            "province": "NS",
            "count": 2,
            "percentage": 40
          }
        ]
      }
      ```
    - Response: A plain-text summary paragraph, suitable for screen reader users. The explanation is concise, uses full province names, and highlights meaningful comparisons or trends.

11. **POST /api/ai-summary/employee-registration**

    - Description: Generates a concise textual explanation of employee registration across months/days using the provided data.
    - Body: A JSON object containing an array of entries, each with:
      - time: a month (e.g., "April") or a day (e.g., "Monday")
      - employees: Number of employees registered during that time period
    - Example Body:
      ```json
      {
        "employeeRegistrationData": [
          {
            "time": "June",
            "employees": 40
          },
          {
            "time": "July",
            "employees": 46
          }
        ]
      }
      ```
    - Response: A plain-text, concise summary paragraph describing registration trends.

12. **POST /api/ai-summary/questions-asked**
    - Description: Creates a brief summary explaining the trends in the number of questions asked over months or days based on the provided data.
    - Body: A JSON object containing an array of entries, each with:
      - time: a month (e.g., "April") or a day (e.g., "Monday")
      - questionss: Number of questions asked during that time period
    - Example Body:
      ```json
      {
        "questionsAskedData": [
          {
            "time": "June",
            "questions": 12
          },
          {
            "time": "July",
            "questions": 20
          }
        ]
      }
      ```
    - Response: A plain-text, concise summary paragraph highlighting the main trends in the questions asked.

---

**GET /api/analytics/active-users**

- Description: Returns the total number of unique active users (employees) in a company who have participated in chats within the specified date range. An active user is identified by having at least one chat updated within the range.
- Query Parameters:
  - companyId: (string) – Required. The unique ID of the company.
  - startDate: (string) – Required. Start of the date range in YYYY-MM-DD format.
  - endDate: (string) – Required. End of the date range in YYYY-MM-DD format.
- Response: A JSON object containing the total number of active users and the status.

**GET /api/analytics/documents**

- Description: Returns the total number of documents uploaded by a company and how many were newly uploaded within the specified date range.
- Query Parameters:
  - companyId: (string) – Required. The unique ID of the company.
  - startDate: (string) – Required. Start of the date range in YYYY-MM-DD format.
  - endDate: (string) – Required. End of the date range in YYYY-MM-DD format.
- Response: A JSON object containing the total number of uploaded documents and how many were newly uploaded within the specified date range.

**GET /api/analytics/monthly**

- Description: Returns time-based analytics (either daily or monthly) on the number of employees added, questions asked, and documents uploaded by a company within a given date range.
- Query Parameters:
  - companyId: (string) – Required. The unique ID of the company.
  - startDate: (string) – Required. Start of the date range in YYYY-MM-DD format.
  - endDate: (string) – Required. End of the date range in YYYY-MM-DD format.
- Response: A JSON object containing a list of time periods and the counts for each.

**GET /api/analytics/popular-questions**

- Description: Retrieves the most popular (top) questions asked within a company over a specified date range. Results are filtered by the company name and the createdAt timestamp.
- Query Parameters:
  - companyId: (string) – Required. The unique ID of the company.
  - startDate: (string) – Required. Start of the date range in YYYY-MM-DD format.
  - endDate: (string) – Required. End of the date range in YYYY-MM-DD format.
- Response: A JSON object containing a list of top questions within the specified period.

**GET /api/analytics/provinces**

- Description: Returns the total number of employees in a company and their distribution by province, optionally filtered by a date range.
- Query Parameters:
  - companyId: (string) – Required. The unique ID of the company.
  - startDate: (string) – Required. Start of the date range in YYYY-MM-DD format.
  - endDate: (string) – Required. End of the date range in YYYY-MM-DD format.
- Response: A JSON object containing the total number of employees and their distribution by province.

**GET /api/analytics/questions**

- Description: Returns the total number of questions asked by employees in a company, as well as how many of those were asked within a specified date range.
- Query Parameters:
  - companyId: (string) – Required. The unique ID of the company.
  - startDate: (string) – Required. Start of the date range in YYYY-MM-DD format.
  - endDate: (string) – Required. End of the date range in YYYY-MM-DD format.
- Response: A JSON object with the total number of questions and how many were newly asked within the given time frame.

**GET /api/analytics/users**

- Description: Returns the total number of members (including owners, adminstrators, financers, employees) in a company and the number of new members added within a given date range (if provided).
- Query Parameters:
  - companyId: (string) – Required. The unique ID of the company.
  - startDate: (string) – Required. Start of the date range in YYYY-MM-DD format.
  - endDate: (string) – Required. End of the date range in YYYY-MM-DD format.
- Response: A JSON object with total members and new members within the date range.

---

**POST /api/messages/public**

- Description: Handles incoming messages from public users by forwarding them to the AI service for a response. Maintains conversation context using a thread ID.
- Example Body:
  ```json
  {
    "province": "string", // User's selected province
    "query": "string", // User's message or question
    "threadId": "string" // Unique ID for the conversation thread
  }
  ```
- Response: Returns the AI-generated response.

---

**POST /api/vectordb-documents**

- Description: Uploads a file to the vector database (Pinecone). The file is fetched from the provided URL and stored under the specified namespace after being chunked into smaller document segments.
- Example Body:
  ```json
  {
    "fileurl": "https://www.thewednesdaychef.com/files/plain-vanilla-cake-1.pdf",
    "namespace": "IsaCompany"
  }
  ```
- Response: Returns the file URL, namespace (company), number of document chunks stored in the vector DB, and a status indicating success or failure.

**PATCH /api/vectordb-documents**

- Description: Deletes all documents stored under the specified company (namespace) from the vector database.
- Example Body:
  ```json
  {
    "namespace": "IsaCompany"
  }
  ```
- Response: Returns the namespace (company) and a status indicating success or failure.

**PATCH /api/vectordb-documents/source**

- Description: Deletes a specific document (identified by the file URL) from the vector database under the specified company (namespace).
- Example Body:
  ```json
  {
    "fileurl": "https://www.thewednesdaychef.com/files/plain-vanilla-cake-1.pdf",
    "namespace": "IsaCompany"
  }
  ```
- Response: Returns the file URL, namespace (company) and a status indicating success or failure.
