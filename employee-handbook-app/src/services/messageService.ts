/* eslint-disable */
import type { AIResponse, UserMessageResponse, Citation } from "@/types/ai"
import { callAiService } from "@/integrations/aiService"

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
  const aiResult = await callAiService(province, question, threadId)

  const seen = new Set<string>()
  const citations: Citation[] = []
  const titleNum: Record<string, number> = {}

  for (const doc of aiResult.publicMetadata) {
    const originalUrl = String(doc.source)
    if (seen.has(originalUrl)) continue
    seen.add(originalUrl)

    let fragmentUrl = originalUrl
    if (doc.type === "pdf") {
      fragmentUrl = `${originalUrl}#page=${doc.page}`
    } else if (doc.type === "html") {
      // Use text fragment for HTML -> this is unreliable
      let firstWords = doc.content.split("\n")[0].trim()
      firstWords = firstWords.split(" ").slice(0, 10).join(" ")
      const fragment = encodeURIComponent(firstWords)
      fragmentUrl = `${originalUrl}#:~:text=${fragment}`
    }
    if (!(doc.title in titleNum)) {
      titleNum[doc.title] = 1
    } else {
      titleNum[doc.title] += 1
    }

    citations.push({
      originalUrl,
      fragmentUrl,
      title: `${doc.title} (${titleNum[doc.title]})`,
    })

    if (citations.length >= 3) break
  }

  console.log(citations)

  return {
    response: aiResult.publicResponse,
    citations,
  }
}

export async function handlePrivateMessage(
  province: string,
  question: string,
  threadId: string,
  company: string = ""
): Promise<UserMessageResponse> {
  const aiResult = await callAiService(province, question, threadId, company)

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
      // Use text fragment for HTML -> this is unreliable
      // const firstWords = doc.content.split(" ").slice(0, 10).join(" ");
      // const fragment = encodeURIComponent(firstWords);
      // fragmentUrl = `${originalUrl}#:~:text=${fragment}`;
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
      // Use text fragment for HTML -> this is unreliable
      // const firstWords = doc.content.split(" ").slice(0, 10).join(" ");
      // const fragment = encodeURIComponent(firstWords);
      // fragmentUrl = `${originalUrl}#:~:text=${fragment}`;
    }

    privateCitations.push({
      originalUrl,
      fragmentUrl,
      title: doc.title,
    })

    if (privateCitations.length >= 3) break
  }

  if (aiResult.publicFound) {
    citations.push(...publicCitations)
  }
  citations.push(...privateCitations)
  let response = aiResult.publicResponse + "<br><br>" + aiResult.privateResponse

  console.log("citations:", citations)
  return {
    response,
    citations,
  }
}
