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

export const getMonthlyData = async (
  startDate: string,
  endDate: string
): Promise<
  Array<{
    month: string
    employees: number
    questions: number
    documents: number
  }>
> => {
  try {
    const params = new URLSearchParams()
    params.append("startDate", startDate)
    params.append("endDate", endDate)

    const response = await fetch(`/api/analytics/monthly?${params.toString()}`)
    if (!response.ok) {
      throw new Error("Failed to fetch monthly data")
    }
    const data = await response.json()
    return data.monthlyData
  } catch (error) {
    console.error("Error fetching monthly data:", error)
    return []
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

export async function getAIExplanationForEmployeeRegistration(
  monthlyChartData: Array<{
    month: string
    employees: number
    questions: number
    documents: number
  }>
): Promise<string> {
  try {
    const employeeRegistrationData = monthlyChartData.map((data: { month: string; employees: number; questions: number; documents: number }) => ({
      time: data.month,
      employees: data.employees,
    }))
    const response = await fetch(`/api/ai-summary/employee-registration`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        employeeRegistrationData: employeeRegistrationData,
      }),
    })
    const data = await response.json()
    return data.response
  } catch (error) {
    console.error(
      "Error fetching AI explanation for employee registration:",
      error
    )
    return "No explanation available."
  }
}

export async function getAIExplanationForQuestionsAsked(
  monthlyChartData: Array<{
    month: string
    employees: number
    questions: number
    documents: number
  }>
): Promise<string> {
  try {
    const questionsAskedData = monthlyChartData.map((data: { month: string; employees: number; questions: number; documents: number }) => ({
      time: data.month,
      questions: data.questions,
    }))
    const response = await fetch(`/api/ai-summary/questions-asked`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        questionsAskedData: questionsAskedData,
      }),
    })
    const data = await response.json()
    return data.response
  } catch (error) {
    console.error("Error fetching AI explanation for questions asked:", error)
    return "No explanation available."
  }
}

export async function getBulletPointSummary(summary: string): Promise<string> {
  try {
    const response = await fetch(`/api/ai-summary/bullet-points`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: summary,
      }),
    })
    const data = await response.json()
    return data.response
  } catch (error) {
    console.error("Error fetching bullet point summary:", error)
    return "No summary available."
  }
}
