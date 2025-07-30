/* eslint-disable */
import { NextRequest, NextResponse } from "next/server"
import { handlePublicMessage } from "@/services/messageService"
import type { PublicMessageRequest } from "@/types/ai"

/**
 * API route to handle messages from public users.
 *
 * Expects a JSON body with:
 * - province: the user's selected province
 * - query: the user's query
 * - threadId: the user's thread ID enabling continuous conversation
 *
 * Returns the AI-generated response.
 */
export async function POST(req: NextRequest) {
  let payload: PublicMessageRequest
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { province, query, threadId } = payload
  if (!province || !query.trim() || !threadId) {
    return NextResponse.json(
      { error: "Missing province, question, or threadId" },
      { status: 400 }
    )
  }

  try {
    const result = await handlePublicMessage(province, query, threadId)
    return NextResponse.json(result)
  } catch (e: any) {
    console.error(e)
    return NextResponse.json(
      { error: e.message || "Server error" },
      { status: 500 }
    )
  }
}
