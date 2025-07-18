// webhook to sync with firestore db


import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/dbConfig/firebaseConfig';
import type { UserType, User } from '@/models/schema';
import type { DocumentData, QueryDocumentSnapshot } from 'firebase-admin/firestore';

const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET || '';

export async function POST(req: NextRequest) {
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

    let evt: any;
    try {
      evt = wh.verify(body, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      }) as any;
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

async function handleUserCreated(clerkUser: any) {
  if (!clerkUser.first_name || !clerkUser.last_name || !clerkUser.email_addresses?.[0]?.email_address) {
    console.warn('User missing required fields, skipping creation');
    return;
  }

  const userData: Omit<User, "id"> = {
    clerkUserId: clerkUser.id,
    firstName: clerkUser.first_name,
    lastName: clerkUser.last_name,
    email: clerkUser.email_addresses[0].email_address,
    userType: clerkUser.unsafe_metadata?.userType as UserType || 'Employee',
    isSubscribed: clerkUser.unsafe_metadata?.isSubscribed ?? false,
    province: clerkUser.unsafe_metadata?.province || 'ON',
    companyId: clerkUser.unsafe_metadata?.companyId || null,
    companyName: clerkUser.unsafe_metadata?.companyName || null,
    twoFactorEnabled: clerkUser.two_factor_enabled || false,
    createdAt: new Date(clerkUser.created_at),
    updatedAt: new Date(),
  };

  await db.collection('users').add(userData);
  console.log(`Created user ${clerkUser.id} in database`);
}

async function handleUserUpdated(clerkUser: any) {
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
    userType: clerkUser.unsafe_metadata?.userType as UserType || userData.userType,
    isSubscribed: clerkUser.unsafe_metadata?.isSubscribed ?? userData.isSubscribed,
    province: clerkUser.unsafe_metadata?.province || userData.province,
    companyId: clerkUser.unsafe_metadata?.companyId || userData.companyId || null,
    companyName: clerkUser.unsafe_metadata?.companyName || userData.companyName || null,
    twoFactorEnabled: clerkUser.two_factor_enabled ?? userData.twoFactorEnabled,
    updatedAt: new Date(),
  };

  await userDoc.ref.update(updates);
  console.log(`Updated user ${clerkUser.id} in database`);
}

