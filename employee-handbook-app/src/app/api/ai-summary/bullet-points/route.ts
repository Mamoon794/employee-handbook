import { NextResponse } from "next/server"
import callAI from "../util"

export async function POST(request: Request) {
  try {
    const summaryData = await request.json()
    const response = await callAI(
      `Summarize the following text into clear, concise bullet points.
        Start each point with a dash and a space, like this: - Point text here.
        Avoid unnecessary wording. Focus only on the key ideas.
        
        ${summaryData.summary}`
    )
    console.log("AI generated bullet points:", response)
    return NextResponse.json({ response: response })
  } catch (error) {
    console.error("Error getting the ai generated bullet points:", error)
    return NextResponse.json({
      response: "No ai generated bullet points available.",
    })
  }
}
