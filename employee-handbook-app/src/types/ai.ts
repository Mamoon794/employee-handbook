// Shared types for public message functionality

// JSON body shape from FE
export interface PublicMessageRequest {
    province: string;
    query: string;
    threadId: string;
}

// State returned from FastAPI service
export interface AIResponse {
    response: string;
    metadata: Document[];
}

export interface Document {
    source: string;
    type: string;
    title: string;
    page: string;
    content: string;
}

// Minimal payload needed by FE
export interface PublicMessageResponse {
    response: string;
    citations: Citation[];
}

export interface Citation {
    originalUrl: string;
    fragmentUrl: string;
    title: string;
}