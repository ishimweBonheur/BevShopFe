export default function formatDateToLongForm(dateString: string) {
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric', 
  };
  
  const date = new Date(dateString);

  // Subtract 1 hour
  date.setHours(date.getHours() - 1);

  // Format the date part
  const formattedDate = date.toLocaleDateString('en-US', options);

  // Format the time part (24-hour format)
  const formattedTime = date.toLocaleTimeString('en-US', {
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: false, // 24-hour format
  });
  
  // Combine date and time with "at"
  return `${formattedDate} at ${formattedTime}`;
}
