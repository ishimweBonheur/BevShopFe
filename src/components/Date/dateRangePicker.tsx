import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';

interface FlexibleDatePickerProps {
  onDateChange: (startDate: Date, endDate: Date) => void;
}

const FlexibleDatePicker: React.FC<FlexibleDatePickerProps> = ({
  onDateChange,
}) => {
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const handleSelect = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates;
    setStartDate(start);
    setEndDate(end);
    if (start && end) {
      onDateChange(start, end);
    }
  };

  const togglePicker = () => {
    setShowPicker(!showPicker);
  };

  const predefinedRanges = [
    { label: 'Today', range: { startDate: new Date(), endDate: new Date() } },
    {
      label: 'Yesterday',
      range: {
        startDate: new Date(new Date().setDate(new Date().getDate() - 1)),
        endDate: new Date(new Date().setDate(new Date().getDate() - 1)),
      },
    },
    {
      label: 'This Week',
      range: {
        startDate: new Date(new Date().setDate(new Date().getDate() - new Date().getDay())),
        endDate: new Date(),
      },
    },
    {
      label: 'Last Week',
      range: {
        startDate: new Date(new Date().setDate(new Date().getDate() - new Date().getDay() - 7)),
        endDate: new Date(new Date().setDate(new Date().getDate() - new Date().getDay() - 1)),
      },
    },
    {
      label: 'This Month',
      range: {
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        endDate: new Date(),
      },
    },
    {
      label: 'Last Month',
      range: {
        startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
        endDate: new Date(new Date().getFullYear(), new Date().getMonth(), 0),
      },
    },
    {
      label: 'Next Year',
      range: {
        startDate: new Date(new Date().getFullYear() + 1, 0, 1),
        endDate: new Date(new Date().getFullYear() + 1, 11, 31),
      },
    },
  ];

  const applyPredefinedRange = (rangeObj: any) => {
    setStartDate(rangeObj.range.startDate);
    setEndDate(rangeObj.range.endDate);
    setShowPicker(false);
    onDateChange(rangeObj.range.startDate, rangeObj.range.endDate);
  };

  return (
    <div className="relative dark:text-dark-light">
      <button
        onClick={togglePicker}
        className="border rounded px-4 py-2 bg-white dark:text-dark-light dark:border-gray-500 text-black dark:bg-[#0e1726]"
      >
        {startDate && endDate
          ? `${format(startDate, 'MMM dd, yyyy')} - ${format(endDate, 'MMM dd, yyyy')}`
          : 'Select Date Range'}
      </button>

      {showPicker && (
        <div className="absolute bg-white dark:bg-[#0e1726] p-4 shadow-lg rounded z-10 mt-2 flex flex-col md:flex-row">
          {/* Predefined Options */}
          <div className="flex flex-col border-r pr-4 space-y-1">
            {predefinedRanges.map((item) => (
              <button
                key={item.label}
                onClick={() => applyPredefinedRange(item)}
                className="text-left py-1 hover:bg-gray-100 dark:hover:bg-gray-500 whitespace-nowrap"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Calendar Picker */}
          <div className="ml-4 dark:bg-[#0e1726] dark:text-white">
            <DatePicker
              className="bg-white dark:bg-gray-700 dark:text-white"
              selected={startDate}
              onChange={handleSelect}
              startDate={startDate}
              endDate={endDate}
              selectsRange
              inline
              calendarClassName="dark:dark-datepicker"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default FlexibleDatePicker;
