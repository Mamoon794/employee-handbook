import { GoogleGenAI } from "@google/genai"

const ai = new GoogleGenAI({})

export default async function callGemini(contents: string) {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-lite-001",
    contents: contents,
  })
  return response.text
}
