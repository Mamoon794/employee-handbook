> ⚙️ Are you a developer? See [README_DEV.md](./README_DEV.md) for setup and technical details.

# Employee Handbook App

## Overview

The **Employee Handbook App** is a web-based platform that helps workers understand their rights and company policies using an AI-powered chatbot. It features both public and private access levels, providing support for general legal information and organization-specific policies.

Our partner is **Arshad Merali** from Rivvi, a Toronto-based fintech company focused on improving financial health and workplace transparency.

## Access the App

The app can be accessed at https://employee-handbook-app.vercel.app/.

## Instructions/Features

Access the link above.

On landing, select your province/territory.
![Popup](deliverables/D2/images/popup.png)

Then, you may select any of the suggested questions, or type in your own question related to workplace rights/regulations.
![Welcome](deliverables/D2/images/welcome.png)

The chatbot will give you an answer given your selected province/territory and you can take a closer look at any of the sources by clicking on them.
![Chat](deliverables/D2/images/chat.png)

The province dropdown allows you to change your province. The chatbot will tailor its answers to this province.
![ProvinceDropdown](deliverables/D2/images/dropdown.gif)

You can also choose to log in or sign up using the buttons at the top right. Upon pressing the **Log in** button, you will be redirected to the Clerk login page.
![Login](deliverables/D2/images/login.png)

After logging in, you will be able to create new chats, see your chat history and your messages will be stored.
<img width="1440" height="900" alt="Screenshot 2025-08-05 at 5 00 27 PM" src="https://github.com/user-attachments/assets/82f21692-655c-441b-9048-1d2f9749c4e2" />

If you don't have an account, you can sign up using the **Sign Up** button. You will be asked whether you want to continue as an employee or an employer.
![Sign Up](deliverables/D2/images/signup.png)

If you choose to sign up as an employee, you will be taken to the sign up page by Clerk, where you can enter your email and password to create an account or use Google sign in.
![Employee Sign Up](deliverables/D2/images/employee_signup.png)

If you choose to sign up as an employer, you will see the same page but upon completion, you will be taken to the dashboard which allows you to upload documents, view analytics and more. 
<img width="1824" height="862" alt="image" src="https://github.com/user-attachments/assets/81009b0e-a410-4d68-b4fd-c89cd269e872" />

As an employer, you can upload your company policies and documents, add employees, view finances, view analytics and access the chatbot. Some functionality will be implemented in the future, but you can already upload documents.
![Employer Dashboard](deliverables/D2/images/employer_dashboard.png)

Owners can then add employees to their company by sending invites through email. They can view pending, expired and accepted invitations. Additionally, they have the option to delete a pending invitation, effectively making it expired.
<img width="1851" height="877" alt="image" src="https://github.com/user-attachments/assets/aae8773d-1cf7-4d5d-a3ba-1de4250db794" />

Invited employees will recieve an email in which clicking the provided link allows them to join the company.
<img width="1574" height="819" alt="image" src="https://github.com/user-attachments/assets/4140b06a-846f-46eb-8570-414139822bcd" />
![Welcome](https://github.com/user-attachments/assets/0aefd6d6-1c70-4865-8127-ca31bbe95557)

The analytics page will show you the number of employees, total questions asked and more.
![Analytics](deliverables/D2/images/analytics.png)

## Chat History
- All users (public or logged-in) can view their recent chat history.
- A maximum of 8 recent chats are stored per user.

## Add Employee Feature

To allow owners to give their employees access to their policy documents, owners are able to add employees to their company through the dashboard. Here, owners can send an invite using the invitee's email, and the email will be sent through EmailJS. There are a few checks that take place just to ensure the employee is not already in a company, that they have not already recieved an email by the sender, and that they exist in our database. These invites expire within 7 days if not accepted by the employee, or if they are cancelled by the sender. Upon such circumstances, the invite will redirect to an invalid or expired invitation page. Once accepted, the employee will view a welcome message, see their company's name on the chat page and will have access to company-specific policies.

## Stripe Payment Integration

To support subscription-based access and control for employer-only features (e.g., uploading company documents, team management, analytics), we integrated Stripe Checkout with a **free 7-day trial** for new employer accounts.

### Free Trial

New employers receive a **1-week free trial** after sign-up to explore the platform, upload documents, and invite employees. Once the trial ends, if no subscription is active, the employer is redirected to the paywall and temporarily loses access to premium features until payment is completed.

### How It Works

When an employer visits the Home Page, the app checks their **trial and subscription status** by querying Firebase.

- If the employer has an active subscription or is within the free trial period, they are redirected to the **Dashboard**.
- If neither is active, they are redirected to the **Paywall Page**.

On the Paywall Page:

- Clicking **Subscribe** initiates a **Stripe Checkout session**.
- After successful payment, **Stripe triggers a webhook**, which updates the employer’s subscription status in **Firebase**.
- Once Firebase reflects the updated status, the employer gains full access to premium features via the Dashboard.


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

## Maintenance Plan
When you're ready to take over maintenance:
- We will transfer GitHub, Vercel, and Railway ownership.
- You will receive video walkthroughs and setup instructions.
- We will help configure environment variables and deployment settings.

## Future Use Tips
- Use the dashboard to upload your company policies.
- Encourage employees to log in for personalized answers.
- Review analytics to understand employee usage trends.

## Task Management

- GitHub Issues and a shared structured doc for dev tracking
- Partner meetings twice a week (Fridays & Mondays)
- Team meetings on Tuesdays (12–1pm) & Sundays (12–1pm)

## Intellectual Property

Students will only reference the work they did in their resume, interviews, etc. They agree to not share the code or software in any capacity with anyone unless their partner has agreed to it.

## Partner

**Arshad Merali**  
Email: arshad@rivvi.com

## Git & GitHub Workflow

We follow a collaborative, branch-based development process on GitHub:

- **Branch Naming:** Each feature or bug fix is implemented on a dedicated branch (e.g., `feature/Chat`, `fix/signup`).
- **Pull Requests:** All changes are submitted via pull requests, using the `pull_request_template.md` to ensure clarity and accountability.
- **Code Review:** Every PR is reviewed during our regular team meetings on Zoom/Discord, where all members are present and provide collective feedback before merging into `main`.
- **Main Branch Stability:** The `main` branch always contains the latest stable, deployable version of the app.
- **Continuous Integration:** Our app is deployed via Vercel whenever changes are pushed to the `main` branch, ensuring quick feedback and stable releases.

This workflow ensures that our team collaborates smoothly, avoids merge conflicts, and maintains clean, working code throughout development.

## License

Proprietary – not open source. Code cannot be published or shared externally.

## Support

If you have questions or need help, feel free to [open an issue](https://github.com/csc301-2025-y/project-16-rivvi/issues) on GitHub.
