export const getTotalEmployees = async (
  startDate?: string,
  endDate?: string
): Promise<number> => {
  try {
    const params = new URLSearchParams()
    if (startDate) params.append("startDate", startDate)
    if (endDate) params.append("endDate", endDate)

    const response = await fetch(`/api/analytics/users?${params.toString()}`)
    if (!response.ok) {
      throw new Error("Failed to fetch total employees")
    }
    const data = await response.json()
    return data.totalEmployees
  } catch (error) {
    console.error("Error fetching total employees:", error)
    return 0
  }
}

export const getProvinceDistribution = async (
  startDate?: string,
  endDate?: string
): Promise<Array<{ province: string; count: number; percentage: number }>> => {
  try {
    const params = new URLSearchParams()
    if (startDate) params.append("startDate", startDate)
    if (endDate) params.append("endDate", endDate)

    const response = await fetch(
      `/api/analytics/provinces?${params.toString()}`
    )
    if (!response.ok) {
      throw new Error("Failed to fetch province distribution")
    }
    const data = await response.json()
    return data.provinceDistribution
  } catch (error) {
    console.error("Error fetching province distribution:", error)
    return []
  }
}

export const getTotalQuestionsAsked = async (
  startDate?: string,
  endDate?: string
): Promise<number> => {
  try {
    const params = new URLSearchParams()
    if (startDate) params.append("startDate", startDate)
    if (endDate) params.append("endDate", endDate)
    const response = await fetch(
      `/api/analytics/questions?${params.toString()}`
    )
    if (!response.ok) {
      throw new Error("Failed to fetch total questions asked")
    }
    const data = await response.json()
    return data.totalQuestionsAsked
  } catch (error) {
    console.error("Error fetching total questions asked:", error)
    return 0
  }
}

export async function getAIExplanationForEmployeeDistribution(
  provinceData: Array<{ province: string; count: number; percentage: number }>
): Promise<string> {
  try {
    const response = await fetch(`/api/ai-summary/employee-distribution`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        provinceData: provinceData,
      }),
    })
    const data = await response.json()
    return data.response
  } catch (error) {
    console.error(
      "Error fetching AI explanation for employee distribution:",
      error
    )
    return "No explanation available."
  }
}
