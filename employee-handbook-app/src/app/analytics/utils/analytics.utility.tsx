export const getTotalEmployees = async (): Promise<number> => {
  try {
    const response = await fetch('/api/analytics/users');
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

export const getProvinceDistribution = async (): Promise<Array<{ province: string; count: number; percentage: number }>> => {
  try {
    const response = await fetch('/api/analytics/provinces');
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
