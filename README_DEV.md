> 🧭 For non-technical overview and usage instructions, see the main [README.md](./README.md).

# Employee Handbook App (Developer Guide)

## Overview
A web-based AI chatbot platform built to help Canadian workers understand employment rights and company policies. Employers can manage teams, upload documents, and view analytics. Chatbot uses Retrieval-Augmented Generation via LangChain and Pinecone.

## Tech Stack

### Frontend

- **Framework:** Next.js
- **UI Libraries:** React, shadcn/ui
- **Styling:** Tailwind CSS
- **Icons:** Lucide Icons

### Backend & AI

- **Languages:** TypeScript (main app), Python (AI module)
- **NLP Tools:** LangChain, LLM APIs
- **API Routing:** Vercel API Routes

### Storage & Infrastructure

- **Database:** Firebase
- **Vector DB:** Pinecone
- **Authentication:** Clerk
- **Hosting:** Vercel, Railway
- **Monitoring:** Sentry
- **Analytics:** Google Analytics
- **Payment Gateway:** Stripe 
## Tech Architecture

<img src="https://github.com/user-attachments/assets/6c2eacb8-838f-4294-88ca-380eca06c24e" width="700" height="500" />

## Setup, Deployment & Maintenance Guide

This project consists of two parts:

- **Next.js App** — handles most endpoints and the user interface
- **AI Service** — powers the AI chatbot through a separate Python backend

### 1. Next.js App

To start the main app:

```bash
cd employee-handbook-app
npm install
npm run dev
```
To deploy the frontend, connect your GitHub repo to Vercel at https://vercel.com/new. Be sure to add environment variables in the Vercel dashboard.


### 2. AI Service (for chatbot only)

To start the AI backend:

```bash
cd AIService
pip install -r requirements.txt
uvicorn main:app --reload
```
If deploying the AI backend to Railway, make sure to:
- Connect the `AIService/` directory as a Railway project
- Set environment variables in the Railway dashboard
- Expose the service URL and add it as `AI_SERVICE_URL` in the frontend `.env`

To load documents into Pinecone, run the following in a new terminal:

```bash
cd AIService
python scrapeAllData.py   # Scrapes links from providedDocSample.json and saves data to a pickle file
python setup.py           # Uploads data from the pickle file to Pinecone
```

**Note:** These commands should only be run if `providedDocSample.json` has been updated, as they can take a long time to complete.

**Requirements:**

- Node.js and npm
- Python 3.x and pip

**Environment variables:**

Create a `.env` file and put the following keys:

```
# AI + Hosting
AI_SERVICE_URL=<your_AI_service_public_url>
NEXT_PUBLIC_BASE_URL=<your_base_url> # e.g., http://localhost:3000 or your Vercel link

# Sentry
NEXT_PUBLIC_SENTRY_DSN=<your_sentry_dsn>

# Firestore (Public)
NEXT_PUBLIC_FIRESTORE_API_KEY=<your_firestore_api_key>
NEXT_PUBLIC_FIRESTORE_AUTH_DOMAIN=<your_firestore_auth_domain>
NEXT_PUBLIC_FIRESTORE_PROJECT_ID=<your_firestore_project_id>
NEXT_PUBLIC_FIRESTORE_STORAGE_BUCKET=<your_firestore_storage_bucket>
NEXT_PUBLIC_FIRESTORE_MESSAGING_SENDER_ID=<your_firestore_messaging_sender_id>
NEXT_PUBLIC_FIRESTORE_APP_ID=<your_firestore_app_id>
NEXT_PUBLIC_FIRESTORE_MEASUREMENT_ID=<your_firestore_measurement_id>

# Firestore (Server/Admin)
FIRESTORE_API_KEY=<your_firestore_api_key>
FIRESTORE_AUTH_DOMAIN=<your_firestore_auth_domain>
FIRESTORE_PROJECT_ID=<your_firestore_project_id>
FIRESTORE_STORAGE_BUCKET=<your_firestore_storage_bucket>
FIRESTORE_MESSAGING_SENDER_ID=<your_firestore_messaging_sender_id>
FIRESTORE_APP_ID=<your_firestore_app_id>
FIRESTORE_MEASUREMENT_ID=<your_firestore_measurement_id>

# Firebase Admin SDK
FIREBASE_TYPE=service_account
FIREBASE_PROJECT_ID=<your_firebase_project_id>
FIREBASE_PRIVATE_KEY_ID=<your_firebase_private_key_id>
FIREBASE_PRIVATE_KEY=<your_firebase_private_key>
FIREBASE_CLIENT_EMAIL=<your_firebase_client_email>
FIREBASE_CLIENT_ID=<your_firebase_client_id>
FIREBASE_AUTH_URI=<your_firebase_auth_uri>
FIREBASE_TOKEN_URI=<your_firebase_token_uri>
FIREBASE_AUTH_PROVIDER_CERT_URL=<your_firebase_auth_provider_cert_url>
FIREBASE_CLIENT_CERT_URL=<your_firebase_client_cert_url>
FIREBASE_UNIVERSE_DOMAIN=<your_firebase_universe_domain>

# Google
GOOGLE_API_KEY=<your_google_api_key>

# Pinecone
PINECONE_API_KEY=<your_pinecone_api_key>
PINECONE_INDEX_NAME=<your_pinecone_index_name>

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<your_clerk_publishable_key>
CLERK_SECRET_KEY=<your_clerk_secret_key>
CLERK_WEBHOOK_SECRET=<your_clerk_webhook_secret>
CLERK_MODE=<your_clerk_mode> # e.g., development or production

# AWS (used for audio transcription)
AWS_ACCESS_KEY_ID=<your_aws_access_key_id>
AWS_SECRET_ACCESS_KEY=<your_aws_secret_access_key>
AWS_REGION=us-east-2

# Stripe
STRIPE_SECRET_KEY=<your_stripe_secret_key>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<your_stripe_publishable_key>
STRIPE_WEBHOOK_SECRET=<your_stripe_webhook_secret>

# EmailJS
EMAILJS_PUBLIC_KEY=<your_emailjs_public_key>
EMAILJS_PRIVATE_KEY=<your_emailjs_private_key>
EMAILJS_SERVICE_ID=<your_emailjs_service_id>
EMAILJS_TEMPLATE_ID=<your_emailjs_template_id>


```

