// IGNORE

// import { createUser, createCompany, addDocument } from "@/models/dbOperations";
// import { db } from "@/dbConfig/firebaseConfig";
// import { doc, getDoc, updateDoc } from "firebase/firestore";

// async function testWithClerk() {
//   try {
//     const clerkUserId = "test_clerk_id_" + Math.random().toString(36).substring(2, 8);
    
//     const user = await createUser({
//       clerkUserId, 
//       firstName: "ClerkTest",
//       lastName: "User",
//       email: "clerk-test@company.com", 
//       twoFactorEnabled: false, 
//       userType: "Employee",
//       isSubscribed: true,
//       province: "ON",
//       companyName: "Test Company", 
//       createdAt: new Date(),
//       updatedAt: new Date()
//     });
//     console.log("Created Clerk user:", user.id);

//     const userDoc = await getDoc(doc(db, "users", user.id));
//     console.log("User document:", userDoc.data());

//     const company = await createCompany({
//       name: "Clerk Test Corp",
//       ownerId: clerkUserId, 
//       createdAt: new Date(),
//       updatedAt: new Date()
//     });
//     console.log("Created company:", company.id);

//     await updateDoc(doc(db, "users", user.id), {
//       companyId: company.id
//     });
//     console.log("Updated user with company reference");

//     const document = await addDocument({
//       companyId: company.id,
//       fileUrl: "https://test.com/clerk-policy.pdf",
//       description: "Test policy document",
//       isPublic: true,
//       uploadDate: new Date()
//     });
//     console.log("Uploaded document:", document.id);

//     const companyDoc = await getDoc(doc(db, "companies", company.id));
//     console.log("Company document:", companyDoc.data());

//     console.log("All Clerk integration tests passed");
//   } catch (error) {
//     console.error("Test failed:", error);
//   }
// }

// testWithClerk();