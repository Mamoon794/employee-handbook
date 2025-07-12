import { NextResponse } from "next/server"
import callAI from "../util"

export async function POST(request: Request) {
  try {
    const provinceData = await request.json()
    const response = await callAI(
      `Generate a concise explanation suitable for screen reader users about the 
      employee distribution across provinces using the following data: ${JSON.stringify(
        provinceData
      )}. Only output the explanation—no introductions or extra text.
      Use full province names (e.g., "Ontario" instead of "ON").
      Be clear but not wordy. Start the explanation directly.`
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
