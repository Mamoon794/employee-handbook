import { GoogleGenAI } from "@google/genai"

const ai = new GoogleGenAI({})

export default async function callGemini(
  contents: string,
  timeoutMs = 5000
): Promise<string> {
  const timeoutPromise = new Promise<string>((_, reject) =>
    setTimeout(() => reject(new Error("No AI summary available.")), timeoutMs)
  )

  const geminiPromise = (async () => {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite-001",
      contents,
    })
    return response.text ?? "No AI summary available." // fallback ensures string
  })()

  return Promise.race([geminiPromise, timeoutPromise])
}
