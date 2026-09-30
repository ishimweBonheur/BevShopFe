import { api } from ".";

export const fetchInventoryReport = async () => {
  try {
    const response = await api.get("/reports/inventory");
    return response.data;
  } catch (error) {
    console.error("Error fetching inventory report:", error);
    throw error;
  }
};


export const fetchSalesReport = async ({ filterType, startDate, endDate }: { filterType: string; startDate?: string; endDate?: string }) => {
  try {
    const response = await api.get(`/reports/sales`, {
      params: { filterType, startDate, endDate }, // Send correct query params
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching sales report:", error);
    throw error;
  }
};

export const fetchBestSellingReport = async ({ filterType, startDate, endDate }: { filterType: string; startDate?: string; endDate?: string }) => {
  try {
    const response = await api.get("/reports/best-selling", {
      params: { filterType, startDate, endDate },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching best-selling products report:", error);
    throw error;
  }
};

