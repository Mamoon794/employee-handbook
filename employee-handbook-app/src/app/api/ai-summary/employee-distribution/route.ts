import { NextResponse } from "next/server"
import getAISummary from "../models/gemini"

export async function POST(request: Request) {
  try {
    const provinceData = await request.json()
    const response = await getAISummary(
      `Use the following data to explain the employee distribution across provinces: ${JSON.stringify(
        provinceData
      )}. Don't say anything else but the explanation. Also, start with the explanation directly without saying things like based on the provided data.`
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
