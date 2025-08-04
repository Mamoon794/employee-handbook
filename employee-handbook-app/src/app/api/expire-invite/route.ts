import { NextResponse } from 'next/server';
import { expireInvitation } from '@/models/dbOperations';

export async function POST(request: Request) {
  const { invitationId } = await request.json();
  
  if (!invitationId) {
    return NextResponse.json({ error: 'Invitation ID is required' }, { status: 400 });
  }

  try {
    await expireInvitation(invitationId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error expiring invitation:', error);
    return NextResponse.json(
      { error: 'Failed to expire invitation' },
      { status: 500 }
    );
  }
}