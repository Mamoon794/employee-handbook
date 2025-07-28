import { NextResponse } from "next/server"
import { deleteDocumentFromVectorDB } from "@/integrations/aiService"

export async function PATCH(request: Request) {
  const { url, company } = await request.json()
  if (!company || !url) {
    return NextResponse.json(
      { error: "Missing company or URL" },
      { status: 400 }
    )
  }
  try {
    // Assuming there's a function to delete the company documents in the vector DB
    const res = await deleteDocumentFromVectorDB(url, company)
    return NextResponse.json(res, { status: 200 })
  } catch (error) {
    console.error(`Error deleting document ${url} from vector DB: ${error}`)
    return NextResponse.json(
      { error: "Failed to delete document from vector DB" },
      { status: 500 }
    )
  }
}
