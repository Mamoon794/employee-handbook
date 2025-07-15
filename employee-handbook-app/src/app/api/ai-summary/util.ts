import callGemini from "./models/gemini"

export default async function callAI(contents: string) {
  try {
    const response = await callGemini(contents)
    return response
  } catch (error) {
    console.error("Error getting AI summary:", error)
    return "No AI summary available."
  }
}
