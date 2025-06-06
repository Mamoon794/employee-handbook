import {Chat} from "../../../models/schema";

import {createChat} from "../../../models/dbOperations";

export async function POST(request: Request) {
    try {
        const chatData: Omit<Chat, "id"> = await request.json();
        const chatDoc = await createChat(chatData);
        return new Response(JSON.stringify({"message": "Chat created successfully", id: chatDoc.id }), { status: 201 });
    } catch (error) {
        console.error("Error creating chat:", error);
        return new Response(JSON.stringify({ "error": "Failed to create chat" }), { status: 500 });
    }
}