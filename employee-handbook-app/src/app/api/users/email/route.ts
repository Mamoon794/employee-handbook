import { NextResponse } from 'next/server';
import { getUserByEmail } from '@/models/dbOperations';
import { getAuth } from '@clerk/nextjs/server';

export async function GET(request: Request) {
  const { userId } = getAuth(request as any);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json(
      { error: 'Email is required' },
      { status: 400 }
    );
  }

  try {
    const user = await getUserByEmail(email);
    return NextResponse.json(user || null);
  } catch (error) {
    console.error('Error fetching user by email:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}