import { getUserChats, getChat } from "../../../../models/dbOperations";
import { Sentry } from "../../../../lib/sentry";

export async function GET(request: Request, { params }: { params: Promise<{ theID: string }> }) {
    const url = new URL(request.url);
    const isUserID = url.searchParams.get("isUserID");
    const { theID } = await params;
    try{
        let chats;
        if (isUserID && isUserID === "true") {
            chats = await getUserChats(theID);
        }
        else{
            chats = await getChat(theID);
        }
        return new Response(JSON.stringify(chats), { status: 200 });
    } catch (error) {
        console.error("Error fetching user chats:", error);
        Sentry.captureException(error);
        return new Response(JSON.stringify({ "error": "Failed to fetch user chats" }), { status: 500 });
    }
}