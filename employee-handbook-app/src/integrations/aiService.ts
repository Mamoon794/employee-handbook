import type { AIResponse } from "@/types/ai";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL;

/**
 * Calls the upstream FastAPI service at POST /responses
 */
export async function callAiService(
    province: string,
    question: string
): Promise<AIResponse> {
    if (!AI_SERVICE_URL) {
        throw new Error("AI_SERVICE_URL not configured");
    }

    const res = await fetch(`${AI_SERVICE_URL}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ province, question }),
    });

    console.log("AI_SERVICE_URL:", AI_SERVICE_URL);
    console.log("Full request URL:", `${AI_SERVICE_URL}/responses`);
    console.log("Response status:", res.status, res.statusText);

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`AI service error: ${text}`);
    }

    return (await res.json()) as AIResponse;
}
