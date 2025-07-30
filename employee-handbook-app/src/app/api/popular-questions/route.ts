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
 * - company: The user's company. If the user is public, the value is "public".
 * - province: The user's province.
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
  // if (!province) {
  //   return NextResponse.json(
  //     { error: "Missing company or province" },
  //     { status: 400 }
  //   )
  // }

  // query for popular questions corresponding to the company and province in Firestore
  try {
    const result = await getPopularQuestions(company, province)
    return NextResponse.json(result.map((q) => q.text))
  } catch (e) {
    console.log(e)
    return NextResponse.json(
      { error: "Failed to retrieve popular questions" },
      { status: 500 }
    )
  }
}
