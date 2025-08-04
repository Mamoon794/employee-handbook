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
       "chatID": "string",
       "messageData": [
         {
           "content": "string",
           "isFromUser": false,
           "sources": ["string"]
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

9.  **PUT /api/company/docs**

**Description:**  
Adds current company documents by providing a `companyId` and a list of documents to be added.

**Request Body:**
```json
companyId: string
documents: list[Document]
```

**Response:**  
Returns whether the update was successful.


10. **DELETE /api/company/docs**

**Description:**  
Removes a specific document from a company's record by providing the `companyId` and the index of the document.

**Request Body:**
```json
companyId: string
index: integer
```

**Example:**
```json
companyId: "12345"
index: 1
```

**Response:**  
Returns whether the deletion was successful.

11. **GET /api/company/docs/{companyId}**

**Description:**  
Retrieves the list of documents associated with a specific company.

**Path Parameters:**
- `companyId` (string): Unique identifier of the company.

**Example Request:**
```
GET /api/company/docs/12345
```

**Example Response:**
```json
{
  "companyId": "12345",
  "documents": [
    {
      "documentId": "doc1",
      "name": "Document Name 1",
      "type": "pdf",
      "createdDate": "2023-01-01"
    },
    {
      "documentId": "doc2",
      "name": "Document Name 2",
      "type": "docx",
      "createdDate": "2023-02-15"
    }
  ]
}
```

12.  **POST /api/s3/upload**

**Description:**  
Uploads a document to an S3 bucket using the provided `formData`, `bucketName`, and `contentType`.

**Request Body:**
- `formData`: The binary data of the document (multipart/form-data)
- `bucketName`: Name of the S3 bucket
- `contentType`: MIME type (e.g., `application/pdf`, `image/jpeg`)

**Example (form fields):**
```
formData: (binary)
bucketName: "my-s3-bucket"
contentType: "application/pdf"
```

**Response:**  
Returns the status of the upload and the URL if successful.

13. **POST /api/s3/new-bucket**

**Description:**  
Creates a new S3 bucket with the specified `bucketName`.

**Request Body:**
```json
{
  "bucketName": "new-s3-bucket"
}
```

**Response:**  
Returns the status of the bucket creation operation, including a success message if successful.

14. **POST /api/ai-summary/bullet-points**

   - Description: Generates bullet points from the provided summary message. Each bullet point starts with "- " and appears on a new line in the response.
   - Body: A JSON object containing the "summary" string to be converted into bullet points.
   - Example Body:
     ```json
     {
       "summary": "This is a summary."
     }
     ```
   - Response: A string with bullet points, each starting with - and separated by new lines.

15. **POST /api/ai-summary/employee-distribution**

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

16. **POST /api/ai-summary/employee-registration**

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

17. **POST /api/ai-summary/questions-asked**
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
    "province": "string",
    "query": "string",
    "threadId": "string"
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

---

**POST /api/stripe/checkout**

   - Description: Creates a Stripe checkout session for premium access to employee handbook features. Requires user authentication and creates a payment session for $9.99 USD.
   - Authentication: Required (Clerk authentication)
   - Body: None required
   - Response: Returns a checkout URL to redirect the user to Stripe's payment page.
   - Example Response:
     ```json
     {
       "url": "https://checkout.stripe.com/pay/cs_test_..."
     }
     ```
   - Error Responses:
     - `401 Unauthorized`: User is not authenticated
     - `500 Internal Server Error`: Failed to create checkout session

**POST /api/stripe/webhook**

   - Description: Handles Stripe webhook events to process payment confirmations and update user subscription status. Verifies webhook signature for security and processes `checkout.session.completed` and `payment_intent.succeeded` events.
   - Authentication: Webhook signature verification required
   - Body: Raw Stripe webhook event data (handled internally by Stripe)
   - Headers Required:
     - `stripe-signature`: Stripe webhook signature for verification
   - Supported Events:
     - `checkout.session.completed`: Updates user subscription status when payment is completed
     - `payment_intent.succeeded`: Handles successful payment intent events
   - Response: Returns confirmation that the webhook was received.
   - Example Response:
     ```json
     {
       "received": true
     }
     ```
   - Error Responses:
     - `400 Bad Request`: Invalid webhook signature
     - `500 Internal Server Error`: Webhook handler failed

18. **GET /api/accept-invitation**
    - Description: Takes care of accepting invitations by verifying it, checking user auth, updating respective company information, and redirecting the user to chat upon success. Redirects to login if user can't be authenticated. Redirects to invalid-invitation if invitation is no longer pending or email doesn't match.
    - Parameters:
      - invitationId: The ID of the invitation to accept (query parameter)
    - Response: Redirect responses to various pages depending on validation

19. **POST /api/clerk-webhook**
    - Description: Allows for syncing of Clerk user data with Firestore database
    - Events handled:
      - user.created: creates user in database
      - user.updated: updates user in database
      - user.deleted: deletes user from database
    - Headers Required:
      - svix-id
      - svix-timestamp
      - svix-signature
    - Response:
      - Success: { message: "Webhook processed" }
      - Error: { error: "Error message" }

20. **POST /api/expire-invite**
    - Description: Makes an invitation expire by status update.
    - Body: The invitation id of the given invitation
    - Example Body:
      ```json
      {
        "invitationId": "kEvXJJuA8OaYsOA5IBTh"
      }
      ```
    - Response:
      - Success: { success: true }
      - Error: { error: "Error message" }

21. **POST /api/generate-title**
    - Description: uses the first message in a chat to generate a title
    - Body: The message, chatId and userId
      ```json
      {
        "message": "string",
        "chatId": "string",
        "userId": "string"
      }
      ```
    - Example Body:
      ```json
      {
        "message": "I'm not feeling well. How many sick days do I have?",
        "chatId": "8KLCEctC9jsk0eDkFkmd",
        "userId": "ereLwj40wKa5DqRb16Z3"
      }
      ```
    - Example Response: 
      ```json
      {
        "title": "Sick Days Request"
      }
      ```

22. **GET /api/get-accepted-invites**
    - Description: Retrieves the accepted invites from a single company
    - Parameters:
      - companyId: the ID of the company (query parameter)
    - Response: Array of the accepted invitation objects
    - Error Message: { error: "Error message" } occurs if companyId is not provided/query fails

23. **GET /api/get-pending-invites**
    - Description: Retrieves all the pending invites for a given company
    - Parameters:
      - companyId: the ID of the company (query parameter)
    - Response: Array of the accepted invitation objects
    - Error Message: { error: "Error message" } occurs if companyId is not provided/query fails

24. **GET /api/getCompanyInfo**
    - Description: Retrieves company information for the authenticated user
    - Authentication: Required Clerk (user) authentication
    - Response:
      ```json
      {
        "companyId": "string",
        "companyName": "string"
      }
      ```
    - Errors:
      - 401: User unauthenticated
      - 404: Company not found
      - 500: Server error

25. **POST /api/send-invitation**
    - Description: Sends an invitation for joining the company
    - Authentication: Required Clerk (user) authentication
    - Body:
      ```json
      {
        "email": "string",
        "companyId": "string",
        "companyName": "string",
        "userId": "string"
      }
      ```
    - Validations:
      - Check for if email has an account
      - Check for if user already belongs to a company
    - Response:
      - Success: { success: true, invitationId: "string" }
      - Errors:
          - 400: Email not found/User already in company
          - 500: Server error

26. **POST /api/update-title**
    - Description: Updates chat title
    - Body:
      ```json
      {
        "chatId": "string",
        "title": "string"
      }
      ```
    - Response: 
      - Success: { success: true }
      - Error: { error: "Error message" } (on failure)
