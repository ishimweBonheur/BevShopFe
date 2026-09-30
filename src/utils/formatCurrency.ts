import { useEffect, useState } from "react";

export const formatCurrency = (amount: number, exchangeRate: number): any => {
  const selectedCurrency = localStorage.getItem("selectedCurrency") || "USD";

  // Convert the amount and round it to 1 decimal place
  const convertedAmount = selectedCurrency === "CDF" 
    ? (amount * exchangeRate).toFixed(1) 
    : amount.toFixed(1);

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: selectedCurrency,
  }).format(parseFloat(convertedAmount)); // Ensure it's a number
};

export const convertCurrency = (
  amount: number, 
  fromCurrency: string, 
  toCurrency: string, 
  exchangeRate: number
) => {
  let convertedAmount: number = amount;

  if (fromCurrency === "USD" && toCurrency === "CDF") {
    convertedAmount = amount * exchangeRate;
  } else if (fromCurrency === "CDF" && toCurrency === "USD") {
    convertedAmount = amount / exchangeRate;
  }

  return parseFloat(convertedAmount.toFixed(1)); // Round off to 1 decimal place
};
