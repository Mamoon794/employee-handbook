import { Company } from "@/models/schema"
import { createCompany, getCompany } from "@/models/dbOperations"
import { Sentry } from "@/lib/sentry"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id") || ""
    const companyInfo = await getCompany(id)
    return new Response(JSON.stringify(companyInfo), { status: 200 })
  } catch (error) {
    console.error("Error fetching company:", error)
    Sentry.captureException(error)
    return new Response(JSON.stringify({ error: "Failed to fetch company" }), {
      status: 500,
    })
  }
}

export async function POST(request: Request) {
  try {
    const { companyData }: { companyData: Omit<Company, "id"> } =
      await request.json()
    const companyDoc = await createCompany(companyData)
    return new Response(
      JSON.stringify({
        message: "Company created successfully",
        id: companyDoc.id,
      }),
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating company:", error)
    Sentry.captureException(error)
    return new Response(JSON.stringify({ error: "Failed to create company" }), {
      status: 500,
    })
  }
}

export async function PUT(request: Request) {
  try {
    const {
      companyId,
      companyData,
    }: { companyId: string; companyData: Partial<Company> } =
      await request.json()
    if (!companyId || !companyData) {
      return new Response(
        JSON.stringify({ error: "Missing companyId or companyData" }),
        { status: 400 }
      )
    }

    // Update logic here (not implemented in this snippet)
    // const updatedCompany = await updateCompany(companyId, companyData);

    return new Response(
      JSON.stringify({ message: "Company updated successfully" }),
      { status: 200 }
    )
  } catch (error) {
    console.error("Error updating company:", error)
    Sentry.captureException(error)
    return new Response(JSON.stringify({ error: "Failed to update company" }), {
      status: 500,
    })
  }
}
