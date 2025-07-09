import getAISummaryFromGemini from "./models/gemini"

export default async function getAISummary(contents: string) {
  try {
    const response = await getAISummaryFromGemini(contents)
    return response
  } catch (error) {
    console.error("Error getting AI summary:", error)
    return "No AI summary available."
  }
}
