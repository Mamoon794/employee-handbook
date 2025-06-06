import { getUserChats, getChat } from "../../../../models/dbOperations";

export async function GET(request: Request, { params }: { params: { theID: string } }) {
    const url = new URL(request.url);
    const isUserID = url.searchParams.get("iUserID");
    const { theID } = await params;
    try{
        let chats;
        if (isUserID){
            chats = await getUserChats(theID);
        }
        else{
            chats = await getChat(theID);
        }
        return new Response(JSON.stringify(chats), { status: 200 });
    } catch (error) {
        console.error("Error fetching user chats:", error);
        return new Response(JSON.stringify({ "error": "Failed to fetch user chats" }), { status: 500 });
    }
}