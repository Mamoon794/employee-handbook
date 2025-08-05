import { getAllUsers } from "@/models/dbOperations"

const VALID_SORTS = [
  "createdAt",
  "email",
  "firstName",
  "lastName",
  "province",
  "updatedAt",
  "userType",
]

export async function GET(
  request: Request,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const { companyId } = await params
  const url = new URL(request.url)
  const sort = url.searchParams.get("sort") || "firstName"

  if (!VALID_SORTS.includes(sort)) {
    return new Response(JSON.stringify({ error: "Invalid sort parameter" }), {
      status: 400,
    })
  }

  try {
    const allUsers = await getAllUsers(companyId, sort)

    if (allUsers) {
      console.log("All users fetched successfully:", JSON.stringify(allUsers))
      return new Response(JSON.stringify(allUsers), { status: 200 })
    } else {
      return new Response(JSON.stringify({ error: "No users found" }), {
        status: 404,
      })
    }
  } catch (error) {
    console.error("Error fetching users:", error)
    return new Response(JSON.stringify({ error: "Failed to fetch users" }), {
      status: 500,
    })
  }
}
