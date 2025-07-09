import { NextResponse } from 'next/server';
import { getInvitation, updateInvitationStatus, getUser, updateUser } from '../../../models/dbOperations';
import { auth } from '@clerk/nextjs/server';
import { Sentry } from '../../../lib/sentry';
import { Invitation } from '../../../models/schema';

export async function POST(request: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { token: invitationId }: { token: string } = await request.json();
    if (!invitationId) {
      return NextResponse.json(
        { error: 'Invitation token is required' },
        { status: 400 }
      );
    }

    const invitation = await getInvitation(invitationId);
    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { 
          error: 'Invitation already processed',
          status: invitation.status
        },
        { status: 409 }
      );
    }

    const dbUser = await getUser(userId);
    if (!dbUser) {
      return NextResponse.json(
        { error: 'User account not found' },
        { status: 404 }
      );
    }

    if (dbUser.email.toLowerCase() !== invitation.inviteeEmail.toLowerCase()) {
      return NextResponse.json(
        { error: 'Email does not match invitation' },
        { status: 403 }
      );
    }

    await Promise.all([
      updateUser(dbUser.id, {
        companyId: invitation.companyId,
        userType: 'Employee',
        updatedAt: new Date(),
      }),
      updateInvitationStatus(invitationId, 'accepted')
    ]);

    return NextResponse.json(
      { 
        success: true,
        companyId: invitation.companyId,
        message: 'Successfully joined company' 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Accept invitation error:', error);
    Sentry.captureException(error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}