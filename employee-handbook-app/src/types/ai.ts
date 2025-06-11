// Shared types for public message functionality

// JSON body shape from FE
export interface PublicMessageRequest {
    province: string;
    question: string;
}

// State returned from FastAPI service
export interface AIResponse {
    response: {
        question: string;
        context: Document[];
        answer: string;
    };
}

export interface Document {
    id: string;
    type: string;
    page_content: string;
    metadata: {
        source: string;
        start_index: number;
        [key: string]: unknown;
    };
    [key: string]: unknown;
}

// Minimal payload needed by FE
export interface PublicMessageResponse {
    answer: string;
    citations: Citation[];
}

export interface Citation {
    originalUrl: string;
    fragmentUrl: string;
}