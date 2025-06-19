import {User} from "../../../models/schema";
import {createUser} from "../../../models/dbOperations";
import { Sentry } from "../../../lib/sentry";

export async function POST(request: Request) {
    try{
        const userData: Omit<User, "id"> = await request.json();
        const userDoc = await createUser(userData);
        return new Response(JSON.stringify({"message": "User created successfully", id: userDoc.id }), { status: 201 });
    } catch (error) {
        console.error("Error creating user:", error);
        Sentry.captureException(error);
        return new Response(JSON.stringify({ "error": "Failed to create user" }), { status: 500 });
    }
}

