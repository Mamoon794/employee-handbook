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
