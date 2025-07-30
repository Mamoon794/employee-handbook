import { getPopularQuestions } from "@/integrations/aiService"
import { savePopularQuestions } from "@/models/dbOperations"
import { NextRequest, NextResponse } from "next/server"

/**
 * Scheduled weekly job:
 * 1. Fetches all popular questions from FastAPI
 * 2. Stores them in Firestore
 * 3. Returns success status and count of saved docs
 */
export async function GET() {
  try {
    // fetch from AI service
    const popularQuestions = await getPopularQuestions();

    // persist to Firestore
    await savePopularQuestions(popularQuestions);

    // return success with how many were saved
    return NextResponse.json(
      { success: true, count: popularQuestions.length },
      { status: 200 }
    );
  } catch (error) {
    console.error('[weekly-popular-job] error:', error);
    const message = error instanceof Error ? error.message : "Popular questions job failed";
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}