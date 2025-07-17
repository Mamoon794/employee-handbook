import { NextResponse } from "next/server"
import callAI from "../util"

export async function POST(request: Request) {
  try {
    const employeeRegistrationData = await request.json()
    const response = await callAI(
      `You are assisting screen reader users by summarizing key data insights in plain language.
      Your response will be read aloud, so do not include any introductions like “based on the data.”
      Start immediately with insights.

      Analyze the following dataset:
      ${JSON.stringify(employeeRegistrationData)}

      Each entry includes:

      "time": a label (month or day)

      "employees": number of employees registered at that time

      Briefly mention the time span covered by the data, then describe trends, 
      patterns, or comparisons in employee registration activity.
      Include relevant statistics such as average, median, or any informative measure.
      Keep the explanation concise, clear, and easy to follow by voice.`
    )
    console.log("AI response for employee registration:", response)
    return NextResponse.json({ response: response })
  } catch (error) {
    console.error(
      "Error getting the ai summary for employee registration:",
      error
    )
    return NextResponse.json({
      response: "No ai summary for employee registration available.",
    })
  }
}
