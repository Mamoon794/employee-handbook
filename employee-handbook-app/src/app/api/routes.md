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
     clerkUserId: string; // references Clerk user ID
     firstName: "Test",
     lastName: "User",
     primaryEmail: "test@company.com",
     userType: "Employee",
     isSubscribed: true,
     province: "ON",
     companyId: "",
     createdAt: new Date(),
     updatedAt: new Date()
     ```
   - Response: Returns the created user object.

---

4. **POST /api/chat**

   - Description: Saves a chat message with the userID.
   - Body: Create a new chat with no messages:
     ```json
       userId: string;
       companyId?: string;
       createdAt: Date;
       updatedAt: Date;
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
     chatID: string;
     messageData:
     	content: string;
     	isFromUser: boolean;
     	sources?: string[]; // for any cited sources

     ```

   - Response: Returns the created message object.

---

8. **POST /api/company**

   - Description: Creates a new company.
   - Body: The company object to create.
   - Example Body:
     ```json
     name: string;
     ownerId: string; // references user
     createdAt: Date;
     updatedAt: Date;
     ```
     - Response: Returns the created company object.
    
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
     summary: string;
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

18. **GET /api/accept-invitation**
    - Description: Takes care of accepting invitations by verifying it, checking user auth, updating respective company information, and redirecting the user to chat upon success. Redirects to login if user can't be authenticated. Redirects to invalid-invitation if invitation is no longer pending or email doesn't match.
    - Parameters:
      - invitationId: The ID of the invitation to accept (query parameter)
    - Response: Redirect responses to various pages depending on validation

14. **POST /api/clerk-webhook**
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

19. **POST /api/expire-invite**
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

20. **POST /api/generate-title**
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

21. **GET /api/get-accepted-invites**
    - Description: Retrieves the accepted invites from a single company
    - Parameters:
      - companyId: the ID of the company (query parameter)
    - Response: Array of the accepted invitation objects
    - Error Message: { error: "Error message" } occurs if companyId is not provided/query fails

18. **GET /api/get-pending-invites**
    - Description: Retrieves all the pending invites for a given company
    - Parameters:
      - companyId: the ID of the company (query parameter)
    - Response: Array of the accepted invitation objects
    - Error Message: { error: "Error message" } occurs if companyId is not provided/query fails

19. **GET /api/getCompanyInfo**
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

22. **POST /api/send-invitation**
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

23. **POST /api/update-title**
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
