import { GoogleGenAI } from "@google/genai"

const ai = new GoogleGenAI({})

export default async function getAISummaryFromGemini(contents: string) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: contents,
  })
  return response.text
}
