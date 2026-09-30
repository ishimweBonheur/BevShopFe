import React from "react";
import { useTranslation } from "react-i18next";

const LanguageSwitcher: React.FC = () => {
  const { t, i18n } = useTranslation();

  const handleLanguageChange = (language: string) => {
    i18n.changeLanguage(language);
  };

  return (
    <div className="flex items-start flex-col  my-2 mx-5">
      <span className="text-sm font-medium dark:hover:text-white">{t("language.label")}</span>

      <div className="flex items-start justify-start mt-2   bg-gray-200 rounded-full p-1 shadow-inner">
        <button
          onClick={() => handleLanguageChange("en")}
          className={`px-4 py-2 text-sm font-semibold rounded-full transition duration-300 ${
            i18n.language === "en"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-blue-500 hover:text-white"
          }`}
        >
          {t("language.english")}
        </button>

        <button
          onClick={() => handleLanguageChange("fr")}
          className={`px-4 py-2 text-sm font-semibold rounded-full transition duration-300 ${
            i18n.language === "fr"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-blue-500 hover:text-white"
          }`}
        >
          {t("language.french")}
        </button>
      </div>
    </div>
  );
};

export default LanguageSwitcher;
