// Mock the aiService module first
jest.mock("@/integrations/aiService", () => ({
  deleteDocumentFromVectorDB: jest.fn(),
}))

import { PATCH } from "@/app/api/vectordb-documents/source/route"
import { deleteDocumentFromVectorDB } from "@/integrations/aiService"

describe("PATCH /api/vectordb-documents/route", () => {
  it("returns 400 if missing company or url", async () => {
    const request = new Request("http://localhost", {
      method: "PATCH",
      body: JSON.stringify({ url: "" }), // missing company
    })

    const response = await PATCH(request)
    const result = await response.json()

    expect(response.status).toBe(400)
    expect(result).toEqual({ error: "Missing company or URL" })
  })

  it("calls deleteDocumentFromVectorDB and returns 200 on success", async () => {
    const mockResponse = { deleted: true }
    ;(deleteDocumentFromVectorDB as jest.Mock).mockResolvedValue(mockResponse)

    const request = new Request("http://localhost", {
      method: "PATCH",
      body: JSON.stringify({
        url: "https://file.com/doc.pdf",
        company: "TestCo",
      }),
    })

    const response = await PATCH(request)
    const result = await response.json()

    expect(deleteDocumentFromVectorDB).toHaveBeenCalledWith(
      "https://file.com/doc.pdf",
      "TestCo"
    )
    expect(response.status).toBe(200)
    expect(result).toEqual(mockResponse)
  })

  it("returns 500 on error", async () => {
    ;(deleteDocumentFromVectorDB as jest.Mock).mockRejectedValue(
      new Error("Delete error")
    )

    const request = new Request("http://localhost", {
      method: "PATCH",
      body: JSON.stringify({
        url: "https://file.com/doc.pdf",
        company: "TestCo",
      }),
    })

    const response = await PATCH(request)
    const result = await response.json()

    expect(response.status).toBe(500)
    expect(result).toEqual({
      error: "Failed to delete document from vector DB",
    })
  })
})
