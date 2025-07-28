import shutil
import uuid
from dotenv import load_dotenv
import os
import re
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from faster_whisper import WhisperModel
from pydantic import BaseModel
from setupProvinces import graph, llm, process_docs, index_company_documents, delete_document_from_vector_db, delete_company_documents_from_vector_db
from processCompanyDocs import crawl_company_docs
import traceback

from pinecone import Pinecone
from langchain.chat_models import init_chat_model
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.document_loaders import WebBaseLoader, PyPDFLoader
from langchain_pinecone import PineconeVectorStore
from langchain_core.messages import ToolMessage
from langchain_core.documents import Document

# Initialize FastAPI application
app = FastAPI()

model = WhisperModel("small", device="cpu", compute_type="int8", download_root="/tmp/whisper")


# Will have to change this for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://employee-handbook-app.vercel.app/"],  
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Welcome to the AI Service!"}

# param class for user input in POST /responses

class RAGInput(BaseModel):
    province: str
    question: str
    thread_id: str = "1"  # default thread_id, can be overridden
    company: str = ""

def extract_and_clean(response_text):
    match = re.search(r"\[Found:\s*(Yes|No)\]", response_text)
    found = match.group(1) if match else None
    found_bool = found == "Yes" if found else False
    cleaned = re.sub(r"\s*\[Found:\s*(Yes|No)\]\s*", "", response_text).strip()
    return cleaned, found_bool

@app.post("/responses")
def get_response(userMessage: RAGInput):
    """
    Get a response from the AI model based on the query.
    """
    # province_mappings = {"Alberta": "AB", "British Columbia": "BC", "Manitoba": "MB",
    #                "New Brunswick": "NB", "Newfoundland and Labrador": "NL",
    #                "Nova Scotia": "NS", "Northwest Territories": "NT", "Nunavut": "NU",
    #                "Ontario": "ON", "Prince Edward Island": "PE",
    #                "Quebec": "QC", "Saskatchewan": "SK", "Yukon": "YT"}
    # print("province_mappings[userMessage.province]:", province_mappings[userMessage.province])
    try:
        if userMessage.company == "":
            prompt = (
                f"The user asked a question: \"{userMessage.question}\"\n\n"
                f"If no province is specified in the question, assume the province is {userMessage.province}.\n"
                f"Answer the question directly. Follow the instructions above, but do not mention or refer to them in your response."
            )
        else:
            prompt = (
                f"The user asked a question: \"{userMessage.question}\"\n\n"
                f"If no province is specified in the question, assume the province is {userMessage.province}.\n"
                f"The company name is {userMessage.company}. Use this information to filter documents.\n"
                f"Answer the question directly. Do not mention or refer to these instructions in your response."
            )
        last_step = None
        for step in graph.stream(
            {"messages": [{"role": "user", "content": prompt}]},
            stream_mode="values",
            config={"configurable": {"thread_id": userMessage.thread_id}},
        ):
            last_step = step  # Get the last step's messages

        if last_step:
            messages = last_step["messages"]
            last_tool_message = next(
                (m for m in reversed(messages) if isinstance(m, ToolMessage)),
                None
            )

            publicContext = []
            privateContext = []

            if last_tool_message and hasattr(last_tool_message, "artifact"):
                for doc in last_tool_message.artifact:
                    if not isinstance(doc, Document):
                        continue
                    if hasattr(doc, "metadata") and hasattr(doc, "page_content"):
                        source = doc.metadata.get("source", "")
                        title = doc.metadata.get("title", "")
                        page = doc.metadata.get("page", "")
                        type = doc.metadata.get("type", "")
                        docMetadata = {"source": source, "type": type, "title": title, "page": page, "content": doc.page_content}
                        if doc.metadata.get("company") == userMessage.company:
                            privateContext.append(docMetadata)
                        else:
                            publicContext.append(docMetadata)

            response = last_step["messages"][-1]
            bothResponse = response.content if hasattr(response, "content") else response
            print("bothResponse:", bothResponse)
            match_non_company = re.search(r"\*\*public-doc\*\*:\s*(.*?)(?=\n\*\*company-doc\*\*:)", bothResponse, re.DOTALL)
            match_company = re.search(r"\*\*company-doc\*\*:\s*(.*)", bothResponse, re.DOTALL)

            publicResponse = match_non_company.group(1).strip() if match_non_company else None
            privateResponse = match_company.group(1).strip() if match_company else None

            print("publicResponse:", publicResponse)
            print("privateResponse:", privateResponse)

            if not publicResponse or not privateResponse:
                # this is a conversational question, no documents found
                return {
                    "publicResponse": bothResponse,
                    "publicFound": False,
                    "publicMetadata": publicContext,
                    "privateResponse": bothResponse,
                    "privateFound": False,
                    "privateMetadata": privateContext
                }

            public_clean, public_found = extract_and_clean(publicResponse)
            private_clean, private_found = extract_and_clean(privateResponse)

            return {
                "publicResponse": public_clean,
                "publicFound": public_found,
                "publicMetadata": publicContext,
                "privateResponse": private_clean,
                "privateFound": private_found,
                "privateMetadata": privateContext
            }
        else:
            print("No step returned from graph.stream.")
            return None

    except Exception as e:
        traceback_str = traceback.format_exc()
        print(f"An error occurred: {e}")
        print(traceback_str)
        raise HTTPException(status_code=500, detail=str(e))

