import { NextResponse } from "next/server"
import getAISummary from "../util"

export async function POST(request: Request) {
  try {
    const employeeRegistrationData = await request.json()
    const response = await getAISummary(
      `Analyze the following employee registration data across months/days: ${JSON.stringify(
        employeeRegistrationData
      )}. Each entry has a "time" field (month or day) and an "employees" field
      (number of employees registered at that time). Identify trends or patterns or comparisons. 
      Do not be wordy. Do not say things like "based on the data." Start directly with the analysis.`
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
