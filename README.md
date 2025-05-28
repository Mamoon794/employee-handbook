# Employee Handbook App

## Overview

The **Employee Handbook App** is a web-based platform that helps workers understand their rights and company policies using an AI-powered chatbot. It features both public and private access levels, providing support for general legal information and organization-specific policies.

Our partner is **Arshad Merali** from Rivvi, a Toronto-based fintech company focused on improving financial health and workplace transparency.

## Core Features

- AI Chatbot that answers employee questions
- Public access to general employment laws
- Private, secure login for company-specific policy access
- Document linking and source transparency
- Accessible on web, mobile, and tablet devices

## Target Users

- **Public Users:** Employees across Canada seeking clarification on general work rights
- **Private Users:** Employees granted access to their employer’s internal policies via secure login

## MVP - Minimum Viable Product

1. **Public Q&A:** Users can ask legal work-related questions through the chatbot.
2. **Private Login & Q&A:** Logged-in users access company-specific policy documents and ask personalized questions.
3. **Link to Sources:** All answers include source references for verification.
4. **Secure Authentication:** Private users authenticate through Clerk to access company info.
5. **Multi-device Compatibility:** Platform works on phones, tablets, and desktops.

## User Stories

1. **General legal info access**: Unauthenticated users can ask the chatbot about general labor laws to understand workplace rights.
2. **Company-specific guidance**: Registered employees can access personalized answers based on their company’s policies.
3. **Quick refresh on internal rules**: Employees can use the chatbot to recall company policies easily without asking redundant questions.
4. **Employer policy upload**: Employers can register and upload company policies to create a private knowledge base for employees.
5. **Verified and current info**: The chatbot provides source links with every answer to ensure responses are accurate and trustworthy.
6. **Join company space**: Employees can enter a unique company code to access their employer’s documents and ask company-specific questions.
7. **Chat history**: Logged-in employees can view a personal history of past questions and chatbot responses for easy reference.

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
- **Hosting:** Vercel
- **Monitoring:** Sentry
- **Analytics:** Google Analytics
- **Payment Gateway:** Stripe (if needed)

## Development Setup

> Note: As this project is in early development, this section will evolve.

## Task Management

- GitHub Issues and a shared structured doc for dev tracking
- Partner meetings twice a week (Fridays & Mondays)
- Team meetings on Tuesdays (7–8pm) & Sundays (12–1pm)

## Intellectual Property

Students will only reference the work they did in their resume, interviews, etc. They agree to not share the code or software in any capacity with anyone unless their partner has agreed to it.

## Role Descriptions

| **Role**            | **Description**                                                                                                                                                                                                 |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend Developer   | Implements server-side logic, APIs, authentication, and ensures data flow to frontend.                                                                                                                          |
| Frontend Developer  | Builds responsive UI components and is mainly responsible for the user interface.                                                                                                                               |
| UI/UX Designer      | Designs wireframes, user flows, and high-fidelity Figma prototype; collaborates with developers to ensure designs are implemented accurately; ensures interface is user-friendly, accessible, and meets both business requirements and user needs. |
| AI Engineer         | Builds RAG pipelines to process questions and generate responses; integrates LLM APIs; develops REST APIs for frontend integration; ingests policies into a vector database; optimizes the system for accuracy. |
| DevOps Engineer     | Deploys the entire project on Vercel; sets up the CI/CD pipeline; manages credentials.                                                                                                                          |
| Product Manager     | Communicates with partner to schedule meetings, deliver updates and ask questions; ensures project stays within scope and aligns with partner vision; coordinates team workflow and task assignments.
                                                                                                                                                                                                                 |
| Development Manager |                                                                                                                                                                                                                 |
| Scrum Master        |                                                                                                                                                                                                                 |

## CSC301_Programmers Roles

| **Name** | **Roles**                                               | **Experience**                                                                                                                                                                                                                                       |
| -------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Maya     | Backend Developer, Development Manager                  |                                                                                                                                                                                                                                                      |
| Olivia   | UI/UX Designer, Product Manager, Frontend Developer                        | I have experience with Figma and front-end development through personal projects, professional experience, and academic work, including CSC309. I’ve also had startup experience, where I worked closely with businesses and partners to align product goals and guide development.                                                                                                                                                                                                                                                   |
| Mamoon   | Backend Developer, Frontend Developer                   |                                                                                                                                                                                                                                                      |
| Isabella | AI Engineer, DevOps Engineer                            | I have experience building AI apps in other domains, and want to gain experience with LLM. I’ve used Docker in CSC309 and would like to sharpen my skills. Additionally, I want to gain experience with CI/CD.                                       |
| Maleeha  | Frontend Developer, UI/UX Designer, Development Manager |                                                                                                                                                                                                                                                      |
| Hussain  | Backend Developer, Frontend Developer                   | I have experience building full-stack applications, including designing responsive user interfaces and developing RESTful APIs with secure authentication flows. I've also maintained large-scale projects with high user engagements and retention. |
| Uzima    | AI Engineer, Scrum Master                               |                                                                                                                                                                                                                                                      |

## Partner

**Arshad Merali**  
Email: arshad@rivvi.com

## License

Proprietary – not open source. Code cannot be published or shared externally.
