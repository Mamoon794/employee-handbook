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
    question: string
): Promise<PublicMessageResponse> {
    const aiResult = await callAiService(province, question);

    const citations: Citation[] = aiResult.metadata.map(doc => {
        const originalUrl = String(doc.source);
        let fragmentUrl = originalUrl;

        if (doc.page !== "") { // This is a pdf
            fragmentUrl = `${originalUrl}#page=${doc.page}`
        } else if (doc.content) {
            // Use text fragment for HTML
            const firstWords = doc.content.split(" ").slice(0, 20).join(" ");
            const fragment = encodeURIComponent(firstWords);
            fragmentUrl = `${originalUrl}#:~:text=${fragment}`;
        }

        return { 
            originalUrl, 
            fragmentUrl, 
            title: doc.title 
        };
    });

    console.log(citations);

    return {
        response: aiResult.response,
        citations,
    };
}