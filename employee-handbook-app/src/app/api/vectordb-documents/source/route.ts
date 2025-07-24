import { NextResponse } from "next/server"
import { deleteDocumentFromVectorDB } from "@/integrations/aiService"

export async function DELETE(request: Request) {
  const { source, namespace } = await request.json()
  if (!namespace || !source) {
    return NextResponse.json(
      { error: "Missing namespace or source" },
      { status: 400 }
    )
  }
  try {
    // Assuming there's a function to delete the namespace in the vector DB
    const res = await deleteDocumentFromVectorDB(source, namespace)
    return NextResponse.json(res, { status: 200 })
  } catch (error: any) {
    console.error(`Error deleting document ${source} from vector DB: ${error}`)
    return NextResponse.json(
      { error: error.message || "Failed to delete document from vector DB" },
      { status: 500 }
    )
  }
}
