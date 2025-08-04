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

1. **POST /api/messages/private**
   - Description: Sends a public user's question, province, thread ID, and company to the AI service. The service returns two types of responses, one based on public documentation, and another based on private company documentation, each with relevant citations. The API returns the public and private responses, as well as their citations, each including the original URL, a URL with a fragment identifier or text fragment, and the title.
   - Example Body:
     ```json
     {
       "province": "Ontario",
       "query": "What is the minimum wage?",
       "threadId": "1719337314562",
       "company": "MyCompany"
     }
     ```
   - Example Response:
     ```json
    {
      "publicResponse": "According to relevant legal guidance, the minimum hourly rate in Canada is $15.",
      "publicSources": [
        {
          "originalUrl": "https://novascotia.ca/lae/employmentrights/docs/LabourStandardsCodeGuide.pdf",
          "fragmentUrl": "https://novascotia.ca/lae/employmentrights/docs/LabourStandardsCodeGuide.pdf#page=7",
          "title": ""
        },
        {
          "originalUrl": "https://novascotia.ca/lae/employmentrights/minimumwage.asp",
          "fragmentUrl": "https://novascotia.ca/lae/employmentrights/minimumwage.asp#:~:text=30)%20each%20week.%20If%20the%20employer%20takes%20%2425%20off%20the",
          "title": "Minimum Wage | novascotia.ca"
        },
        {
          "originalUrl": "https://laws-lois.justice.gc.ca/PDF/L-2.pdf",
          "fragmentUrl": "https://laws-lois.justice.gc.ca/PDF/L-2.pdf#page=202",
          "title": ""
        }
      ],
      "privateResponse": "Based on the employee manual, there is no information about minimum wage.",
      "privateSources": [
        {
          "originalUrl": "https://employee-handbook-app.s3.us-east-2.amazonaws.com/1754240707501-cyikl7l62ym",
          "fragmentUrl": "https://employee-handbook-app.s3.us-east-2.amazonaws.com/1754240707501-cyikl7l62ym#page=2",
          "title": "Course Syllabus"
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

9. **POST /api/ai-summary/bullet-points**

   - Description: Generates bullet points from the provided summary message. Each bullet point starts with "- " and appears on a new line in the response.
   - Body: A JSON object containing the "summary" string to be converted into bullet points.
   - Example Body:
     ```json
     summary: string;
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

12. **GET /api/popular-questions/job**
    - Description: Cron job which calls the FastAPI GET /popular-questions endpoint and gets all popular questions, with 3 popular questions for each scope (i.e. gets popular questions for all province/company combinations). These documents are saved to Firestore in the popular_questions collection. This job would run every Friday at 12:00am.
    - Response: Returns whether the job was a success and the number of popular questions saved to the database.
    - Example Response:
    ```json
    { 
      "success": true, 
      "count": 10
    }
    ```

12. **POST /api/popular-questions**
    - Description: Fetches popular questions for the user's province/company from Firestore.
    - Body: A JSON object containing the user's company and province. If the user is public, company is an empty string.
    - Example Body:
      ```json
      {
        "company": "MyCompany",
        "province": "Ontario"
      }
      ```
    - Response: A list of popular questions.
    - Example Response:
    ```json
    [
      "What guidelines should a worker follow?",
      "What are the rights of employees?",
      "What guidelines should an employer follow?"
    ]
    ```