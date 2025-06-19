//src\test-firestore.ts

// import { createUser, getUser, createCompany, addDocument } from "./models/dbOperations";

// async function testFirestore() {
//   try {
//     // testing user creation
//     const user = await createUser({
//       firstName: "Test",
//       lastName: "User",
//       primaryEmail: "test@company.com",
//       userType: "Employee",
//       isSubscribed: true,
//       province: "ON",
//       companyId: "", 
//       createdAt: new Date(), 
//       updatedAt: new Date()  
//     });
//     console.log("Created user:", user.id);

//     // testing company creation
//     const company = await createCompany({
//       name: "Test Corp",
//       ownerId: user.id,
//       createdAt: new Date(), 
//       updatedAt: new Date()  
//     });
//     console.log("Created company:", company.id);

//     // testing doc upload
//     const doc = await addDocument({
//       companyId: company.id,
//       fileUrl: "https://test.com/policy.pdf",
//       isPublic: true,
//       uploadDate: new Date()
//     });
//     console.log("Uploaded document:", doc.id);

//   } catch (error) {
//     console.error("Firestore test failed:", error);
//   }
// }

// testFirestore();