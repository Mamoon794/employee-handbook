import { getClerkUser } from '@/models/dbOperations';
import { NextResponse, NextRequest } from 'next/server'; 
import { getAuth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) { 
  const { userId } = getAuth(request); 
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userRecord = (await getClerkUser(userId))[0];
    if (!userRecord?.companyId) {
      return NextResponse.json({ error: 'No company found' }, { status: 404 });
    }

    return NextResponse.json({
      companyId: userRecord.companyId,
      companyName: userRecord.companyName || 'Your Company'
    });
  } catch (error) {
    console.error(error); 
    return NextResponse.json(
      { error: 'Failed to fetch company info' },
      { status: 500 }
    );
  }
}