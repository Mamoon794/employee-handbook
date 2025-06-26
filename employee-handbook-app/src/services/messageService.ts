/* eslint-disable */
import type { AIResponse, PublicMessageResponse, Citation } from "@/types/ai";
import { callAiService } from "@/integrations/aiService";

/**
 * Core logic for a public user's question.
 * Transforms full AI service payload into minimal frontend needs,
 * generating hyperlinks to exact section within sources.
 */
export async function handlePublicMessage(
    province: string,
    question: string,
    threadId: string
): Promise<PublicMessageResponse> {
    const aiResult = await callAiService(province, question, threadId);

    const seen = new Set<string>();
    const citations: Citation[] = [];
    
    for (const doc of aiResult.metadata) {
        const originalUrl = String(doc.source);
        if (seen.has(originalUrl)) continue;
        seen.add(originalUrl);
    
        let fragmentUrl = originalUrl;
        if (doc.type === "pdf") {
            fragmentUrl = `${originalUrl}#page=${doc.page}`;
        } else if (doc.type === "html") {
        // Use text fragment for HTML -> this is unreliable
        // const firstWords = doc.content.split(" ").slice(0, 10).join(" ");
        // const fragment = encodeURIComponent(firstWords);
        // fragmentUrl = `${originalUrl}#:~:text=${fragment}`;
        }
    
        citations.push({
            originalUrl,
            fragmentUrl,
            title: doc.title,
        });

        if (citations.length >= 3) break;
    }

    console.log(citations);

    return {
        response: aiResult.response,
        citations,
    };
}