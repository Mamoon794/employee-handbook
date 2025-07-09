export const getTotalEmployees = async (startDate?: string, endDate?: string): Promise<number> => {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await fetch(`/api/analytics/users?${params.toString()}`);
    if (!response.ok) {
      throw new Error('Failed to fetch total employees');
    }
    const data = await response.json();
    return data.totalEmployees;
  } catch (error) {
    console.error("Error fetching total employees:", error);
    return 0;
  }
};

export const getProvinceDistribution = async (startDate?: string, endDate?: string): Promise<Array<{ province: string; count: number; percentage: number }>> => {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await fetch(`/api/analytics/provinces?${params.toString()}`);
    if (!response.ok) {
      throw new Error('Failed to fetch province distribution');
    }
    const data = await response.json();
    return data.provinceDistribution;
  } catch (error) {
    console.error("Error fetching province distribution:", error);
    return [];
  }
};

export const getTotalQuestionsAsked = async (startDate?: string, endDate?: string): Promise<number> => {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const response = await fetch(`/api/analytics/questions?${params.toString()}`);
    if (!response.ok) {
      throw new Error('Failed to fetch total questions asked');
    }
    const data = await response.json();
    return data.totalQuestionsAsked;
  } catch (error) {
    console.error("Error fetching total questions asked:", error);
    return 0;
  }
};

export const getMonthlyData = async (startDate: string, endDate: string): Promise<Array<{ month: string; employees: number; questions: number; documents: number }>> => {
  try {
    const params = new URLSearchParams();
    params.append('startDate', startDate);
    params.append('endDate', endDate);
    
    const response = await fetch(`/api/analytics/monthly?${params.toString()}`);
    if (!response.ok) {
      throw new Error('Failed to fetch monthly data');
    }
    const data = await response.json();
    return data.monthlyData;
  } catch (error) {
    console.error("Error fetching monthly data:", error);
    return [];
  }
};
