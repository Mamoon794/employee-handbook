import type { AIResponse } from "@/types/ai"

const AI_SERVICE_URL = process.env.AI_SERVICE_URL

/**
 * Calls the upstream FastAPI service at POST /responses
 */
export async function callAiService(
  province: string,
  question: string,
  threadId: string,
  company: string = ""
): Promise<AIResponse> {
  if (!AI_SERVICE_URL) {
    throw new Error("AI_SERVICE_URL not configured")
  }

  const res = await fetch(`${AI_SERVICE_URL}/responses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ province, question, thread_id: threadId, company }),
  })

  console.log("AI_SERVICE_URL:", AI_SERVICE_URL)
  console.log("Full request URL:", `${AI_SERVICE_URL}/responses`)
  console.log("Response status:", res.status, res.statusText)

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`AI service error: ${text}`)
  }

  return (await res.json()) as AIResponse
}

/**
 * Calls the upstream FastAPI service at POST /company-document
 */
export async function uploadFileToVectorDB(
  fileurl: string,
  namespace: string
): Promise<{ url: string; company: string; status: string }> {
  const res = await fetch(`${AI_SERVICE_URL}/company-document`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url: fileurl, company: namespace }),
  })

  if (!res.ok) {
    const errorData = await res.json()
    throw new Error(
      `Failed to upload file to Vector DB: ${
        errorData.error || "Unknown error in uploadFileToVectorDB"
      }`
    )
  }

  return await res.json()
}

export async function deleteCompanyFromVectorDB(
  company: string
): Promise<{ company: string; status: string }> {
  const res = await fetch(`${AI_SERVICE_URL}/company-document`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ company: company }),
  })

  if (!res.ok) {
    const errorData = await res.json()
    throw new Error(
      `Failed to delete document from Vector DB: ${
        errorData.error || "Unknown error in deleteDocumentFromVectorDB"
      }`
    )
  }

  return await res.json()
}

export async function deleteDocumentFromVectorDB(
  url: string,
  company: string
): Promise<{ url: string; company: string; status: string }> {
  const res = await fetch(`${AI_SERVICE_URL}/company-document/source`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url: url, company: company }),
  })

  if (!res.ok) {
    const errorData = await res.json()
    throw new Error(
      `Failed to delete document from Vector DB: ${
        errorData.error || "Unknown error in deleteDocumentFromVectorDB"
      }`
    )
  }

  return await res.json()
}
