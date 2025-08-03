jest.mock("@/integrations/aiService", () => ({
  uploadFileToVectorDB: jest.fn(),
  deleteCompanyFromVectorDB: jest.fn(),
}))

import { POST, PATCH } from "@/app/api/vectordb-documents/route"
import {
  uploadFileToVectorDB,
  deleteCompanyFromVectorDB,
} from "@/integrations/aiService"

describe("API route /api/vectordb-documents/source", () => {
  describe("POST", () => {
    it("returns 400 if missing fileurl or namespace", async () => {
      const request = new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ fileurl: "" }),
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result).toEqual({ error: "Missing fileurl or namespace" })
    })

    it("calls uploadFileToVectorDB and returns 200", async () => {
      const fileurl = "https://file.com/doc.pdf"
      const company = "testCompany"
      const company_docs_len = 1
      const mockResponse = {
        url: fileurl,
        company: company,
        company_docs_len: company_docs_len,
        status: "success",
      }
      ;(uploadFileToVectorDB as jest.Mock).mockResolvedValue(mockResponse)

      const request = new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({
          fileurl: fileurl,
          namespace: company,
        }),
      })

      const response = await POST(request)
      const result = await response.json()

      expect(uploadFileToVectorDB).toHaveBeenCalledWith(fileurl, company)
      expect(response.status).toBe(200)
      expect(result).toEqual(mockResponse)
    })

    it("returns 500 on error", async () => {
      ;(uploadFileToVectorDB as jest.Mock).mockRejectedValue(
        new Error("Upload error")
      )

      const request = new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({
          fileurl: "https://file.com/doc.pdf",
          namespace: "test-ns",
        }),
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result).toEqual({ error: "Failed to upload file to vector DB" })
    })
  })

  describe("PATCH", () => {
    it("returns 400 if missing company", async () => {
      const request = new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({}),
      })

      const response = await PATCH(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result).toEqual({ error: "Missing company name" })
    })

    it("calls deleteCompanyFromVectorDB and returns 200", async () => {
      const mockResponse = { deleted: true }
      ;(deleteCompanyFromVectorDB as jest.Mock).mockResolvedValue(mockResponse)

      const request = new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ company: "TestCo" }),
      })

      const response = await PATCH(request)
      const result = await response.json()

      expect(deleteCompanyFromVectorDB).toHaveBeenCalledWith("TestCo")
      expect(response.status).toBe(200)
      expect(result).toEqual(mockResponse)
    })

    it("returns 500 on error", async () => {
      ;(deleteCompanyFromVectorDB as jest.Mock).mockRejectedValue(
        new Error("Delete error")
      )

      const request = new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ company: "TestCo" }),
      })

      const response = await PATCH(request)
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result).toEqual({
        error: "Failed to delete company from vector DB",
      })
    })
  })
})
