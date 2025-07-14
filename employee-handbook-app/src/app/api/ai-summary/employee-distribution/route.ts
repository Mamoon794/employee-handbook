import { NextResponse } from "next/server"
import callAI from "../util"

export async function POST(request: Request) {
  try {
    const provinceData = await request.json()
    const response = await callAI(
      `You assist screen reader users by summarizing data insights clearly and briefly.
      Your response will be read aloud, so do not include any introductions or extra text.
      Start directly with the explanation.

      Analyze the following dataset:
      ${JSON.stringify(provinceData)}

      Each entry includes the number of employees in a Canadian province.
      Use full province names (e.g., "Ontario" instead of "ON").
      Identify notable differences, distributions, or patterns in employee counts across provinces.
      Keep the explanation concise, clear, and easy to follow by voice.`
    )
    console.log("AI response for employee distribution:", response)
    return NextResponse.json({ response: response })
  } catch (error) {
    console.error(
      "Error getting the ai summary for employee distribution:",
      error
    )
    return NextResponse.json({ response: "No ai summary available." })
  }
}
