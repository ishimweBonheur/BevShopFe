import { useEffect, useState } from "react";
import { useExchangeRate } from "@/hooks/api/exchangeRate";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const ExchangeRateManager = () => {
  const { rate, loading, updateExchangeRate } = useExchangeRate();
  const [newRate, setNewRate] = useState<number | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (rate > 0) {
      setNewRate(rate);
    }
  }, [rate]);

  const handleUpdate = async () => {
    if (newRate !== null && newRate > 0) {
      await updateExchangeRate(newRate);
    } else {
      alert(t("valid_rate"));
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-lg rounded-lg dark:bg-gray-800">
      {/* Breadcrumbs */}
      <nav className="mb-4 text-gray-500 dark:text-gray-300 flex space-x-2 text-sm">
        <Link to="/Account" className="hover:text-gray-700 dark:hover:text-white">
          {t("home")}
        </Link>
        <span>/</span>
        <span className="text-black dark:text-white">{t("exchange_rate")}</span>
      </nav>

      {/* Heading */}
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6 text-center">
        {t("manage_exchange_rate")}
      </h1>

      {/* Loading State */}
      {loading ? (
        <p className="text-gray-600 dark:text-gray-400 text-center">{t("loading_rate")}</p>
      ) : (
        <div className="space-y-6">
          {/* Current Rate */}
          <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg shadow">
            <p className="text-lg text-gray-700 dark:text-gray-300">
              <strong>{t("current_rate")}</strong> {rate ? `${rate} CDF/USD` : t("unavailable")}
            </p>
          </div>

          {/* Input Field */}
          <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg shadow">
            <label className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">
              {t("new_exchange_rate")}
            </label>
            <input
              type="number"
              value={newRate ?? ""}
              onChange={(e) => setNewRate(e.target.value === "" ? null : Number(e.target.value))}
              placeholder={t("enter_new_rate")}
              className="w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            />
            
            {/* Update Button */}
            <div className="flex justify-center mt-4">
              <button
                onClick={handleUpdate}
                className="btn btn-primary"
              >
                {t("update_exchange_rate")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExchangeRateManager;
