import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getClerkUser } from '@/models/dbOperations';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ subscribed: false }, { status: 401 });
    }

    const user = await getClerkUser(userId);
    
    if (!user) {
      return NextResponse.json({ subscribed: false }, { status: 404 });
    }

    const isSubscribed = user.isSubscribed || false;
    
    return NextResponse.json({ subscribed: isSubscribed });
    
  } catch (error) {
    console.error('Error checking subscription:', error);
    return NextResponse.json({ subscribed: false }, { status: 500 });
  }
} 