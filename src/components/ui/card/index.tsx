import React from "react";

interface CardProps {
  title: string;
  value: string | number;
  color?: string; // Allows customization of text color
  icon?: React.ReactNode; // Optional icon to enhance visual appearance
}

const Card: React.FC<CardProps> = ({ title, value, color, icon }) => {
  return (
    <div className="p-5 border flex items-center gap-10 rounded-lg shadow-sm bg-white dark:bg-[#0e1726] dark:border-0">
      <div className={`rounded-full p-2 ${color}`}>
        {icon && <div className="text-2xl">{icon}</div>}
      </div>
      <div>
      <h2 className="text-lg font-bold text-gray-700 dark:text-gray-300">{value}</h2>
      <p className={`text-sm text-gray-500 mt-2`}>{title}</p>
      </div>
    </div>
  );
};

export default Card;
