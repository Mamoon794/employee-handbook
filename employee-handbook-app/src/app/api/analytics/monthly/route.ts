import { NextResponse } from "next/server"
import { db } from "../../../../dbConfig/firebaseConfig"
import { DocumentData, QueryDocumentSnapshot } from "firebase/firestore"

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

    if (!startDate || !endDate) {
      return NextResponse.json(
        {
          error: "Start date and end date are required",
          success: false,
        },
        { status: 400 }
      )
    }

    const startTimestamp = new Date(startDate)
    const [year, month, day] = endDate.split("-").map(Number)
    const endTimestamp = new Date(year, month - 1, day) // month is 0-based

    if (isNaN(startTimestamp.getTime()) || isNaN(endTimestamp.getTime())) {
      return NextResponse.json(
        {
          error: "Invalid date format. Please provide valid dates",
          success: false,
        },
        { status: 400 }
      )
    }
    endTimestamp.setHours(23, 59, 59, 999)

    const daysDiff = Math.ceil(
      (endTimestamp.getTime() - startTimestamp.getTime()) /
        (1000 * 60 * 60 * 24)
    )
    const showDailyData = daysDiff <= 14

    const timeData: {
      [key: string]: { employees: number; questions: number; documents: number }
    } = {}
    const timeLabels: string[] = []

    const keyToDisplay: { [key: string]: string } = {}

    if (showDailyData) {
      const current = new Date(startTimestamp)
      while (current <= endTimestamp) {
        const uniqueKey = current.toISOString().split("T")[0] // YYYY-MM-DD format
        const displayKey = current.toLocaleString("default", {
          weekday: "short",
        })
        timeLabels.push(uniqueKey)
        keyToDisplay[uniqueKey] = displayKey
        timeData[uniqueKey] = { employees: 0, questions: 0, documents: 0 }
        current.setDate(current.getDate() + 1)
      }
    } else {
      const current = new Date(
        startTimestamp.getFullYear(),
        startTimestamp.getMonth(),
        1
      )
      const endMonth = new Date(
        endTimestamp.getFullYear(),
        endTimestamp.getMonth(),
        1
      )

      while (current <= endMonth) {
        const monthKey = current.toLocaleString("default", {
          month: "short",
          year: "numeric",
        })
        timeLabels.push(monthKey)
        keyToDisplay[monthKey] = monthKey
        timeData[monthKey] = { employees: 0, questions: 0, documents: 0 }
        current.setMonth(current.getMonth() + 1)
      }
    }

    const usersRef = db.collection("users").where("companyId", "==", companyId)
    // const employeeQuery = usersRef.where("userType", "==", "Employee");
    const employeeSnapshot = await usersRef.get()

    const allEmployeeIds: string[] = []
    employeeSnapshot.docs.forEach((doc: DocumentData) => {
      const userData = doc.data()
      const createdAt =
        userData.createdAt?.toDate?.() || new Date(userData.createdAt)

      allEmployeeIds.push(doc.id)

      if (createdAt >= startTimestamp && createdAt <= endTimestamp) {
        const timeKey = showDailyData
          ? createdAt.toISOString().split("T")[0] // YYYY-MM-DD format
          : createdAt.toLocaleString("default", {
              month: "short",
              year: "numeric",
            })
        if (timeData[timeKey]) {
          timeData[timeKey].employees++
        }
      }
    })

    if (allEmployeeIds.length > 0) {
      const chatsRef = db.collection("chats")
      const chatsSnapshot = await chatsRef
        .where("userId", "in", allEmployeeIds)
        .get()

      chatsSnapshot.docs.forEach(
        (chatDoc: QueryDocumentSnapshot<DocumentData>) => {
          const chatData = chatDoc.data()
          const messages = chatData.messages || []

          messages.forEach((messageData: DocumentData) => {
            if (messageData.isFromUser) {
              const createdAt =
                messageData.createdAt?.toDate?.() ||
                new Date(messageData.createdAt)
              if (createdAt >= startTimestamp && createdAt <= endTimestamp) {
                const timeKey = showDailyData
                  ? createdAt.toISOString().split("T")[0]
                  : createdAt.toLocaleString("default", {
                      month: "short",
                      year: "numeric",
                    })
                if (timeData[timeKey]) {
                  timeData[timeKey].questions++
                }
              }
            }
          })
        }
      )
    }

    const result = timeLabels.map((timeLabel) => {
      const realData = timeData[timeLabel] || {
        employees: 0,
        questions: 0,
        documents: 0,
      }

      return {
        month: keyToDisplay[timeLabel] || timeLabel,
        employees: realData.employees,
        questions: realData.questions,
        documents: realData.documents,
      }
    })

    return NextResponse.json({ monthlyData: result, success: true })
  } catch (error) {
    console.error("Error fetching monthly analytics:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch monthly analytics",
        success: false,
      },
      { status: 500 }
    )
  }
}
