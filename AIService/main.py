import shutil
import uuid
from dotenv import load_dotenv
import os
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from faster_whisper import WhisperModel
from pydantic import BaseModel
from setupProvinces import graph, llm, process_docs, index_company_documents
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
            prompt = f"question: {userMessage.question}. If no province in this question is specified, assume the province to be {userMessage.province}."
        else:
            prompt = f"question: {userMessage.question}. If no province in this question is specified, assume the province to be {userMessage.province}. The company name is {userMessage.company}, this information will be used to filter documents."
        for step in graph.stream(
            {"messages": [{"role": "user", "content": prompt}]},
            stream_mode="values",
            config={"configurable": {"thread_id": userMessage.thread_id}},
        ):
            # print("step:", step)
            messages = step["messages"]
            # Find the last ToolMessage by reversing the list and checking type
            last_tool_message = next(
                (m for m in reversed(messages) if isinstance(m, ToolMessage)), # it's efficient
                None  # default if no ToolMessage is found
            )

            context = []
            if last_tool_message:
                # print("Last ToolMessage content:", last_tool_message.content)
                if hasattr(last_tool_message, "artifact"):
                    for doc in last_tool_message.artifact:
                        # print("doc:", doc)
                        # print("has metadata:", hasattr(doc, "metadata"))
                        # print("doc.metadata.get company:", doc.metadata.get("company", ""))
                        # print("has page_content:", hasattr(doc, "page_content"))
                        if not isinstance(doc, Document):
                            continue
                        if hasattr(doc, "metadata") and hasattr(doc, "page_content"):
                            source = doc.metadata.get("source", "")
                            title = doc.metadata.get("title", "")
                            page = doc.metadata.get("page", "") # only pdf have
                            type = doc.metadata.get("type", "")
                            docMetadata = {"source": source, "type": type, "title": title, "page": page, "content": doc.page_content}
                            context.append(docMetadata)
                            # print("Doc content:", doc.page_content)
                    # artifact = last_tool_message.artifact
            else:
                print("No ToolMessage found.")

            response = step["messages"][-1]
            finalResponse = response.content if hasattr(response, "content") else response

            # step["messages"][-1].pretty_print()

        return {"response": finalResponse, "metadata": context}
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
