// Shared types for public message functionality

// JSON body shape from FE
export interface PublicMessageRequest {
  province: string
  query: string
  threadId: string
}

export interface PrivateMessageRequest {
  province: string
  query: string
  threadId: string
  company: string
}

// State returned from FastAPI service
export interface AIResponse {
  publicResponse: string
  publicFound: boolean
  publicMetadata: Document[]
  privateResponse: string
  privateFound: boolean
  privateMetadata: Document[]
}

export interface Document {
  source: string
  type: string
  title: string
  page: string
  content: string
}

// Minimal payload needed by FE
export interface UserMessageResponse {
  response: string
  citations: Citation[]
}

export interface Citation {
  originalUrl: string
  fragmentUrl: string
  title: string
}

export interface CarouselCard {
  title: string
  content: string
  icon?: string
  action?: {
    text: string
    url: string
  }
}
