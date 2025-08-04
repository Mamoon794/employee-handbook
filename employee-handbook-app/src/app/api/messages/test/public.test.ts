jest.mock("@/services/messageService", () => ({
  handlePublicMessage: jest.fn(),
}))

import { POST } from "@/app/api/messages/public/route" // adjust this import to your actual route path
import { handlePublicMessage } from "@/services/messageService"
import { NextRequest } from "next/server"

describe("POST /api/messages/public", () => {
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

  it("returns 400 if province, query, or threadId is missing or invalid", async () => {
    const request = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ province: "ON", query: "   ", threadId: "" }),
    })

    const response = await POST(request as NextRequest)
    const result = await response.json()

    expect(response.status).toBe(400)
    expect(result).toEqual({ error: "Missing province, question, or threadId" })
  })

  it("calls handlePublicMessage and returns 200 on success", async () => {
    const mockResponse = { answer: "Hello from AI!" }
    ;(handlePublicMessage as jest.Mock).mockResolvedValue(mockResponse)

    const request = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({
        province: "ON",
        query: "What is minimum wage?",
        threadId: "thread-123",
      }),
    })

    const response = await POST(request as NextRequest)
    const result = await response.json()

    expect(handlePublicMessage).toHaveBeenCalledWith(
      "ON",
      "What is minimum wage?",
      "thread-123"
    )
    expect(response.status).toBe(200)
    expect(result).toEqual(mockResponse)
  })

  it("returns 500 if handlePublicMessage throws an error", async () => {
    ;(handlePublicMessage as jest.Mock).mockRejectedValue(
      new Error("AI failure")
    )

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

    expect(response.status).toBe(500)
    expect(result).toEqual({ error: "AI failure" })
  })
})
