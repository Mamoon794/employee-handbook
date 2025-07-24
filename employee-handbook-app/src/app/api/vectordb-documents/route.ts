import { NextResponse } from "next/server"
import {
  uploadFileToVectorDB,
  deleteCompanyFromVectorDB,
} from "@/integrations/aiService"

export async function POST(request: Request) {
  const { fileurl, namespace } = await request.json()
  if (!fileurl || !namespace) {
    return NextResponse.json(
      { error: "Missing fileurl or namespace" },
      { status: 400 }
    )
  }
  try {
    const res = await uploadFileToVectorDB(fileurl, namespace)
    return NextResponse.json(res, { status: 200 })
  } catch (error: any) {
    console.error("Error uploading file to vector DB:", error)
    return NextResponse.json(
      { error: error.message || "Failed to upload file to vector DB" },
      { status: 500 }
    )
  }
}

// delete the entire company
export async function PATCH(request: Request) {
  const { company } = await request.json()
  if (!company) {
    return NextResponse.json({ error: "Missing company name" }, { status: 400 })
  }
  try {
    // Assuming there's a function to delete the company in the vector DB
    const res = await deleteCompanyFromVectorDB(company)
    return NextResponse.json(res, { status: 200 })
  } catch (error: any) {
    console.error(`Error deleting company ${company} from vector DB: ${error}`)
    return NextResponse.json(
      { error: error.message || "Failed to delete company from vector DB" },
      { status: 500 }
    )
  }
}
