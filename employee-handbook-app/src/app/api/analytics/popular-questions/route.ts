import { NextResponse } from "next/server"
import { db } from "../../../../dbConfig/firebaseConfig"
import { DocumentData } from "firebase/firestore"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const company = searchParams.get("company")
    if (!company || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Company Name is required", success: false },
        { status: 400 }
      )
    }
    const startTimestamp = new Date(startDate)
    const [year, month, day] = endDate.split("-").map(Number)
    const endTimestamp = new Date(year, month - 1, day) // month is 0-based
    endTimestamp.setHours(23, 59, 59, 999)

    const pqRef = db
      .collection("popular_questions")
      .where("company", "==", company)
      .where("createdAt", ">=", startTimestamp)
      .where("createdAt", "<=", endTimestamp)

    const pqSnapshot = await pqRef.get()
    const pqResults = pqSnapshot.docs.map((doc: DocumentData) => ({
      id: doc.id,
      ...doc.data(),
    }))

    return NextResponse.json({
      topQuestions: pqResults,
      success: true,
    })
  } catch (error) {
    console.error("Error fetching total questions asked:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch total questions asked",
        success: false,
      },
      { status: 500 }
    )
  }
}
