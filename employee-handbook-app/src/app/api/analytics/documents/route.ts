import { NextResponse } from "next/server"
import { db } from "../../../../dbConfig/firebaseConfig"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const companyId = searchParams.get("companyId")
    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID is required", success: false },
        { status: 400 }
      )
    }

    const companiesRef = db.collection("companies").doc(companyId)
    const docSnap = await companiesRef.get()
    const docData = docSnap.data()

    let totalDocumentsUploaded = 0
    let newDocumentsUploaded = 0

    for (const doc of docData?.documents || []) {
      totalDocumentsUploaded++
      if (doc.uploadDate) {
        if (startDate && endDate) {
          const uploadDate =
            doc.uploadDate?.toDate?.() || new Date(doc.uploadDate)
          const startTimestamp = new Date(startDate)
          const [year, month, day] = endDate.split("-").map(Number)
          const endTimestamp = new Date(year, month - 1, day) // month is 0-based
          endTimestamp.setHours(23, 59, 59, 999)
          if (uploadDate >= startTimestamp && uploadDate <= endTimestamp) {
            newDocumentsUploaded++
          }
        } else {
          newDocumentsUploaded++
        }
      }
    }

    return NextResponse.json({
      totalDocumentsUploaded,
      newDocumentsUploaded,
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