# Define the request model for the /generate-title endpoint
class TitleInput(BaseModel):
    message: str  # The first message sent by the user
    chatId: str   # Chat ID for Firebase storage
    userId: str   # User ID for Firebase storage

class TitleResponse(BaseModel):
    title: str    # The generated chat title
    chatId: str   # Chat ID for reference
    saved: bool   # Whether title was saved to Firebase

# new POST endpoint to generate a chat title
@app.post("/generate-title", response_model=TitleResponse)
def generate_title(titleInput: TitleInput):
    """
    Generate a short, descriptive chat title using Gemini based on the first user message.
    If the LLM call fails, return 'New Chat' as title.
    """
    try:
        prompt = f"Generate a short, concise chat title (2-4 words) for this message: '{titleInput.message}'. Return only the title, nothing else."

        # call Gemini using LangChain llm.invoke() method
        # input is a list of messages 
        response = llm.invoke([{"role": "user", "content": prompt}])

        if hasattr(response, "content"):
            title = response.content.strip()
        else:
            title = str(response).strip()

        return {"title": title, "chatId": titleInput.chatId, "saved": False}
    except Exception as e:
        # if anything goes wrong, return a default title
        return {"title": "New Chat", "chatId": titleInput.chatId, "saved": False}

# step = {
#     "messages": [
#         HumanMessage(...),       # no artifact
#         AIMessage(...),          # no artifact
#         ToolMessage(...),        # has .artifact
#         ...
#     ]
# }

# # Load environment variables
# load_dotenv()

# # Ensure required environment variables are set
# if not os.environ.get("GOOGLE_API_KEY"):
#     print("Please set the GOOGLE_API_KEY environment variable.")

# if not os.environ.get("PINECONE_API_KEY"):
#     print("Please set the GOOGLE_API_KEY environment variable.")
# pc_api_key = os.environ.get("PINECONE_API_KEY")

# if not os.environ.get("PINECONE_INDEX_NAME"):
#     print("Please set the PINECONE_INDEX_NAME environment variable.")
# index_name = os.environ.get("PINECONE_INDEX_NAME")

# # Initialize llm models and vector store
# llm = init_chat_model("gemini-2.0-flash", model_provider="google_genai")
# embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")

# # Initialize Pinecone vector store
# pc = Pinecone(api_key=pc_api_key)
# index = pc.Index(index_name)
# vector_store = PineconeVectorStore(embedding=embeddings, index=index)


# # Convert the Document objects to emmbeddings and upload to Pinecone vector store
# def batch_add_documents(vector_store, documents, company, region, access_level, batch_size=100):
#     for i in range(0, len(documents), batch_size):
#         batch = documents[i:i + batch_size]
#         for doc in batch:
#             doc.metadata.update({
#                 "access_level": access_level,
#                 "company": company,
#                 "region": region
#             })
#         try:
#             vector_store.add_documents(batch, namespace=company)
#         except Exception as e:
#             print(f"Failed to upload batch {i // batch_size + 1}: {e}")


class DocInput(BaseModel):
    """
    Input model for document upload.
    """
    url: str  # URL of the document
    company: str = "General"  # Company name

@app.post("/company-document")
def upload_document(input: DocInput):
    """
    Upload a company document for storing and processing.
    """
    try:
        if not input.url or not input.company:
            raise HTTPException(status_code=400, detail="URL and company name are required")

        company_docs = crawl_company_docs(input.url, input.company, namespace=input.company)
        if not isinstance(company_docs, list) or company_docs == []:
            print("company_docs == []: ", company_docs == [])
            print(f"Skipping non-list entry for company {input.company}: {company_docs}")
        splits = process_docs(company_docs)
        index_company_documents(splits, input.company)
        return {"url": input.url, "company": input.company, "status": "success"}
    except Exception as e:
        print(f"Failed to process document {input.url} for company {input.company}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
class CompanyName(BaseModel):
    """
    Input model for document upload.
    """
    company: str  # Company name

@app.patch("/company-document")
def delete_company_documents(input: CompanyName):
    """
    Delete all documents from the vector store for the specified company.
    """
    try:
        # Delete the documents from Pinecone vector store
        delete_company_documents_from_vector_db(input.company)
        return {"company": input.company, "status": "success"}
    except Exception as e:
        print(f"Failed to delete documents for company {input.company}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
@app.patch("/company-document/source")
def delete_document(input: DocInput):
    """
    Delete a document from the vector store by its source URL.
    """
    try:
        # Delete the document from Pinecone vector store
        delete_document_from_vector_db(input.url, input.company)
        return {"url": input.url, "company": input.company, "status": "success"}
    except Exception as e:
        print(f"Failed to delete document {input.url} from {input.company}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """
    Transcribe an audio file of a user's spoken prompt.
    """
    if file.content_type not in ["audio/mpeg", "audio/wav", "audio/x-m4a", "audio/mp4"]:
        raise HTTPException(status_code=400, detail="Unsupported file type")
    
    filename = f"/tmp/{uuid.uuid4()}.{file.filename.split('.')[-1]}"
    with open(filename, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        segments, info = model.transcribe(filename, beam_size=5)
        transcript = "".join([segment.text for segment in segments]).strip()
        return {
            "language": info.language,
            "confidence": info.language_probability,
            "transcript": transcript,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
    finally:
        os.remove(filename)  # clean up temp file
