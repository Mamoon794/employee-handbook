import { NextResponse } from 'next/server';
import { db } from '../../../../dbConfig/firebaseConfig';

export async function GET() {
  try {
    const usersRef = db.collection("users");
    console.log("usersRef", usersRef);
    
    const query = usersRef.where("userType", "==", "Employee");
    console.log("query", query);
    
    const snapshot = await query.get();
    console.log("snapshot size:", snapshot.size);
    console.log("snapshot empty:", snapshot.empty);
    console.log("snapshot docs:", snapshot.docs.length);
    
    const allUsersSnapshot = await usersRef.get();
    console.log("Total users in database:", allUsersSnapshot.size);
    allUsersSnapshot.docs.forEach((doc: any, index: number) => {
      const userData = doc.data();
      console.log(`User ${index + 1}:`, {
        id: doc.id,
        userType: userData.userType,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        province: userData.province,
        companyId: userData.companyId,
        companyName: userData.companyName,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt
      });

    });
    
    const totalEmployees = snapshot.size;
    
    return NextResponse.json({ totalEmployees });
  } catch (error) {
    console.error("Error fetching total employees:", error);
    return NextResponse.json({ totalEmployees: 0 }, { status: 500 });
  }
} 
