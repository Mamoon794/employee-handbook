import { getUserChats, getChat, deleteChat } from "../../../../models/dbOperations";
import { Sentry } from "../../../../lib/sentry";
import { Chat } from "../../../../models/schema";
import { Timestamp } from "firebase-admin/firestore";
type ChatWithDate = Omit<Chat, "createdAt"> & { createdAt: Timestamp };

export async function GET(request: Request, { params }: { params: Promise<{ theID: string }> }) {
    const url = new URL(request.url);
    const isUserID = url.searchParams.get("isUserID");
    const { theID } = await params;
    try{
        let chats;
        if (isUserID && isUserID === "true") {
            chats = await getUserChats(theID);
            (chats as ChatWithDate[]).sort((a, b) => {
                return b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime();
            });
            console.log("Fetched user chats:", chats);
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



export async function DELETE(request: Request, { params }: { params: Promise<{ theID: string }> }) {
    const { theID } = await params;
    try {
        // Assuming deleteChat is a function that deletes the chat in the database
        const deletedChat = await deleteChat(theID);
        return new Response(JSON.stringify(deletedChat), { status: 200 });
    } catch (error) {
        console.error("Error deleting chat:", error);
        Sentry.captureException(error);
        return new Response(JSON.stringify({ "error": "Failed to delete chat" }), { status: 500 });
    }
}