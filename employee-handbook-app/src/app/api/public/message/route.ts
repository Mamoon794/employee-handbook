/* eslint-disable */
import { NextRequest, NextResponse } from "next/server";
import { handlePublicMessage } from "@/services/messageService";
import type { PublicMessageRequest } from "@/types/ai";

/**
 * API route to handle messages from public users.
 *
 * Expects a JSON body with:
 * - province: the user's selected province
 * - question: the user's query
 *
 * Returns the AI-generated response.
 */
export async function POST(req: NextRequest) {
    let payload: PublicMessageRequest;
    try {
        payload = await req.json();
    } catch {
        return NextResponse.json(
            { error: "Invalid JSON body" }, 
            { status: 400 }
        );
    }

    const { province, question } = payload;
    if (!province || !question.trim()) {
        return NextResponse.json(
            { error: "Missing province or question" },
            { status: 400 }
        );
    }

    try {
        const result = await handlePublicMessage(province, question);
        return NextResponse.json(result);
    } catch (e: any) {
        console.error(e);
        return NextResponse.json(
            { error: e.message || "Server error" },
            { status: 500 }
        );
    }
}