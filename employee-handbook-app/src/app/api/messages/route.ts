import {Message} from "../../../models/schema";

import {addMessageToChat} from "../../../models/dbOperations";

export async function POST(request: Request){
    try{
        const {chatID, messageData}: {chatID: string, messageData: Omit<Message, "id">} = await request.json();
        const messageDoc = await addMessageToChat(chatID, messageData);
        return new Response(JSON.stringify({"message": "Message added successfully", id: messageDoc.id }), { status: 201 });
    } catch (error) {
        console.error("Error adding message to chat:", error);
        return new Response(JSON.stringify({ "error": "Failed to add message to chat" }), { status: 500 });
    }
}