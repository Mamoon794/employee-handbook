import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getClerkUser } from '@/models/dbOperations';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ subscribed: false }, { status: 401 });
    }

    const users = await getClerkUser(userId);
    
    if (!users || users.length === 0) {
      return NextResponse.json({ subscribed: false }, { status: 404 });
    }

    const user = users[0]; // getClerkUser returns an array
    const isSubscribed = user.isSubscribed || false;
    
    console.log('Checking subscription for user:', userId);
    console.log('User data:', { id: user.id, isSubscribed: user.isSubscribed });
    
    return NextResponse.json({ subscribed: isSubscribed });
    
  } catch (error) {
    console.error('Error checking subscription:', error);
    return NextResponse.json({ subscribed: false }, { status: 500 });
  }
} 