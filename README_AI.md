# Environment Keys Required to Power the Chatbot

These steps will guide you through creating all the **environment keys** needed for the AI Service:

- Create a **Pinecone API Key**
- Create a **Pinecone Index Name**
- Create a **Google Gemini API Key**
- Add them to the project

No coding experience needed — just follow the steps in order.

---

## 1. Create a Pinecone Account

1. **Go to the Pinecone website**
   [https://www.pinecone.io](https://www.pinecone.io)

2. **Click** `Start Building` (or `Sign up` if you see that).

3. **Sign up**

   - You can use your Google account or create a new account with your email and password.
   - For “Company Name,” you can just enter our project name or your own name.

4. **Verify your email**

   - Check your inbox for an email from Pinecone.
   - Click the **verification link** inside.

---

## 2. Get Your Pinecone API Key

1. **Log in** to Pinecone: [https://app.pinecone.io](https://app.pinecone.io)

2. On the left-hand menu, click **API Keys**.

3. In the top-right corner, click **Create API Key**.

4. Name it something simple (e.g., `gail-key`).

5. **Copy the API Key** somewhere safe — you will need it later.

   - It’s a long string of letters and numbers.
   - Treat it like a password: **keep it private**.

---

## 3. Create a Pinecone Index

1. On the left-hand menu, click **Database** → **Indexes**.

2. In the top-right corner, click **Create Index**.

3. Name it something simple (e.g., `gail-index`).

4. If you see a “Custom setting” option at the top-right, **unselect it**.

5. Under **Metric**, choose:

   - Model: **llama-text-embed-v2**
   - Dimension: **768**
   - Leave all other settings as default.

6. Click **Create**.

   - You’ll be taken to a page showing the index details — keep this name handy.

---

## 4. Create a Google Gemini API Key

1. **Go to Google AI Studio**
   [https://aistudio.google.com](https://aistudio.google.com)

2. **Sign in** with your Google account. If you don’t have one, click **Create account** and follow the prompts.

3. Once signed in, click **Get API Key** (or go to **API Keys** in the left-hand menu).

4. Click **Create API Key**.

5. When it asks for location, choose **Google Cloud Project** (it may create one for you automatically).

6. Once your API key appears:

   - **Copy it** somewhere safe.
   - Keep it private (just like the Pinecone key).

---

## 5. Add the Keys to the Project

1. Open the project folder in your code editor.

2. Inside the **AIService** folder, create a file named:

   ```
   .env
   ```

3. Paste in the following lines, replacing `<...>` with your actual keys/names:

   ```env
   PINECONE_API_KEY=<your_pinecone_api_key>
   PINECONE_INDEX_NAME=<your_pinecone_index_name>
   GEMINI_API_KEY=<your_gemini_api_key>
   ```

4. Save the file.

5. 🎉 All done!

---

**Important Notes**

- **API Keys = Passwords.** Keep them safe and never share them in public places.
- If a key is lost or leaked, you can always create a new one from the same menu.
