import { NextRequest, NextResponse } from 'next/server';
import { createInvitation, getUserByEmail } from '@/models/dbOperations';
import { sendInvitationEmail } from '@/lib/email';
import { getAuth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  const { userId } = getAuth(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('Received request to send invitation'); // debugging

  try {
    const { email, companyId, companyName } = await request.json();
    console.log(`Processing invitation for ${email} to company ${companyId}`); // debugging

    const existingUser = await getUserByEmail(email);
    console.log('User lookup result:', existingUser); // debugging

    if (!existingUser) {
      console.log('Email not found in system'); // debugging
      return NextResponse.json(
        { error: 'Email is not associated with an account.' },
        { status: 400 }
      );
    }

    if (existingUser.companyId) {
      console.log('User already belongs to company:', existingUser.companyId); // debugging
      return NextResponse.json(
        { error: 'User is already part of a company.' },
        { status: 400 }
      );
    }

    console.log('Creating invitation...'); // debugging
    const invitation = await createInvitation({
      email,
      companyId,
      companyName,
      inviterId: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log('Raw email from request:', email); // debugging

    console.log('Sending email...'); // debugging
    await sendInvitationEmail({
      email,
      invitationId: invitation.id,
      companyName,
    });

    console.log('Invitation sent successfully'); // debugging
    return NextResponse.json({ success: true, invitationId: invitation.id });
  } catch (error) {
    console.error('Full error details:', error); //error logging
    return NextResponse.json(
      { 
        error: 'Failed to send invitation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
