jest.mock("@/services/messageService", () => ({
  handlePrivateMessage: jest.fn(),
}))

import { POST } from "@/app/api/messages/private/route"
import { handlePrivateMessage } from "@/services/messageService"
import { NextRequest } from "next/server"
import type { UserMessageResponse } from "@/models/ai"

describe("POST /api/messages/private", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("Input Validation (400 errors)", () => {
    it("returns 400 for invalid JSON body", async () => {
      const request = new Request("http://localhost", {
        method: "POST",
        body: "not-json", // invalid JSON
      })

      const response = await POST(request as NextRequest)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result).toEqual({ error: "Invalid JSON body" })
    })

    it("returns 400 if province is missing", async () => {
      const request = new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({
          query: "What is minimum wage?",
          threadId: "thread-123",
          company: "Test Company",
        }),
      })

      const response = await POST(request as NextRequest)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result).toEqual({ error: "Missing province, question or threadId" })
    })

    it("returns 400 if query is missing (undefined)", async () => {
      const request = new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({
          province: "ON",
          threadId: "thread-123",
          company: "Test Company",
        }),
      })

      const response = await POST(request as NextRequest)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result).toEqual({ error: "Missing province, question or threadId" })
    })

    it("returns 400 if query is empty or whitespace", async () => {
      const request = new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({
          province: "ON",
          query: "   ",
          threadId: "thread-123",
          company: "Test Company",
        }),
      })

      const response = await POST(request as NextRequest)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result).toEqual({ error: "Missing province, question or threadId" })
    })

    it("returns 400 if threadId is missing", async () => {
      const request = new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({
          province: "ON",
          query: "What is minimum wage?",
          company: "Test Company",
        }),
      })

      const response = await POST(request as NextRequest)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result).toEqual({ error: "Missing province, question or threadId" })
    })
  })

  describe("Successful Responses (200)", () => {
    it("returns 200 on success with company", async () => {
      const mockResponse: UserMessageResponse = {
        publicResponse: "Public answer",
        publicSources: [],
        privateResponse: "Private answer",
        privateSources: [],
      }
      ;(handlePrivateMessage as jest.Mock).mockResolvedValue(mockResponse)

      const request = new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({
          province: "ON",
          query: "What is minimum wage?",
          threadId: "thread-123",
          company: "Test Company",
        }),
      })

      const response = await POST(request as NextRequest)
      const result = await response.json()

      expect(handlePrivateMessage).toHaveBeenCalledWith(
        "ON",
        "What is minimum wage?",
        "thread-123",
        "Test Company"
      )
      expect(response.status).toBe(200)
      expect(result).toEqual(mockResponse)
    })

    it("returns 200 on success without company", async () => {
      const mockResponse: UserMessageResponse = {
        publicResponse: "Public answer",
        publicSources: [],
        privateResponse: "Private answer",
        privateSources: [],
      }
      ;(handlePrivateMessage as jest.Mock).mockResolvedValue(mockResponse)

      const request = new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({
          province: "BC",
          query: "How many hours can I work?",
          threadId: "thread-456",
        }),
      })

      const response = await POST(request as NextRequest)
      const result = await response.json()

      expect(handlePrivateMessage).toHaveBeenCalledWith(
        "BC",
        "How many hours can I work?",
        "thread-456",
        undefined
      )
      expect(response.status).toBe(200)
      expect(result).toEqual(mockResponse)
    })

    it("handles complex response with citations", async () => {
      const mockResponse: UserMessageResponse = {
        publicResponse: "Public response with citations",
        publicSources: [
          {
            originalUrl: "https://example.com/doc1",
            fragmentUrl: "https://example.com/doc1#page=1",
            title: "Document 1",
          },
        ],
        privateResponse: "Private response with citations",
        privateSources: [
          {
            originalUrl: "https://company.com/handbook",
            fragmentUrl: "https://company.com/handbook#page=5",
            title: "Company Handbook",
          },
        ],
      }
      ;(handlePrivateMessage as jest.Mock).mockResolvedValue(mockResponse)

      const request = new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({
          province: "MB",
          query: "What is the vacation policy?",
          threadId: "thread-202",
          company: "Large Corp",
        }),
      })

      const response = await POST(request as NextRequest)
      const result = await response.json()

      expect(handlePrivateMessage).toHaveBeenCalledWith(
        "MB",
        "What is the vacation policy?",
        "thread-202",
        "Large Corp"
      )
      expect(response.status).toBe(200)
      expect(result).toEqual(mockResponse)
      expect(result.publicSources).toHaveLength(1)
      expect(result.privateSources).toHaveLength(1)
    })
  })

  describe("Error Handling (500 errors)", () => {
    it("returns 500 if handlePrivateMessage throws an error", async () => {
      ;(handlePrivateMessage as jest.Mock).mockRejectedValue(
        new Error("AI service failure")
      )

      const request = new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({
          province: "AB",
          query: "What are my rights?",
          threadId: "thread-789",
          company: "Another Company",
        }),
      })

      const response = await POST(request as NextRequest)
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result).toEqual({ error: "AI service failure" })
    })

    it("returns 500 with generic error message when error has no message", async () => {
      ;(handlePrivateMessage as jest.Mock).mockRejectedValue(new Error())

      const request = new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({
          province: "SK",
          query: "What is overtime pay?",
          threadId: "thread-101",
          company: "Test Corp",
        }),
      })

      const response = await POST(request as NextRequest)
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result).toEqual({ error: "Server error" })
    })
  })
})
