import React, { useEffect, useState } from "react";
import { formatCurrency } from "@/utils/formatCurrency";
import { api } from "@/hooks/api";

interface CurrencyDisplayProps {
  amount: number;
}

const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({ amount }) => {
  const [exchangeRate, setExchangeRate] = useState<number>(1);
  const [formattedAmount, setFormattedAmount] = useState<string>("");

  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const response = await api.get<{ rate: number | null }>("/exchange-rate");
        if (response.data.rate !== null) {
          setExchangeRate(response.data.rate);
        }
      } catch (error) {
        console.error("Error fetching exchange rate:", error);
      }
    };

    fetchExchangeRate();
  }, []);

  useEffect(() => {
    // Convert and format the amount using the utility
    setFormattedAmount(formatCurrency(amount, exchangeRate));
  }, [amount, exchangeRate]);

  return <p>{formattedAmount}</p>;
};

export default CurrencyDisplay;
