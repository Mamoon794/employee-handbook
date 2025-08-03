export const getEmployees = async (
  startDate?: string,
  endDate?: string,
  companyId?: string
): Promise<{ totalEmployees: number; newEmployees: number }> => {
  try {
    const params = new URLSearchParams()
    if (startDate) params.append("startDate", startDate)
    if (endDate) params.append("endDate", endDate)
    if (companyId) params.append("companyId", companyId)

    const response = await fetch(`/api/analytics/users?${params.toString()}`)
    if (!response.ok) {
      throw new Error("Failed to fetch new employees")
    }
    const data = await response.json()
    // console.log("Total employees fetched:", data)
    return {
      totalEmployees: data.totalEmployees,
      newEmployees: data.newEmployees,
    }
  } catch (error) {
    console.error("Error fetching total employees:", error)
    return { totalEmployees: 0, newEmployees: 0 }
  }
}

export const getProvinceDistribution = async (
  startDate?: string,
  endDate?: string,
  companyId?: string
): Promise<Array<{ province: string; count: number; percentage: number }>> => {
  try {
    const params = new URLSearchParams()
    if (startDate) params.append("startDate", startDate)
    if (endDate) params.append("endDate", endDate)
    if (companyId) params.append("companyId", companyId)

    const response = await fetch(
      `/api/analytics/provinces?${params.toString()}`
    )
    if (!response.ok) {
      throw new Error("Failed to fetch province distribution")
    }
    const data = await response.json()
    if (!data) {
      throw new Error("No data received from province distribution API")
    }
    return data.provinceDistribution
  } catch (error) {
    console.error("Error fetching province distribution:", error)
    return []
  }
}

export const getActiveUsers = async (
  startDate?: string,
  endDate?: string,
  companyId?: string
): Promise<number> => {
  try {
    const params = new URLSearchParams()
    if (startDate) params.append("startDate", startDate)
    if (endDate) params.append("endDate", endDate)
    if (companyId) params.append("companyId", companyId)

    const response = await fetch(
      `/api/analytics/active-users?${params.toString()}`
    )
    if (!response.ok) {
      throw new Error("Failed to fetch total active users")
    }
    const data = await response.json()
    return data.totalActiveUsers
  } catch (error) {
    console.error("Error fetching total active users:", error)
    return 0
  }
}

export const getQuestionsAsked = async (
  startDate?: string,
  endDate?: string,
  companyId?: string
): Promise<{ totalQuestionsAsked: number; newQuestionsAsked: number }> => {
  try {
    const params = new URLSearchParams()
    if (startDate) params.append("startDate", startDate)
    if (endDate) params.append("endDate", endDate)
    if (companyId) params.append("companyId", companyId)

    const response = await fetch(
      `/api/analytics/questions?${params.toString()}`
    )
    if (!response.ok) {
      throw new Error("Failed to fetch total questions asked")
    }
    const data = await response.json()
    return {
      totalQuestionsAsked: data.totalQuestionsAsked,
      newQuestionsAsked: data.newQuestionsAsked,
    }
  } catch (error) {
    console.error("Error fetching total questions asked:", error)
    return { totalQuestionsAsked: 0, newQuestionsAsked: 0 }
  }
}

export const getDocuments = async (
  startDate?: string,
  endDate?: string,
  companyId?: string
): Promise<{
  totalDocumentsUploaded: number
  newDocumentsUploaded: number
}> => {
  try {
    const params = new URLSearchParams()
    if (startDate) params.append("startDate", startDate)
    if (endDate) params.append("endDate", endDate)
    if (companyId) params.append("companyId", companyId)

    const response = await fetch(
      `/api/analytics/documents?${params.toString()}`
    )
    if (!response.ok) {
      throw new Error("Failed to fetch total documents uploaded")
    }
    const data = await response.json()
    return {
      totalDocumentsUploaded: data.totalDocumentsUploaded,
      newDocumentsUploaded: data.newDocumentsUploaded,
    }
  } catch (error) {
    console.error("Error fetching total documents uploaded:", error)
    return { totalDocumentsUploaded: 0, newDocumentsUploaded: 0 }
  }
}

export const getMonthlyData = async (
  startDate: string,
  endDate: string,
  companyId: string
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
    params.append("companyId", companyId)

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
    const employeeRegistrationData = monthlyChartData.map(
      (data: {
        month: string
        employees: number
        questions: number
        documents: number
      }) => ({
        time: data.month,
        employees: data.employees,
      })
    )
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
    const questionsAskedData = monthlyChartData.map(
      (data: {
        month: string
        employees: number
        questions: number
        documents: number
      }) => ({
        time: data.month,
        questions: data.questions,
      })
    )
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
