import { useState, useCallback } from "react";
import { api, queryString } from ".";
import toast from "react-hot-toast";

export const useSales = () => {
  const [sales, setSales] = useState<any>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSales = useCallback(async (query?: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/sales${queryString(query)}`);
      setSales(response.data);
    } catch (err: any) {
      setError(
        err.response?.data?.message || "An error occurred while fetching sales."
      );
      toast.error("Failed to fetch sales.");
    } finally {
      setLoading(false);
    }
  }, []);

  const confirmPayment = async (
    orderId: string,
    paymentMethod: string,
    amountPaid: string,
    notes: string
  ) => {
    try {
      await api.post("/sales/confirm-payment", {
        orderId,
        paymentMethod,
        amountPaid,
        notes,
      });
      toast.success("Payment confirmed successfully");
    } catch (err) {
      toast.error("Failed to confirm payment");
    }
  };
  return {
    sales,
    loading,
    error,
    confirmPayment,
    fetchSales,
  };
};
