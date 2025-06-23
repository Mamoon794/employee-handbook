import { addMessageToChat } from "../../../../../models/dbOperations";
import { Sentry } from "../../../../../lib/sentry";


export async function PUT(request: Request, { params }: { params: Promise<{ theID: string }> }) {
    const { theID } = await params;
    try {
        const messageData = await request.json();
        console.log("Received message data:", messageData);
        // Assuming updateChat is a function that updates the chat in the database
        const updatedChat = await addMessageToChat(theID, messageData["messageData"]);
        return new Response(JSON.stringify(updatedChat), { status: 200 });
    } catch (error) {
        console.error("Error updating chat:", error);
        Sentry.captureException(error);
        return new Response(JSON.stringify({ "error": "Failed to update chat" }), { status: 500 });
    }
}