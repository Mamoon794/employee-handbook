import { getUser, getClerkUser, updateUser, deleteUser } from "../../../../models/dbOperations";
import { Sentry } from "../../../../lib/sentry";
import { UserType } from "@/models/schema";

const VALID_USER_TYPES: UserType[] = ["Employee", "Owner", "Administrator", "Financer"];

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

export async function PATCH(request: Request, { params }: { params: Promise<{ userID: string }> }) {
    const { userID } = await params;
    const { userType } = await request.json();

    if (!VALID_USER_TYPES.includes(userType)) {
        return new Response(JSON.stringify({ "error": "Invalid user type" }), { status: 400 });
    }

    try {
        const user = await updateUser(userID, userType);

        if (user) {
            return new Response(JSON.stringify(user), { status: 200 });
        } else {
            return new Response(JSON.stringify({ "error": "User not found" }), { status: 404 });
        }
    } catch (error) {
        console.error("Error updating user:", error);
        return new Response(JSON.stringify({ "error": "Failed to update user" }), { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ userID: string }> }) {
    const { userID } = await params;

    try {
        const deleted = await deleteUser(userID);

        if (deleted) {
            return new Response(null, { status: 204 });
        } else {
            return new Response(JSON.stringify({ "error": "User not found" }), { status: 404 });
        }
    } catch (error) {
        console.error("Error deleting user:", error);
        return new Response(JSON.stringify({ "error": "Failed to delete user" }), { status: 500 });
    }
}