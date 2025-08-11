import { getPopularQuestions } from "@/models/dbOperations"
import { NextRequest, NextResponse } from "next/server"

interface PopularQuestionsRequest {
  company: string
  province: string
}

/**
 * API route to retrieve popular questions when a user is on a new chat.
 *
 * Expects a JSON body with:
 * - company: The user's company. If the user is public, the value is "".
 * - province: The user's province. If the value is an empty string, it returns all popular questions under the company.
 *
 * Returns an array of questions.
 */
export async function POST(req: NextRequest) {
  let payload: PopularQuestionsRequest
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { company, province } = payload

  // query for popular questions corresponding to the company and province in Firestore
  try {
    const result = await getPopularQuestions(company, province)
    return NextResponse.json(result.map((q) => q.text))
  } catch (e: any) {
    console.error(e)
    return NextResponse.json(
      { error: e.message || "Failed to retrieve popular questions" },
      { status: 500 }
    )
  }
}
