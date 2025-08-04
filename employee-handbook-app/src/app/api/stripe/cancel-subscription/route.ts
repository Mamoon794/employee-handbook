import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/dbConfig/firebaseConfig"

// import Stripe from "stripe"
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
//   apiVersion: '2025-07-30.basil',
// });

export async function POST() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userSnapshot = await db
      .collection("users")
      .where("clerkUserId", "==", userId)
      .get()

    if (userSnapshot.empty) {
      return NextResponse.json({ 
        success: false, 
        message: "User not found" 
      }, { status: 404 })
    }

    const userDoc = userSnapshot.docs[0]
    const userData = userDoc.data()

    if (!userData.isSubscribed) {
      return NextResponse.json({ 
        success: false, 
        message: "No active subscription found" 
      }, { status: 400 })
    }

    await userDoc.ref.update({
      isSubscribed: false,
      subscriptionCancelledAt: new Date(),
      updatedAt: new Date(),
    })

    console.log(`✅ Successfully cancelled subscription for user ${userId}`)

    return NextResponse.json({ 
      success: true, 
      message: "Subscription cancelled successfully" 
    })

  } catch (error) {
    console.error("Error cancelling subscription:", error)
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to cancel subscription" 
      },
      { status: 500 }
    )
  }
}