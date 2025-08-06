/* eslint-disable */
import type { AIResponse, UserMessageResponse, Citation } from "@/types/ai"
import { getChatbotResponse } from "@/integrations/aiService"

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

  const seen = new Set<string>()
  const citations: Citation[] = []

  for (const doc of aiResult.publicMetadata) {
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

    if (citations.length >= 3) break
  }

  // console.log(citations)

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

  const seen = new Set<string>()
  const publicCitations: Citation[] = []
  const privateCitations: Citation[] = []
  const citations: Citation[] = []

  for (const doc of aiResult.publicMetadata) {
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

    publicCitations.push({
      originalUrl,
      fragmentUrl,
      title: doc.title,
    })

    if (publicCitations.length >= 3) break
  }

  for (const doc of aiResult.privateMetadata) {
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

    privateCitations.push({
      originalUrl,
      fragmentUrl,
      title: doc.title,
    })

    if (privateCitations.length >= 3) break
  }

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

  console.log("citations:", citations)
  return {
    publicResponse,
    publicSources: publicCitations,
    privateResponse,
    privateSources: privateCitations
  }
}
