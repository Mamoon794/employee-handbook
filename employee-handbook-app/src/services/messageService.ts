import type { AIResponse, PublicMessageResponse, Citation } from "@/types/ai";
import { callAiService } from "@/integrations/aiService";

/**
 * Core logic for a public user's question.
 * Transforms full AI service payload into minimal frontend needs,
 * generating hyperlinks to exact paragraphs within sources.
 */
export async function handlePublicMessage(
    province: string,
    question: string
): Promise<PublicMessageResponse> {
    const aiResult = await callAiService(province, question);
    const { answer, context } = aiResult.response;

    const citations: Citation[] = context.map(doc => {
        const originalUrl = String(doc.metadata.source);
        let fragmentUrl = originalUrl;

        if (originalUrl.endsWith('.pdf')) {
            // TODO: Use another approach to make PDF hyperlinks
        } else {
            // Use text fragment for HTML
            const firstWords = doc.page_content.split(" ").slice(0, 20).join(" ");
            const fragment = encodeURIComponent(firstWords);
            fragmentUrl = `${originalUrl}#:~:text=${fragment}`;
        }

        return { originalUrl, fragmentUrl };
    });

    return {
        answer: answer.trim(),
        citations,
    };
}