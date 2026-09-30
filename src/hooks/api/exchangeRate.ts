import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { api } from "@/hooks/api";
import toast from "react-hot-toast";

export const useExchangeRate = () => {
  // `0` is the UI's existing sentinel for a rate that has not been configured.
  // Keeping this a number also makes the hook safe for all price calculations.
  const [rate, setRate] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch the current exchange rate
  const fetchExchangeRate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<{ rate: number | null }>("/exchange-rate");
      setRate(response.data.rate ?? 0);
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message || "Failed to fetch the exchange rate."
        : "Failed to fetch the exchange rate.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [rate]);

  // Update the exchange rate (admin only)
  const updateExchangeRate = async (newRate: number) => {
    setLoading(true);
    setError(null);
    if (!Number.isFinite(newRate) || newRate <= 0) {
      const message = "Enter a valid exchange rate.";
      setError(message);
      toast.error(message);
      return false;
    }

    try {
      await api.put("/exchange-rate", { rate: newRate });
      setRate(newRate);
      toast.success("Exchange rate updated successfully.");
      return true;
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message || "Failed to update the exchange rate."
        : "Failed to update the exchange rate.";
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExchangeRate(); // Fetch exchange rate on component mount
  }, [fetchExchangeRate]);

  return { rate, loading, error, fetchExchangeRate, updateExchangeRate };
};
