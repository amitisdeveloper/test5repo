import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

function TimePicker({ value, onChange, placeholder = "Select Time", disabled = false }: TimePickerProps) {
  const [timeValue, setTimeValue] = useState('');

  // Convert 12-hour format to 24-hour for HTML time input
  const convertTo24Hour = (time12: string) => {
    if (!time12) return '';
    const match = time12.match(/^(\d{1,2}):(\d{2}) (AM|PM)$/);
    if (!match) return '';

    let [_, hourStr, minute, ampm] = match;
    let hour = parseInt(hourStr);

    if (ampm === 'AM' && hour === 12) hour = 0;
    if (ampm === 'PM' && hour !== 12) hour += 12;

    return `${hour.toString().padStart(2, '0')}:${minute}`;
  };

  // Convert 24-hour format to 12-hour for display
  const convertTo12Hour = (time24: string) => {
    if (!time24) return '';
    const [hour24, minute] = time24.split(':');
    const hour = parseInt(hour24);

    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;

    return `${hour12}:${minute} ${ampm}`;
  };

  // Initialize from 12-hour format
  useEffect(() => {
    if (value) {
      const time24 = convertTo24Hour(value);
      setTimeValue(time24);
    } else {
      setTimeValue('');
    }
  }, [value]);

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime24 = e.target.value;
    setTimeValue(newTime24);

    if (newTime24) {
      const time12 = convertTo12Hour(newTime24);
      onChange(time12);
    } else {
      onChange('');
    }
  };

  const displayValue = value || placeholder;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 px-3 py-3 bg-neutral-800 border border-yellow-600/30 rounded-lg min-w-[120px]">
        <Clock className="w-4 h-4 text-yellow-400" />
        <span className={`text-sm ${value ? 'text-white' : 'text-gray-400'}`}>
          {displayValue}
        </span>
      </div>

      <input
        type="time"
        value={timeValue}
        onChange={handleTimeChange}
        disabled={disabled}
        className="px-3 py-2 bg-neutral-800 border border-yellow-600/30 rounded text-white text-sm focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
      />
    </div>
  );
}

export default TimePicker;