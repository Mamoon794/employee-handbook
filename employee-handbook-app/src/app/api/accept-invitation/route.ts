import {
  getInvitation,
  updateInvitationStatus,
  getClerkUser,
} from "@/models/dbOperations"
import { db } from "@/dbConfig/firebaseConfig"
import { getAuth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const invitationId = searchParams.get("invitationId")

  if (!invitationId) {
    return NextResponse.redirect(new URL("/invalid-invitation", request.url))
  }

  try {
    const invitation = await getInvitation(invitationId)
    if (!invitation || invitation.status !== "pending") {
      return NextResponse.redirect(new URL("/invalid-invitation", request.url))
    }

    const { userId } = getAuth(request)

    // redirect to sign in if user is not logged in
    if (!userId) {
      const signInUrl = new URL("/log-in/[...rest]", request.url)
      signInUrl.searchParams.set(
        "redirect_url",
        `/api/accept-invitation?invitationId=${invitationId}`
      )
      return NextResponse.redirect(signInUrl)
    }

    const user = (await getClerkUser(userId))[0]
    if (!user) {
      return NextResponse.redirect(new URL("/invalid-invitation", request.url))
    }

    if (user.email !== invitation.email) {
      return NextResponse.redirect(new URL("/invalid-invitation", request.url))
    }

    // updating user data with company information
    await db.collection("users").doc(user.id).update({
      companyId: invitation.companyId,
      companyName: invitation.companyName,
      userType: "Employee",
      updatedAt: new Date(),
    })

    await updateInvitationStatus(invitationId, "accepted")

    // redirecting to chat with welcome message parameters
    const chatUrl = new URL("/chat", request.url)
    chatUrl.searchParams.set("welcome", "true")
    chatUrl.searchParams.set(
      "company",
      encodeURIComponent(invitation.companyName)
    )
    return NextResponse.redirect(chatUrl)
  } catch (error) {
    console.error("Error accepting invitation:", error)
    return NextResponse.redirect(new URL("/error", request.url))
  }
}

// import { getInvitation, updateInvitationStatus, getClerkUser } from '@/models/dbOperations';
// import { db } from '@/dbConfig/firebaseConfig';
// import { getAuth } from '@clerk/nextjs/server';
// import { NextRequest, NextResponse } from 'next/server';

// export async function GET(request: NextRequest) {
//   const { searchParams } = new URL(request.url);
//   const invitationId = searchParams.get('invitationId');

//   if (!invitationId) {
//     return NextResponse.redirect(new URL('/invalid-invitation', request.url));
//   }

//   try {
//     const invitation = await getInvitation(invitationId);
//     if (!invitation || invitation.status !== 'pending') {
//       return NextResponse.redirect(new URL('/invalid-invitation', request.url));
//     }

//     const { userId } = getAuth(request);

//     // redirect to sign in if user is not logged in
//     if (!userId) {
//       const signInUrl = new URL('/LogIn', request.url);
//       signInUrl.searchParams.set('redirect_url', `/api/accept-invitation?invitationId=${invitationId}`);
//       return NextResponse.redirect(signInUrl);
//     }

//     const user = (await getClerkUser(userId))[0];
//     if (!user) {
//       return NextResponse.redirect(new URL('/invalid-invitation', request.url));
//     }

//     if (user.email !== invitation.email) {
//       return NextResponse.redirect(new URL('/invalid-invitation', request.url));
//     }

//     await db.collection("users").doc(user.id).update({
//       companyId: invitation.companyId,
//       companyName: invitation.companyName,
//       userType: 'Employee',
//       updatedAt: new Date(),
//     });

//     await updateInvitationStatus(invitationId, 'accepted');

//     return NextResponse.redirect(new URL('/chat', request.url));
//   } catch (error) {
//     console.error('Error accepting invitation:', error);
//     return NextResponse.redirect(new URL('/error', request.url));
//   }
// }
