jest.mock("@/models/dbOperations", () => ({
  getPopularQuestions: jest.fn(),
}))

import { POST } from "@/app/api/popular-questions/route"
import { getPopularQuestions } from "@/models/dbOperations"
import { NextRequest } from "next/server"
import type { PopularQuestion } from "@/models/schema"

describe("POST /api/popular-questions", () => {
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
  })

  describe("Successful Responses (200)", () => {
    it("returns 200 with questions for company and province", async () => {
      const mockQuestions: PopularQuestion[] = [
        {
          id: "q1",
          province: "ON",
          company: "Test Company",
          text: "What is minimum wage in Ontario?",
          createdAt: {} as any,
        },
        {
          id: "q2",
          province: "ON",
          company: "Test Company",
          text: "How many vacation days am I entitled to?",
          createdAt: {} as any,
        },
      ]
      ;(getPopularQuestions as jest.Mock).mockResolvedValue(mockQuestions)

      const request = new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({
          company: "Test Company",
          province: "ON",
        }),
      })

      const response = await POST(request as NextRequest)
      const result = await response.json()

      expect(getPopularQuestions).toHaveBeenCalledWith("Test Company", "ON")
      expect(response.status).toBe(200)
      expect(result).toEqual([
        "What is minimum wage in Ontario?",
        "How many vacation days am I entitled to?",
      ])
    })

    it("returns 200 with questions for public user (empty company)", async () => {
      const mockQuestions: PopularQuestion[] = [
        {
          id: "q1",
          province: "BC",
          company: "",
          text: "What are my rights as a worker?",
          createdAt: {} as any,
        },
      ]
      ;(getPopularQuestions as jest.Mock).mockResolvedValue(mockQuestions)

      const request = new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({
          company: "",
          province: "BC",
        }),
      })

      const response = await POST(request as NextRequest)
      const result = await response.json()

      expect(getPopularQuestions).toHaveBeenCalledWith("", "BC")
      expect(response.status).toBe(200)
      expect(result).toEqual(["What are my rights as a worker?"])
    })

    it("returns 200 with questions for general province (empty province)", async () => {
      const mockQuestions: PopularQuestion[] = [
        {
          id: "q1",
          province: "",
          company: "Large Corp",
          text: "What is the company policy on remote work?",
          createdAt: {} as any,
        },
        {
          id: "q2",
          province: "",
          company: "Large Corp",
          text: "How do I request time off?",
          createdAt: {} as any,
        },
      ]
      ;(getPopularQuestions as jest.Mock).mockResolvedValue(mockQuestions)

      const request = new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({
          company: "Large Corp",
          province: "",
        }),
      })

      const response = await POST(request as NextRequest)
      const result = await response.json()

      expect(getPopularQuestions).toHaveBeenCalledWith("Large Corp", "")
      expect(response.status).toBe(200)
      expect(result).toEqual([
        "What is the company policy on remote work?",
        "How do I request time off?",
      ])
    })

    it("returns 200 with empty array when no questions found", async () => {
      ;(getPopularQuestions as jest.Mock).mockResolvedValue([])

      const request = new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({
          company: "New Company",
          province: "AB",
        }),
      })

      const response = await POST(request as NextRequest)
      const result = await response.json()

      expect(getPopularQuestions).toHaveBeenCalledWith("New Company", "AB")
      expect(response.status).toBe(200)
      expect(result).toEqual([])
    })
  })

  describe("Error Handling (500 errors)", () => {
    it("returns 500 if getPopularQuestions throws an error", async () => {
      ;(getPopularQuestions as jest.Mock).mockRejectedValue(
        new Error("Database connection failed")
      )

      const request = new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({
          company: "Test Company",
          province: "ON",
        }),
      })

      const response = await POST(request as NextRequest)
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result).toEqual({ error: "Database connection failed" })
    })

    it("returns 500 with generic error message when error has no message", async () => {
      ;(getPopularQuestions as jest.Mock).mockRejectedValue(new Error())

      const request = new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({
          company: "Another Company",
          province: "MB",
        }),
      })

      const response = await POST(request as NextRequest)
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result).toEqual({ error: "Failed to retrieve popular questions" })
    })
  })
})
