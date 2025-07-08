import { NextResponse } from 'next/server';
import { db } from '../../../../dbConfig/firebaseConfig';
import { DocumentData } from 'firebase/firestore';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    const usersRef = db.collection("users");
    console.log("usersRef", usersRef);
    
    let totalEmployees = 0;
    
    if (!startDate || !endDate) {
      const query = usersRef.where("userType", "==", "Employee");
      const snapshot = await query.get();
      totalEmployees = snapshot.size;
    } else {
      try {
        const startTimestamp = new Date(startDate);
        const endTimestamp = new Date(endDate);
        endTimestamp.setHours(23, 59, 59, 999); 
        
        const query = usersRef.where("userType", "==", "Employee")
                             .where("createdAt", ">=", startTimestamp)
                             .where("createdAt", "<=", endTimestamp);
        
        const snapshot = await query.get();
        totalEmployees = snapshot.size;
      } catch {
        console.log("Composite index not available, falling back to client-side filtering");
        const query = usersRef.where("userType", "==", "Employee");
        const snapshot = await query.get();
        
        const startTimestamp = new Date(startDate);
        const endTimestamp = new Date(endDate);
        endTimestamp.setHours(23, 59, 59, 999);
        
        totalEmployees = snapshot.docs.filter((doc: DocumentData) => {
          const userData = doc.data();
          const createdAt = userData.createdAt?.toDate?.() || new Date(userData.createdAt);
          return createdAt >= startTimestamp && createdAt <= endTimestamp;
        }).length;
      }
    }
    
    console.log("Total employees:", totalEmployees);
    
    const allUsersSnapshot = await usersRef.get();
    console.log("Total users in database:", allUsersSnapshot.size);
    allUsersSnapshot.docs.forEach((doc: DocumentData, index: number) => {
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
    
    return NextResponse.json({ totalEmployees, success: true });
  } catch (error) {
    console.error("Error fetching total employees:", error);
    return NextResponse.json({ 
      error: 'Failed to fetch total employees', 
      success: false 
    }, { status: 500 });
  }
} 
