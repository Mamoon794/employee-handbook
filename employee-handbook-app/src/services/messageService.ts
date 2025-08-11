/* eslint-disable */
import type { AIResponse, UserMessageResponse, Citation } from "@/models/ai"
import { getChatbotResponse } from "@/integrations/aiService"

/**
 * Process metadata documents and convert them to citations with fragment URLs
 */
function processCitations(metadata: any[], maxCitations: number = 3): Citation[] {
  const seen = new Set<string>()
  const citations: Citation[] = []

  for (const doc of metadata) {
    const originalUrl = String(doc.source)
    if (seen.has(originalUrl)) continue
    seen.add(originalUrl)

    let fragmentUrl = originalUrl
    if (doc.type === "pdf") {
      fragmentUrl = `${originalUrl}#page=${doc.page}`
    } else if (doc.type === "html") {
      // Use text fragment for HTML -> this may be unreliable
      let firstWords = doc.content.split("\n")[0].trim()
      firstWords = firstWords.split(" ").slice(0, 10).join(" ")
      const fragment = encodeURIComponent(firstWords)
      fragmentUrl = `${originalUrl}#:~:text=${fragment}`
    }

    citations.push({
      originalUrl,
      fragmentUrl,
      title: doc.title,
    })

    if (citations.length >= maxCitations) break
  }

  return citations
}

/**
 * Core logic for a public user's question.
 * Transforms full AI service payload into minimal frontend needs,
 * generating hyperlinks to exact section within sources.
 */
export async function handlePublicMessage(
  province: string,
  question: string,
  threadId: string
): Promise<UserMessageResponse> {
  const aiResult = await getChatbotResponse(province, question, threadId)
  const citations = processCitations(aiResult.publicMetadata)

  return {
    publicResponse: aiResult.publicResponse,
    publicSources: citations
  }
}

export async function handlePrivateMessage(
  province: string,
  question: string,
  threadId: string,
  company: string = ""
): Promise<UserMessageResponse> {
  const aiResult = await getChatbotResponse(province, question, threadId, company)

  const publicCitations = processCitations(aiResult.publicMetadata)
  const privateCitations = processCitations(aiResult.privateMetadata)

  let publicResponse = ""
  let privateResponse = ""
  // When the AI is unable to differentiate the public and private response, aiResult.publicResponse and 
  // aiResult.privateResponse are the same value. In this case, return the string in private response only.
  if (aiResult.publicResponse == aiResult.privateResponse) {
    privateResponse = aiResult.privateResponse
  } else {
    publicResponse = aiResult.publicResponse
    privateResponse = aiResult.privateResponse
  }

  console.log("citations:", [...publicCitations, ...privateCitations])
  return {
    publicResponse,
    publicSources: publicCitations,
    privateResponse,
    privateSources: privateCitations
  }
}
