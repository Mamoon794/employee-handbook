import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getClerkUser } from '@/models/dbOperations';

function isWithinTrialPeriod(createdAt: Date | { toDate?: () => Date; _seconds?: number }): boolean {
  const now = new Date();
  let accountCreatedDate: Date;
  
  if (createdAt instanceof Date) {
    accountCreatedDate = createdAt;
  } else if (createdAt && typeof createdAt.toDate === 'function') {
    accountCreatedDate = createdAt.toDate();
  } else if (createdAt && createdAt._seconds !== undefined) {
    accountCreatedDate = new Date(createdAt._seconds * 1000);
  } else {
    accountCreatedDate = new Date();
  }
  
  const trialDays = 7;
  
  const diffMs = now.getTime() - accountCreatedDate.getTime();
  
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  
  return diffDays <= trialDays;
}

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

    const user = users[0]; 
    
    if (user.userType === 'Employee') {
      return NextResponse.json({ subscribed: true });
    }
    
    if (user.isSubscribed) {
      return NextResponse.json({ 
        subscribed: true,
        isTrialPeriod: false
      });
    }
    
    if (isWithinTrialPeriod(user.createdAt)) {
      let createdDate: Date;
      if (user.createdAt instanceof Date) {
        createdDate = user.createdAt;
      } else if (user.createdAt && typeof user.createdAt.toDate === 'function') {
        createdDate = user.createdAt.toDate();
      } else if (user.createdAt && typeof user.createdAt === 'object' && '_seconds' in user.createdAt) {
        createdDate = new Date(user.createdAt._seconds * 1000);
      } else {
        createdDate = new Date();
      }
      
      return NextResponse.json({ 
        subscribed: true, 
        isTrialPeriod: true,
        trialEndsAt: new Date(createdDate.getTime() + 7 * 24 * 60 * 60 * 1000)
      });
    }
    
    return NextResponse.json({ 
      subscribed: false,
      isTrialPeriod: false,
      trialEnded: true
    });
    
  } catch (error) {
    console.error('Error checking subscription:', error);
    return NextResponse.json({ subscribed: false }, { status: 500 });
  }
} 