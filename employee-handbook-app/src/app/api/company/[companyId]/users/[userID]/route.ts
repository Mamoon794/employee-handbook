import { removeUserFromCompany } from "@/models"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userID: string }> }
) {
  const { userID } = await params

  try {
    const deleted = await removeUserFromCompany(userID)

    if (deleted) {
      return new Response(null, { status: 200 })
    } else {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
      })
    }
  } catch (error) {
    console.error("Error removing the user from the company:", error)
    return new Response(
      JSON.stringify({ error: "Failed to remove user from the company" }),
      {
        status: 500,
      }
    )
  }
}
