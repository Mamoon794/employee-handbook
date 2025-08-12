// webhook to sync with firestore db

import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/dbConfig/firebaseConfig';
import type { UserType, User } from '@/models/schema';
import type { DocumentData, QueryDocumentSnapshot } from 'firebase-admin/firestore';

// Define Clerk event types at the top level of the file
interface ClerkWebhookEvent {
  type: string;
  data: ClerkUserData;
}

interface ClerkUserData {
  id: string;
  first_name?: string;
  last_name?: string;
  email_addresses?: Array<{ email_address: string }>;
  unsafe_metadata?: {
    userType?: UserType;
    isSubscribed?: boolean;
    province?: string;
    companyId?: string;
    companyName?: string;
  };
  two_factor_enabled?: boolean;
  created_at: number;
}

export async function POST(req: NextRequest) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET || '';

  try {
    if (!WEBHOOK_SECRET) {
      throw new Error('CLERK_WEBHOOK_SECRET is not set');
    }

    const headersList = await headers();
    const svix_id = headersList.get('svix-id');
    const svix_timestamp = headersList.get('svix-timestamp');
    const svix_signature = headersList.get('svix-signature');

    if (!svix_id || !svix_timestamp || !svix_signature) {
      return NextResponse.json(
        { error: 'Error occurred -- no svix headers' },
        { status: 400 }
      );
    }

    const payload = await req.json();
    const body = JSON.stringify(payload);

    const wh = new Webhook(WEBHOOK_SECRET);

    let evt: ClerkWebhookEvent;
    try {
      evt = wh.verify(body, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      }) as ClerkWebhookEvent;
    } catch (err) {
      console.error('Error verifying webhook:', err);
      return NextResponse.json(
        { error: 'Error verifying webhook' },
        { status: 400 }
      );
    }

    console.log(`Received ${evt.type} event for user ${evt.data.id}`);

    switch (evt.type) {
      case 'user.created':
        await handleUserCreated(evt.data);
        break;
      case 'user.updated':
        await handleUserUpdated(evt.data);
        break;
      case 'user.deleted':
        await handleUserDeleted(evt.data);
        break;
      default:
        console.log(`Unhandled event type: ${evt.type}`);
    }

    return NextResponse.json(
      { message: 'Webhook processed' },
      { status: 200 }
    );
  } catch (err) {
    console.error('Error processing webhook:', err);
    return NextResponse.json(
      { error: 'Error processing webhook' },
      { status: 400 }
    );
  }
}

async function handleUserCreated(clerkUser: ClerkUserData) {
  if (!clerkUser.first_name || !clerkUser.last_name || !clerkUser.email_addresses?.[0]?.email_address) {
    console.warn('User missing required fields, skipping creation');
    return;
  }

  const userData: Omit<User, "id"> = {
    clerkUserId: clerkUser.id,
    firstName: clerkUser.first_name,
    lastName: clerkUser.last_name,
    email: clerkUser.email_addresses[0].email_address,
    userType: clerkUser.unsafe_metadata?.userType || 'Employee',
    isSubscribed: clerkUser.unsafe_metadata?.isSubscribed ?? false,
    province: clerkUser.unsafe_metadata?.province || 'ON',
    companyId: clerkUser.unsafe_metadata?.companyId || undefined,
    companyName: clerkUser.unsafe_metadata?.companyName || undefined,
    twoFactorEnabled: clerkUser.two_factor_enabled || false,
    createdAt: new Date(clerkUser.created_at),
    updatedAt: new Date(),
  };

  await db.collection('users').add(userData);
  console.log(`Created user ${clerkUser.id} in database`);
}

async function handleUserUpdated(clerkUser: ClerkUserData) {
  const snapshot = await db.collection('users')
    .where('clerkUserId', '==', clerkUser.id)
    .get();

  if (snapshot.empty) {
    console.warn(`User ${clerkUser.id} not found in database, skipping update`);
    return;
  }

  const userDoc: QueryDocumentSnapshot<DocumentData> = snapshot.docs[0];
  const userData = userDoc.data() as User;

  const updates: Partial<User> = {
    firstName: clerkUser.first_name || userData.firstName,
    lastName: clerkUser.last_name || userData.lastName,
    email: clerkUser.email_addresses?.[0]?.email_address || userData.email,
    userType: clerkUser.unsafe_metadata?.userType || userData.userType,
    isSubscribed: clerkUser.unsafe_metadata?.isSubscribed ?? userData.isSubscribed,
    province: clerkUser.unsafe_metadata?.province || userData.province,
    companyId: clerkUser.unsafe_metadata?.companyId || userData.companyId || undefined,
    companyName: clerkUser.unsafe_metadata?.companyName || userData.companyName || undefined,
    twoFactorEnabled: clerkUser.two_factor_enabled ?? userData.twoFactorEnabled,
    updatedAt: new Date(),
  };

  await userDoc.ref.update(updates);
  console.log(`Updated user ${clerkUser.id} in database`);
}

async function handleUserDeleted(clerkUser: ClerkUserData) {
  const snapshot = await db.collection('users')
    .where('clerkUserId', '==', clerkUser.id)
    .get();

  const batch = db.batch();
  snapshot.docs.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
    batch.delete(doc.ref);
  });
  await batch.commit();
  console.log(`Deleted user ${clerkUser.id} from database`);
}
