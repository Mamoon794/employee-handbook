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

// delete the entire namespace
export async function DELETE(request: Request) {
  const { namespace } = await request.json()
  if (!namespace) {
    return NextResponse.json(
      { error: "Missing namespace (company name)" },
      { status: 400 }
    )
  }
  try {
    // Assuming there's a function to delete the namespace in the vector DB
    const res = await deleteCompanyFromVectorDB(namespace)
    return NextResponse.json(res, { status: 200 })
  } catch (error: any) {
    console.error(
      `Error deleting company ${namespace} from vector DB: ${error}`
    )
    return NextResponse.json(
      { error: error.message || "Failed to delete company from vector DB" },
      { status: 500 }
    )
  }
}
