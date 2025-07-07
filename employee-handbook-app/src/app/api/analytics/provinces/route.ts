import { NextResponse } from 'next/server';
import { db } from '../../../../dbConfig/firebaseConfig';
import { DocumentData } from 'firebase/firestore';

export async function GET() {
  try {
    const usersRef = db.collection("users");
    
    const employeeQuery = usersRef.where("userType", "==", "Employee");
    const employeeSnapshot = await employeeQuery.get();
    
    const provinceCounts: { [key: string]: number } = {};
    let totalEmployees = 0;
    
    employeeSnapshot.docs.forEach((doc: DocumentData) => {
      const userData = doc.data();
      const province = userData.province || 'Unknown'; // maybe "other" can work as well?
      provinceCounts[province] = (provinceCounts[province] || 0) + 1;
      totalEmployees++;
    });
    
    const provinceDistribution = Object.entries(provinceCounts).map(([province, count]) => ({
      province,
      count,
      percentage: totalEmployees > 0 ? Math.round((count / totalEmployees) * 100 * 10) / 10 : 0
    }));
    
    const sortedDistribution = provinceDistribution.sort((a, b) => b.count - a.count);
    
    console.log("=== PROVINCE DISTRIBUTION ===");
    console.log("Total employees:", totalEmployees);
    console.log("Province breakdown:", sortedDistribution);
    
    return NextResponse.json({ 
      totalEmployees, 
      provinceDistribution: sortedDistribution, 
      success: true 
    });
  } catch (error) {
    console.error("Error fetching province distribution:", error);
    return NextResponse.json({ 
      error: 'Failed to fetch province distribution', 
      success: false 
    }, { status: 500 });
  }
} 