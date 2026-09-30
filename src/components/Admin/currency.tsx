import React, { useEffect, useState } from "react";

const CurrencySwitcher: React.FC = () => {
  const [selectedCurrency, setSelectedCurrency] = useState<string>(
    localStorage.getItem("selectedCurrency") || "USD"
  );

  const handleCurrencyChange = (currency: string) => {
    setSelectedCurrency(currency);
    localStorage.setItem("selectedCurrency", currency); 
    window.location.reload(); 
  };

  useEffect(() => {
    
    setSelectedCurrency(localStorage.getItem("selectedCurrency") || "USD");
  }, []);

  return (
    <div className="flex items-start flex-col my-2 mx-5">
      <span className="text-sm font-medium dark:hover:text-white">Change Currency:</span>

      <div className="flex items-start justify-start mt-2 bg-gray-200 rounded-full p-1 shadow-inner">
        <button
          onClick={() => handleCurrencyChange("USD")}
          className={`px-4 py-2 text-sm font-semibold rounded-full transition duration-300 ${
            selectedCurrency === "USD"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-blue-500 hover:text-white"
          }`}
        >
          USD
        </button>

        <button
          onClick={() => handleCurrencyChange("CDF")}
          className={`px-4 py-2 text-sm font-semibold rounded-full transition duration-300 ${
            selectedCurrency === "CDF"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-blue-500 hover:text-white"
          }`}
        >
          CDF
        </button>
      </div>
    </div>
  );
};

export default CurrencySwitcher;
