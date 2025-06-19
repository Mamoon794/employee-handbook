// IGNORE

// import { db } from "@/dbConfig/firebaseConfig";
// import { doc, getDoc, setDoc } from "firebase/firestore";
// import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
// import { handleUserCreated } from '@/app/api/clerk-webhook/route';
// import type { UserType } from '@/models/schema';

// import dotenv from 'dotenv';
// dotenv.config({ path: '.env.local' });

// interface TestClerkEvent {
//   type: 'user.created';
//   data: {
//     id: string;
//     first_name?: string;
//     last_name?: string;
//     email_addresses: Array<{
//       email_address: string;
//       verification?: { status: string };
//     }>;
//     public_metadata: {
//       role: UserType;
//       companyName: string;
//       province: string;
//       isSubscribed: boolean;
//       phoneNumber: string;
//     };
//   };
// }

// async function runTest() {
//   console.log("Starting webhook test...");
//   const auth = getAuth();

//   try {
//     console.log("Authenticating test admin...");
//     await signInWithEmailAndPassword(
//       auth,
//       process.env.TEST_ADMIN_EMAIL!,
//       process.env.TEST_ADMIN_PASSWORD!
//     );
//     const userId = auth.currentUser?.uid;
//     if (!userId) throw new Error("Authentication failed");
//     console.log("✔ Authenticated as:", userId);

//     const testEvent: TestClerkEvent = {
//       type: 'user.created',
//       data: {
//         id: 'test_user_' + Math.random().toString(36).substring(2, 8),
//         first_name: 'Test',
//         last_name: 'User',
//         email_addresses: [{ email_address: 'test@example.com' }],
//         public_metadata: {
//           role: 'Owner',
//           companyName: 'Test Co',
//           province: 'ON',
//           isSubscribed: true,
//           phoneNumber: '+1234567890'
//         }
//       }
//     };

//     console.log("Creating test company...");
//     await setDoc(doc(db, "companies", "test_company"), {
//       name: "Test Company",
//       ownerId: testEvent.data.id,
//       createdAt: new Date(),
//       updatedAt: new Date()
//     });

//     console.log("Executing webhook handler...");
//     await handleUserCreated(testEvent);

//     console.log("Verifying user creation...");
//     const userDoc = await getDoc(doc(db, "users", testEvent.data.id));
//     if (!userDoc.exists()) throw new Error("User document not created");
    
//     console.log("Test passed successfully");
//     console.log("User data:", userDoc.data());
    
//   } catch (error) {
//     console.error("Test failed:");
//     console.error(error);
//     process.exit(1);
//   } finally {
//     if (auth.currentUser) {
//       await auth.signOut();
//     }
//   }
// }

// runTest();