from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from setup import graph, llm

from langchain_core.messages import ToolMessage
from langchain_core.documents import Document

# Initialize FastAPI application
app = FastAPI()

@app.get("/")
def root():
    return {"message": "Welcome to the AI Service!"}

# param class for user input in POST /responses

class RAGInput(BaseModel):
    province: str
    question: str
    thread_id: str = "1"  # default thread_id, can be overridden

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
        for step in graph.stream(
            {"messages": [{"role": "user", "content": f"question: {userMessage.question}. If no province is specified, assume the province to be {userMessage.province}."}]},
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
                        print("doc:", doc)
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
        print(f"An error occurred: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Define the request model for the /generate-title endpoint
class TitleInput(BaseModel):
    message: str  # The first message sent by the user

class TitleResponse(BaseModel):
    title: str  # The generated chat title

# new POST endpoint to generate a chat title
@app.post("/generate-title", response_model=TitleResponse)
def generate_title(titleInput: TitleInput):
    """
    Generate a short, descriptive chat title using Gemini based on the first user message.
    If the LLM call fails, return 'New Chat' as title.
    """
    try:
        prompt = f"Generate a short, descriptive chat title for the following message: '{titleInput.message}'"

        # call Gemini using LangChain llm.invoke() method
        # input is a list of messages 
        response = llm.invoke([{"role": "user", "content": prompt}])

        if hasattr(response, "content"):
            title = response.content.strip()
        else:
            title = str(response).strip()

        return {"title": title}
    except Exception as e:
        # if anything goes wrong, return a default title
        return {"title": "New Chat"}

# step = {
#     "messages": [
#         HumanMessage(...),       # no artifact
#         AIMessage(...),          # no artifact
#         ToolMessage(...),        # has .artifact
#         ...
#     ]
# }
