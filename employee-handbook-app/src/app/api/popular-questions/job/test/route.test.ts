jest.mock("@/integrations/aiService", () => ({
  getPopularQuestions: jest.fn(),
}))
jest.mock("@/models/dbOperations", () => ({
  savePopularQuestions: jest.fn(),
}))

import { GET } from "@/app/api/popular-questions/job/route"
import { getPopularQuestions } from "@/integrations/aiService"
import { savePopularQuestions } from "@/models/dbOperations"

describe("GET /api/popular-questions/job", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("returns 200 and saves questions when AI returns data", async () => {
    const mockQuestions = [
      { id: "q1", province: "ON", company: "Test", text: "Q1" },
      { id: "q2", province: "ON", company: "Test", text: "Q2" },
    ]
    ;(getPopularQuestions as jest.Mock).mockResolvedValue(mockQuestions)
    ;(savePopularQuestions as jest.Mock).mockResolvedValue(undefined)

    const response = await GET()
    const result = await response.json()

    expect(getPopularQuestions).toHaveBeenCalled()
    expect(savePopularQuestions).toHaveBeenCalledWith(mockQuestions)
    expect(response.status).toBe(200)
    expect(result).toEqual({ success: true, count: 2 })
  })

  it("returns 200 and does not save when AI returns empty array", async () => {
    ;(getPopularQuestions as jest.Mock).mockResolvedValue([])

    const response = await GET()
    const result = await response.json()

    expect(getPopularQuestions).toHaveBeenCalled()
    expect(savePopularQuestions).not.toHaveBeenCalled()
    expect(response.status).toBe(200)
    expect(result).toEqual({ success: true, count: 0 })
  })

  it("returns 500 if AI service throws an error", async () => {
    ;(getPopularQuestions as jest.Mock).mockRejectedValue(new Error("AI error"))

    const response = await GET()
    const result = await response.json()

    expect(getPopularQuestions).toHaveBeenCalled()
    expect(savePopularQuestions).not.toHaveBeenCalled()
    expect(response.status).toBe(500)
    expect(result).toEqual({ success: false, message: "AI error" })
  })

  it("returns 500 if savePopularQuestions throws an error", async () => {
    ;(getPopularQuestions as jest.Mock).mockResolvedValue([{ id: "q1", province: "ON", company: "Test", text: "Q1" }])
    ;(savePopularQuestions as jest.Mock).mockRejectedValue(new Error("Firestore error"))

    const response = await GET()
    const result = await response.json()

    expect(getPopularQuestions).toHaveBeenCalled()
    expect(savePopularQuestions).toHaveBeenCalled()
    expect(response.status).toBe(500)
    expect(result).toEqual({ success: false, message: "Firestore error" })
  })
})
