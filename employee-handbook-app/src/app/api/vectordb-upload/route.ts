import { NextResponse } from "next/server"
import { uploadFileToVectorDB } from "@/integrations/aiService"

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
