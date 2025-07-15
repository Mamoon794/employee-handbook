import { NextResponse } from "next/server"
import callAI from "../util"

export async function POST(request: Request) {
  try {
    const questionsAskedData = await request.json()
    const response = await callAI(
      `You are assisting screen reader users by summarizing key data insights in plain language.
      Your response will be read aloud, so do not include any introductions like “based on the data.”
      Start immediately with insights.

      Given this dataset:
      ${JSON.stringify(questionsAskedData)}

      Each item has:

      "time": a label (month or day)

      "questions": number of questions asked

      Briefly state the time range covered by the data, then identify trends, patterns, 
      or comparisons in question activity over time.
      Highlight any significant increases or decreases in question volume.
      Include simple statistics such as average, median, or other meaningful metrics.
      Make the explanation concise, clear, and easy to follow by voice.`
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
