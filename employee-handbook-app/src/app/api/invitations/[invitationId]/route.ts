import { NextRequest, NextResponse } from 'next/server';
import { getInvitation, updateInvitationStatus } from '@/models/dbOperations';
import { getAuth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest, { params }: { params: { invitationId: string } }) {
  const { userId } = getAuth(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const invitation = await getInvitation(params.invitationId);
    return NextResponse.json(invitation || null);
  } catch (error) {
    console.error('Error fetching invitation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invitation' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { invitationId: string } }) {
  const { userId } = getAuth(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { status } = await request.json();
    await updateInvitationStatus(params.invitationId, status);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating invitation:', error);
    return NextResponse.json(
      { error: 'Failed to update invitation' },
      { status: 500 }
    );
  }
}