## Documentation

For API documentation related to the AI service, refer to [`AIService/routes.md`](AIService/routes.md).
For API documentation related to the Next.js app, refer to [`employee-handbook-app/src/app/api/routes.md`](employee-handbook-app/src/app/api/routes.md).

## Deployment Notes for Forked Repository


This project is deployed through a **forked version of the original team repository**:

- Git-based auto-deployment is enabled in Vercel — pushing to the `main` branch of the fork automatically triggers a new deployment.
- However, the fork **does not sync automatically** with the original repo. If updates are made to the original team repository, you’ll need to **manually pull them into the fork** to keep the deployed site up to date.

Be sure to periodically sync the fork if you’re maintaining the production deployment.

## Core Features

- AI Chatbot that answers employee questions
- Public access to general employment laws
- Private, secure login for company-specific policy access
- Document linking and source transparency
- Document uploads, and access to org-specific financial info and analytics
- Accessible on web, mobile, and tablet devices

## AI Feature: Chat Title Generation

### Overview of the Improvement

We added a new AI-powered feature that automatically generates short, descriptive titles for each new chat based on the user’s first message. Previously, chat logs were named generically (e.g., "Chat - 07/10/2025"), making it hard for users to find specific past conversations. With this improvement, titles are generated automatically, improving navigation and usability.

### How to Test the AI Feature

1. Log in to the app and create a new chat.
2. Enter your first message (e.g., “What are the rules for overtime in Ontario?”).
3. The app will send this message to the AI service.
4. Within a few seconds, the chat title in the sidebar will update from a generic name to a meaningful one.
5. A "Generating..." message is briefly displayed while the title is being processed.

> If the AI fails to generate a title (e.g., due to a vague or empty message), the fallback title will be "New Chat".

### Dependencies

This feature builds on existing components already listed in the Tech Stack:

- **LangChain + LLM API (e.g., Gemini or GPT)** – Used to generate chat titles from the first message.
- **FastAPI** – Hosts the AI service and exposes the `/generate-title` endpoint.
- **Firebase** – Used to persist the generated title in the chat document.
- **Next.js (Frontend)** – Sends the user message to the backend and updates the UI with the new title.

### Performance Results

- **Title Accuracy:** Works well for clear questions  
  The AI generates helpful titles when the first message is clear (e.g., “how long a break can be?” → “Break Length Query”). For vague inputs like “Hi”, it still returns a title (e.g., “Simple Hello”), but it's less useful. The feature is reliable and always returns something.

## AI Feature: Voice-to-Text Input

### Overview of the Improvement
This feature introduces a voice-to-text input option for the chatbot, allowing users to speak their questions instead of typing. It enhances accessibility, especially for users with visual impairments or limited mobility, and offers a faster, more natural way to interact with the app. The feature leverages AI-powered speech recognition to transcribe spoken language into text.

