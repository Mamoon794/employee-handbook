### The routes defined for the API
1. **GET /api/users/[userID]**
   - Description: Fetches a user by their ID.
   - Parameters:
     - `userID`: The ID of the user to fetch.
   - Response: Returns the user object.
2. **POST /api/users**
    - Description: Creates a new user.
    - Body: The user object to create.
    - Example Body:
        ```json
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


3. **POST /api/chat**
	- Description: Saves a chat message with the userID.
	- Body: Create a new chat with no messages:
      ```json
        userId: string; 
        companyId?: string; 
        createdAt: Date;
        updatedAt: Date;
      ```   
    - Response: Returns the created chat id.

4. **GET /api/chat/[chatID]**
	- Description: Fetches all the chats for a user by the userID
	- Parameters:
		- `userID`: The ID of the user to fetch chats for.
	- Response: Returns an array of chat objects.
  

5. **POST /api/chat/messages**
	- Description: Saves a message with chatID and messageData.
	- Body: Create a new message with the chatID and messageData:
	  ```json
		chatId: string; 
		messageData: {
			chatId: string; // references chat
			content: string;
			isFromUser: boolean;
			sources?: string[]; // for any cited sources
			createdAt: Date;
		}
	  ```
	- Response: Returns the created message object.

6. **POST /api/company**
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

