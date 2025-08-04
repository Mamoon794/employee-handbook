from config import llm, vector_store

from langchain import hub
from langchain_core.tools import tool
from langchain_core.messages import SystemMessage
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import START, StateGraph, MessagesState, END

# Load prompt template from LangChain Hub
prompt = hub.pull("rlm/rag-prompt", api_url="https://api.smith.langchain.com")

@tool(response_format="content_and_artifact")
def retrieve(query: str, province: str, company: str = ""):
    """
    Retrieve employment-related information by searching indexed documents 
    within the specified province. If no province is given, it defaults to "General". 
    If a company name is provided, it filters documents accordingly.

    Use this tool only when the user is asking a factual or research-based question 
    related to employment policies or company-specific matters. Do not use this tool for small talk, 
    greetings, or general conversational questions.

    Parameters:
    - query: the user's question.
    - province: province name such as "Alberta", "British Columbia", etc.
    - company: (optional) company name to filter documents.
    """
    # print("province:", province)
    province_docs = vector_store.similarity_search(query, k=4, namespace=province)
    general_docs = vector_store.similarity_search(query, k=4, namespace="General")
    company_docs = vector_store.similarity_search(query, k=4, namespace=company)
    retrieved_docs = province_docs + general_docs + company_docs
    serialized = "\n\n".join(
        f"DocMetadata: {doc.metadata}\nDocContent: {doc.page_content}"
        for doc in retrieved_docs
    )
    return serialized, retrieved_docs

# Step 1: Generate an AIMessage that may include a tool-call to be sent.
def query_or_respond(state: MessagesState):
    """Generate tool call for retrieval or respond."""
    llm_with_tools = llm.bind_tools([retrieve])
    response = llm_with_tools.invoke(state["messages"])
    # MessagesState appends messages to state instead of overwriting
    return {"messages": [response]}

# Step 2: Execute the retrieval.
tools = ToolNode([retrieve])

# Step 3: Generate a response using the retrieved content.
def generate(state: MessagesState):
    """Generate answer."""
    # Get generated ToolMessages
    recent_tool_messages = []
    for message in reversed(state["messages"]):
        if message.type == "tool":
            recent_tool_messages.append(message)
        else:
            break
    tool_messages = recent_tool_messages[::-1]

    # print("tool_messages:", tool_messages)
    # print("length", len(tool_messages))
    docs = tool_messages[-1].artifact 
    # Separate docs based on whether metadata has a "company" field
    company_docs = [doc for doc in docs if "company" in doc.metadata]
    non_company_docs = [doc for doc in docs if "company" not in doc.metadata]

    # Format the doc content for each group
    # print("company_docs:", company_docs)
    company_docs_content = "\n\n".join(f"DocMetadata: {doc.metadata}\nDocContent: {doc.page_content}" for doc in company_docs)
    non_company_docs_content = "\n\n".join(f"DocMetadata: {doc.metadata}\nDocContent: {doc.page_content}" for doc in non_company_docs)

    # Construct system prompt
    system_message_content = (
        "You are an assistant for question-answering tasks. Use the retrieved documents to answer the user's question. "
        "Format your response in **two clearly separated sections** as described below. "
        "This formatting is required to allow automatic parsing:\n\n"
        "1. **public-doc**:\n"
        "- Use only documents that do **not** have a company name in their metadata.\n"
        "- Begin with a legal-sounding tone such as:\n"
        "  \"Based on the applicable law, ...\" or \"According to relevant legal guidance, ...\"\n"
        "- IMPORTANT: When answering questions about steps, processes, options, or comparisons, use the carousel format:\n"
        "  :::carousel\n"
        "  card: Step 1 Title\n"
        "  content: Detailed description of this step\n"
        "  icon: 📋\n"
        "  ---\n"
        "  card: Step 2 Title\n"
        "  content: Detailed description of this step\n"
        "  icon: ✍️\n"
        "  :::\n"
        "- Use carousel format SPECIFICALLY for:\n"
        "  * Questions containing 'steps to', 'how to', 'process for', 'procedure to'\n"
        "  * Multiple options or choices (e.g., 'what are my options')\n"
        "  * Comparisons between different things\n"
        "  * Lists of important rights or highlights\n"
        "- Use regular text/lists for simple information that doesn't involve steps or choices\n"
        "- If no relevant information is found, still write a sentence in the expected tone and end with [Found: No]\n"
        "- If relevant information is found, write the answer and end with [Found: Yes]\n"
        "- Start this section with exactly: **public-doc**:\n"
        "2. **company-doc**:\n"
        "- Use only documents that **do** have a company name in their metadata.\n"
        "- Begin with a company policy tone such as:\n"
        "  \"Based on the employee manual, ...\" or \"According to [Company]'s internal policy, ...\"\n"
        "- Replace `[Company]` with the **actual company name** from the metadata.\n"
        "- If the company name is not available, use 'the company' instead.\n"
        "- **Do not output the placeholder `[Company]` in your response.**\n"
        "- IMPORTANT: Use the same carousel format as in public-doc when presenting steps, processes, or options\n"
        "- If no relevant information is found, still write a sentence in the expected tone and end with [Found: No]\n"
        "- If relevant information is found, write the answer and end with [Found: Yes]\n"
        "- Start this section with exactly: **company-doc**:\n"
        
        "Important:\n"
        "- Do not include any extra sections or commentary outside the two headers.\n"
        "- Each section must end with [Found: Yes] or [Found: No].\n"
        "- Do not number the sections. Do not prefix with '1.' or '2.'\n"
        "— just use the headers exactly as shown: **public-doc**: and **company-doc**:\n\n"
        
        "EXAMPLE for a question like 'What are the steps to apply for parental leave?':\n"
        "**public-doc**:\n"
        "Based on the applicable law, here are the steps to apply for parental leave:\n\n"
        ":::carousel\n"
        "card: Step 1: Determine Eligibility\n"
        "content: Ensure you have been employed for at least 13 weeks before the expected birth date\n"
        "icon: ✅\n"
        "---\n"
        "card: Step 2: Provide Written Notice\n"
        "content: Give your employer at least 2 weeks' written notice before starting leave. Specify if you want 37 or 63 weeks\n"
        "icon: 📝\n"
        "---\n"
        "card: Step 3: Submit Documentation\n"
        "content: Provide any required medical certificates or proof of birth/adoption\n"
        "icon: 📋\n"
        ":::\n"
        "[Found: Yes]\n\n"
        
        "---\n"
        "public-doc documents:\n"
        f"{non_company_docs_content}\n\n"
        "---\n"
        "company-doc documents:\n"
        f"{company_docs_content}"
    )

    conversation_messages = [
        message
        for message in state["messages"]
        if message.type in ("human", "system")
        or (message.type == "ai" and not message.tool_calls)
    ]
    prompt = [SystemMessage(system_message_content)] + conversation_messages

    # Run
    response = llm.invoke(prompt)
    return {"messages": [response]}


graph_builder = StateGraph(MessagesState)
graph_builder.add_node(query_or_respond)
graph_builder.add_node(tools)
graph_builder.add_node(generate)

graph_builder.set_entry_point("query_or_respond")
graph_builder.add_conditional_edges(
    "query_or_respond",
    tools_condition,
    {END: END, "tools": "tools"},
)
graph_builder.add_edge("tools", "generate")
graph_builder.add_edge("generate", END)

memory = MemorySaver()
graph = graph_builder.compile(checkpointer=memory)