### How to Test the AI Feature

1. Go to the deployed application at the [link](https://github.com/csc301-2025-y/project-16-rivvi?tab=readme-ov-file#link-of-the-app) above or run it locally using the [setup instructions](https://github.com/csc301-2025-y/project-16-rivvi?tab=readme-ov-file#setup-for-developers) above.
2. Once you've provided your location, click the mic icon to the left of the input bar to begin recording.
3. Speak your question.
4. Click the mic icon again to stop recording.
5. Wait for your transcription to appear in the input box.
6. You may edit your question, or repeat steps 2–5 to add more text. Once you are satisfied with the text in the box, submit your question by pressing Enter or clicking the search icon to the right of the input bar.

### Dependencies

This feature builds on existing components, as well as incorporates the faster-whisper library, an open-source implementation of OpenAI's Whisper model.

- **faster-whisper** – Used to transcribe audio recordings with the small Whisper model.
- **FastAPI** – Hosts the AI service and exposes the `/transcribe` endpoint.
- **Next.js (Frontend & Backend)** – Frontend sends the audio clip to the backend, which then sends it to the AI service endpoint for transcription.

### Performance Results
- **Transcription Accuracy** - The small faster-whisper model achieves high accuracy on clear, conversational speech with good handling of various accents.
- **Response Time** - Transcription typically completes within 5 seconds for short audio clips (under 30 seconds).
- **Resource Usage** - Running the small faster-whisper model uses minimal system resources, allowing for efficient backend performance.

## AI Feature: Dynamic Graph Explanations for Accessibility

### Overview of the Improvment

We've enhanced web accessibility for visually impaired users by adding AI-generated natural language summaries and bullet-point captions to graphs on the analytics page. As a result, users can understand the information in the graphs without needing to see them.

### How to Test the AI Feature

After the app is started, go to analytics page: http://localhost:3000/analytics

There are two ways to check whether this AI feature is working:

1. Activate the screen reader (on Mac, it's Command + F5. To learn more, check [VoiceOver guide](https://support.apple.com/en-ca/guide/voiceover/vo4be8816d70/10/mac/15.0).) Use Control + Option + Left/Right Arrow keys to navigate to the graph section. After it reads out the title, press Control + Option + Right Arrow again to hear the AI summary. If it says “No AI summary available,” it means the request-per-minute limit has been reached. Wait a minute, then refresh the page.

2. A more straightforward way is to look at the Insights section under the graphs. If the AI fails to generate summaries, you will see “No AI summary available” in that section. Wait a minute, then refresh the page. If everything is working correctly, a few bullet points should appear to represent the insights.

### Dependencies

- **Google Gemini API (JavaScript version)** – Used to generate AI summaries and bullet points.
- **Firebase** – Retrieves information from the database to construct the graph; this data is also included in the prompt sent to the API.
- **Next.js API endpoints** – Exposes the following routes:
  - `/api/ai-summary/bullet-points`
  - `/api/ai-summary/employee-distribution`
  - `/api/ai-summary/employee-registration`
  - `/api/ai-summary/questions-asked`
- **Next.js frontend** – Updates the UI based on the API response.

### Performance Results

Overall, the AI did a good job identifying important trends from the graph and generating the AI summary based on them. The explanation is concise without missing any key information. The bullet points also summarize the explanation very clearly.

## Testing & Edge Case Handling

This project includes a mix of automated test scripts and manual validation.

### Automated Tests

This project uses both **Jest** (for JavaScript/TypeScript) and **Pytest** (for Python) to ensure backend and frontend stability.


#### JavaScript Tests (Jest)
These files follow the format: `**/test/**/*.test.ts`, `**/test/**/*.test.tsx`.

#### Python Tests (Pytest)
Python tests are located in the `AIService/tests` directory.

> GitHub Actions runs both Jest and Pytest on each pull request.  
> This ensures all tests pass before merging into `main`.


### Manual Feature Testing

In addition to code-based checks, the following features were manually tested across different user types:

- Role-based login and dashboard redirects
- Stripe subscription & paywall behavior
- AI chatbot responses and fallback states
- Chat title generation via AI
- Audio transcription and accuracy
- Dashboard functionality:
  - Uploading and managing documents
  - Viewing finances
  - Accessing analytics
  - Adding and managing employees
- Response format handling:
  - Verified correct display of chatbot responses in both card and list formats based on content type


## Support

If you have questions or need help, feel free to [open an issue](https://github.com/csc301-2025-y/project-16-rivvi/issues) on the GitHub repository.

