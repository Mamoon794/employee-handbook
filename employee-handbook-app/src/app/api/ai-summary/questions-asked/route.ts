import { NextResponse } from "next/server"
import callAI from "../util"

export async function POST(request: Request) {
  try {
    const questionsAskedData = await request.json()
    const response = await callAI(
      `Generate a concise explanation suitable for screen reader users.
      Analyze the following questions asked data across months/days: ${JSON.stringify(
        questionsAskedData
      )}. Each entry has a "time" field (month or day) and a "questions" field
      (number of questions asked at that time). Identify trends or patterns or comparisons.
      Do not be wordy. Do not say things like "based on the data." Start directly with the analysis.`
    )
    console.log("AI response for questions asked:", response)
    return NextResponse.json({ response: response })
  } catch (error) {
    console.error("Error getting the ai summary for questions asked", error)
    return NextResponse.json({
      response: "No ai summary available for questions asked.",
    })
  }
}
