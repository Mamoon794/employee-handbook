import { getUser, getClerkUser } from "../../../../models/dbOperations";
import { Sentry } from "../../../../lib/sentry";

export async function GET(request: Request, { params }: { params: Promise<{ userID: string }> }) {
    const { userID } = await params;
    const url = new URL(request.url);
    const isClerkID = url.searchParams.get("isClerkID") === "true";
    try {
        let user;
        if (isClerkID) {
            user = await getClerkUser(userID);
        }
        else{
            user = await getUser(userID);
        }

        if (user) {
            return new Response(JSON.stringify(user), { status: 200 });
        } else {
            return new Response(JSON.stringify({ "error": "User not found" }), { status: 404 });
        }
    } catch (error) {
        console.error("Error fetching user:", error);
        Sentry.captureException(error);
        return new Response(JSON.stringify({ "error": "Failed to fetch user" }), { status: 500 });
    }
}