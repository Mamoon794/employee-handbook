import { NextResponse } from 'next/server';
import { getPendingInvitationsByCompany } from '@/models/dbOperations';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get('companyId');
  
  if (!companyId) {
    return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
  }

  try {
    const invites = await getPendingInvitationsByCompany(companyId);
    return NextResponse.json(invites);
  } catch (error) {
    console.error('Error fetching pending invites:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending invites' },
      { status: 500 }
    );
  }
}