async function handleUserDeleted(clerkUser: any) {
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





// import { Webhook } from 'svix';
// import { headers } from 'next/headers';
// import { NextRequest, NextResponse } from 'next/server';
// import { 
//   createUser,
//   collection,
//   query,
//   where,
//   getDocs,
//   updateDoc,
//   writeBatch,
//   db
// } from '@/models/dbOperations';
// import type { UserType, User } from '@/models/schema';

// const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET || '';

// // post requests from clerk webhooks
// export async function POST(req: NextRequest) {
//   try {
//     if (!WEBHOOK_SECRET) {
//       throw new Error('CLERK_WEBHOOK_SECRET is not set');
//     }

//     const headersList = await headers();
//     const svix_id = headersList.get('svix-id');
//     const svix_timestamp = headersList.get('svix-timestamp');
//     const svix_signature = headersList.get('svix-signature');

//     if (!svix_id || !svix_timestamp || !svix_signature) {
//       return NextResponse.json(
//         { error: 'Error occurred -- no svix headers' },
//         { status: 400 }
//       );
//     }

//     const payload = await req.json();
//     const body = JSON.stringify(payload);

//     const wh = new Webhook(WEBHOOK_SECRET);

//     let evt: any;
//     try {
//       evt = wh.verify(body, {
//         'svix-id': svix_id,
//         'svix-timestamp': svix_timestamp,
//         'svix-signature': svix_signature,
//       }) as any;
//     } catch (err) {
//       console.error('Error verifying webhook:', err);
//       return NextResponse.json(
//         { error: 'Error verifying webhook' },
//         { status: 400 }
//       );
//     }

//     console.log(`Received ${evt.type} event for user ${evt.data.id}`);

//     switch (evt.type) {
//       case 'user.created':
//         await handleUserCreated(evt.data);
//         break;

//       case 'user.updated':
//         await handleUserUpdated(evt.data);
//         break;

//       case 'user.deleted':
//         await handleUserDeleted(evt.data);
//         break;

//       default:
//         console.log(`Unhandled event type: ${evt.type}`);
//     }

//     return NextResponse.json(
//       { message: 'Webhook processed' },
//       { status: 200 }
//     );
//   } catch (err) {
//     console.error('Error processing webhook:', err);
//     return NextResponse.json(
//       { error: 'Error processing webhook' },
//       { status: 400 }
//     );
//   }
// }

// // handling clerk events
// async function handleUserCreated(clerkUser: any) {
//   if (!clerkUser.first_name || !clerkUser.last_name || !clerkUser.email_addresses?.[0]?.email_address) {
//     console.warn('User missing required fields, skipping creation');
//     return;
//   }

//   const userType = clerkUser.unsafe_metadata?.userType as UserType || 'Employee';
  
//   const userData: Omit<User, "id"> = {
//     clerkUserId: clerkUser.id,
//     firstName: clerkUser.first_name,
//     lastName: clerkUser.last_name,
//     email: clerkUser.email_addresses[0].email_address,
//     userType: userType,
//     isSubscribed: clerkUser.unsafe_metadata?.isSubscribed ?? false,
//     province: clerkUser.unsafe_metadata?.province || 'ON',
//     companyId: clerkUser.unsafe_metadata?.companyId || null, 
//     companyName: clerkUser.unsafe_metadata?.companyName || null, 
//     twoFactorEnabled: clerkUser.two_factor_enabled || false,
//     createdAt: new Date(clerkUser.created_at),
//     updatedAt: new Date(),
//   };

//   await createUser(userData);
//   console.log(`Created user ${clerkUser.id} in database`);
// }

// async function handleUserUpdated(clerkUser: any) {
//   const usersRef = collection(db, "users");
//   const q = query(usersRef, where("clerkUserId", "==", clerkUser.id));
//   const querySnapshot = await getDocs(q);

//   if (querySnapshot.empty) {
//     console.warn(`User ${clerkUser.id} not found in database, skipping update`);
//     return;
//   }

//   const userDoc = querySnapshot.docs[0];
//   const updates: Partial<User> = {
//     firstName: clerkUser.first_name || userDoc.data().firstName,
//     lastName: clerkUser.last_name || userDoc.data().lastName,
//     email: clerkUser.email_addresses?.[0]?.email_address || userDoc.data().email,
//     userType: clerkUser.unsafe_metadata?.userType as UserType || userDoc.data().userType,
//     isSubscribed: clerkUser.unsafe_metadata?.isSubscribed ?? userDoc.data().isSubscribed,
//     province: clerkUser.unsafe_metadata?.province || userDoc.data().province,
//     companyId: clerkUser.unsafe_metadata?.companyId || userDoc.data().companyId || null,
//     companyName: clerkUser.unsafe_metadata?.companyName || userDoc.data().companyName || null,
//     twoFactorEnabled: clerkUser.two_factor_enabled ?? userDoc.data().twoFactorEnabled,
//     updatedAt: new Date(),
//   };

//   await updateDoc(userDoc.ref, updates);
//   console.log(`Updated user ${clerkUser.id} in database`);
// }

// async function handleUserDeleted(clerkUser: any) {
//   const userId = clerkUser.id;
//   console.log(`Processing deletion for user ${userId}`);

//   try {
//     const fieldNames = ['clerkUserId', 'id', 'userId'];
//     let docsToDelete = [];
    
//     for (const field of fieldNames) {
//       const q = query(collection(db, "users"), where(field, "==", userId));
//       const snapshot = await getDocs(q);
//       docsToDelete.push(...snapshot.docs);
//       if (docsToDelete.length > 0) break;
//     }

//     if (docsToDelete.length === 0) {
//       console.log(`User ${userId} not found in any field`);
//       return;
//     }

//     const batch = writeBatch(db);
//     docsToDelete.forEach(doc => batch.delete(doc.ref));
//     await batch.commit();
    
//     console.log(`Deleted ${docsToDelete.length} records for ${userId}`);
    
//   } catch (error) {
//     console.error(`Deletion failed for ${userId}:`, error);
//     throw error;
//   }
// }


//////////////////////////////////////////////////////////////////////////////////////////////////////////

// import { Webhook } from 'svix';
// import { headers } from 'next/headers';
// import { NextRequest, NextResponse } from 'next/server';
// import { 
//   createUser,
//   collection,
//   query,
//   where,
//   getDocs,
//   updateDoc,
//   writeBatch,
//   db
// } from '@/models/dbOperations';
// import type { UserType, User } from '@/models/schema';

// const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET || '';

// interface CustomHeaders {
//   get(key: string): string | null;
//   entries(): IterableIterator<[string, string]>;
// }

// export async function POST(req: NextRequest) {
//   try {
//     if (!WEBHOOK_SECRET) {
//       throw new Error('CLERK_WEBHOOK_SECRET is not set');
//     }

//     const headersList = headers() as unknown as CustomHeaders;
//     const svix_id = headersList.get('svix-id');
//     const svix_timestamp = headersList.get('svix-timestamp');
//     const svix_signature = headersList.get('svix-signature');

//     if (!svix_id || !svix_timestamp || !svix_signature) {
//       return NextResponse.json(
//         { error: 'Error occurred -- no svix headers' },
//         { status: 400 }
//       );
//     }

//     const payload = await req.json();
//     const body = JSON.stringify(payload);

//     // new webhook instance
//     const wh = new Webhook(WEBHOOK_SECRET);

//     let evt: any;
//     try {
//       // verifying payload
//       evt = wh.verify(body, {
//         'svix-id': svix_id,
//         'svix-timestamp': svix_timestamp,
//         'svix-signature': svix_signature,
//       }) as any;
//     } catch (err) {
//       console.error('Error verifying webhook:', err);
//       return NextResponse.json(
//         { error: 'Error verifying webhook' },
//         { status: 400 }
//       );
//     }

//     console.log(`Received ${evt.type} event for user ${evt.data.id}`);

//     switch (evt.type) {
//       case 'user.created':
//         await handleUserCreated(evt.data);
//         break;

//       case 'user.updated':
//         await handleUserUpdated(evt.data);
//         break;

//       case 'user.deleted':
//         await handleUserDeleted(evt.data);
//         break;

//       default:
//         console.log(`Unhandled event type: ${evt.type}`);
//     }

//     return NextResponse.json(
//       { message: 'Webhook processed' },
//       { status: 200 }
//     );
//   } catch (err) {
//     console.error('Error processing webhook:', err);
//     return NextResponse.json(
//       { error: 'Error processing webhook' },
//       { status: 400 }
//     );
//   }
// }

// async function handleUserCreated(clerkUser: any) {
//   if (!clerkUser.first_name || !clerkUser.last_name || !clerkUser.email_addresses?.[0]?.email_address) {
//     console.warn('User missing required fields, skipping creation');
//     return;
//   }

//   const userType = clerkUser.unsafe_metadata?.userType as UserType || 'Employee';
  
//   const userData: Omit<User, "id"> = {
//     clerkUserId: clerkUser.id,
//     firstName: clerkUser.first_name,
//     lastName: clerkUser.last_name,
//     email: clerkUser.email_addresses[0].email_address,
//     userType: userType,
//     isSubscribed: clerkUser.unsafe_metadata?.isSubscribed ?? false,
//     province: clerkUser.unsafe_metadata?.province || 'ON',
//     companyId: clerkUser.unsafe_metadata?.companyId || undefined,
//     companyName: clerkUser.unsafe_metadata?.companyName || undefined,
//     twoFactorEnabled: clerkUser.two_factor_enabled || false,
//     createdAt: new Date(clerkUser.created_at),
//     updatedAt: new Date(),
//   };

//   await createUser(userData);
//   console.log(`Created user ${clerkUser.id} in database`);
// }

// async function handleUserUpdated(clerkUser: any) {
//   const usersRef = collection(db, "users");
//   const q = query(usersRef, where("clerkUserId", "==", clerkUser.id));
//   const querySnapshot = await getDocs(q);

//   if (querySnapshot.empty) {
//     console.warn(`User ${clerkUser.id} not found in database, skipping update`);
//     return;
//   }

//   const userDoc = querySnapshot.docs[0];
//   const updates: Partial<User> = {
//     firstName: clerkUser.first_name || userDoc.data().firstName,
//     lastName: clerkUser.last_name || userDoc.data().lastName,
//     email: clerkUser.email_addresses?.[0]?.email_address || userDoc.data().email,
//     userType: clerkUser.unsafe_metadata?.userType as UserType || userDoc.data().userType,
//     isSubscribed: clerkUser.unsafe_metadata?.isSubscribed ?? userDoc.data().isSubscribed,
//     province: clerkUser.unsafe_metadata?.province || userDoc.data().province,
//     companyId: clerkUser.unsafe_metadata?.companyId || userDoc.data().companyId,
//     companyName: clerkUser.unsafe_metadata?.companyName || userDoc.data().companyName,
//     twoFactorEnabled: clerkUser.two_factor_enabled ?? userDoc.data().twoFactorEnabled,
//     updatedAt: new Date(),
//   };

//   await updateDoc(userDoc.ref, updates);
//   console.log(`Updated user ${clerkUser.id} in database`);
// }

// async function handleUserDeleted(clerkUser: any) {
//   try {
//     const usersRef = collection(db, "users");
//     const q = query(usersRef, where("clerkUserId", "==", clerkUser.id));
//     const querySnapshot = await getDocs(q);

//     if (querySnapshot.empty) {
//       console.warn(`User ${clerkUser.id} not found in database, skipping deletion`);
//       return;
//     }

//     const batch = writeBatch(db);
//     querySnapshot.forEach((doc) => {
//       batch.delete(doc.ref);
//     });
//     await batch.commit();
    
//     console.log(`Deleted user ${clerkUser.id} from database`);
//   } catch (error) {
//     console.error(`Failed to delete user ${clerkUser.id}:`, error);
//   }
// }