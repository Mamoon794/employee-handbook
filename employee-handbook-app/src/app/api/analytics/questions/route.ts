import { NextResponse } from "next/server"
import { db } from "../../../../dbConfig/firebaseConfig"
import { DocumentData } from "firebase/firestore"

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

    const usersRef = db.collection("users").where("companyId", "==", companyId)
    const employeeSnapshot = await usersRef
      // .where("userType", "==", "Employee")
      .get()
    const employeeIds = employeeSnapshot.docs.map((doc: DocumentData) => doc.id)

    const chatsRef = db.collection("chats")
    const chatsSnapshot = await chatsRef
      .where("userId", "in", employeeIds)
      .get()
    // console.log('Employee Chats:', chatsSnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({ id: doc.id, ...doc.data() })));
    let newQuestionsAsked = 0
    let totalQuestionsAsked = 0

    for (const chatDoc of chatsSnapshot.docs) {
      const chatData = chatDoc.data()
      const messages = chatData.messages || []
      for (const messageData of messages) {
        if (messageData.isFromUser) {
          totalQuestionsAsked++
          if (startDate && endDate) {
            const createdAt =
              messageData.createdAt?.toDate?.() ||
              new Date(messageData.createdAt)
            const startTimestamp = new Date(startDate)
            const endTimestamp = new Date(endDate)
            endTimestamp.setHours(23, 59, 59, 999)
            if (createdAt >= startTimestamp && createdAt <= endTimestamp) {
              newQuestionsAsked++
            }
          } else {
            newQuestionsAsked++
          }
        }
      }
    }

    return NextResponse.json({
      totalQuestionsAsked,
      newQuestionsAsked,
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
