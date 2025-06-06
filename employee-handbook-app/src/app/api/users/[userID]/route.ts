import { getUser } from "../../../../models/dbOperations";

export async function GET(request: Request, { params }: { params: { userID: string } }) {
    const { userID } = await params;
    try {
        const user = await getUser(userID);
        if (user) {
            return new Response(JSON.stringify(user), { status: 200 });
        } else {
            return new Response(JSON.stringify({ "error": "User not found" }), { status: 404 });
        }
    } catch (error) {
        console.error("Error fetching user:", error);
        return new Response(JSON.stringify({ "error": "Failed to fetch user" }), { status: 500 });
    }
}