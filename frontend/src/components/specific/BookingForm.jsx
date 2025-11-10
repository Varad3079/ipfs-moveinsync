// FILE: ./src/components/specific/BookingForm.jsx
import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import { addHours, set, getHours, getMinutes } from 'date-fns';
import { Calendar, Clock, Users, Search, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * A form for finding and recommending rooms.
 * @param {object} props
 * @param {function} props.onSearch - Callback with search params
 * @param {boolean} props.isLoading - Whether a search is in progress
 */
const BookingForm = ({ onSearch, isLoading }) => {
  // --- Form State ---
  // Set default start time to the next hour (e.g., 3:15 PM -> 4:00 PM)
  const defaultStartTime = set(addHours(new Date(), 1), { minutes: 0, seconds: 0, milliseconds: 0 });
  const [startTime, setStartTime] = useState(defaultStartTime);
  // Default end time is 1 hour after start time
  const [endTime, setEndTime] = useState(addHours(defaultStartTime, 1));
  const [participants, setParticipants] = useState(2);

  const handleStartTimeChange = (date) => {
    setStartTime(date);
    // Automatically update end time to be 1 hour after
    setEndTime(addHours(date, 1));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!startTime || !endTime || !participants) {
      toast.error('Please fill out all fields.');
      return;
    }
    if (endTime <= startTime) {
      toast.error('End time must be after start time.');
      return;
    }
    
    // Pass ISO strings to the parent
    onSearch({
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      participants: Number(participants),
    });
  };
  
  // Custom input component for DatePicker
  const CustomInput = React.forwardRef(({ value, onClick, icon, label }, ref) => (
    <div>
      <label className="block text-sm font-medium text-brand-gray mb-1">{label}</label>
      <button 
        type="button" 
        className="w-full flex items-center gap-2 text-left p-2.5 border border-brand-secondary-dark rounded-lg focus:ring-2 focus:ring-brand-primary focus:outline-none" 
        onClick={onClick} 
        ref={ref}
      >
        {icon} {value}
      </button>
    </div>
  ));

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-brand-light rounded-lg shadow-xl animate-fade-in">
      <h2 className="text-2xl font-semibold text-brand-dark mb-4">Find a Meeting Room</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* --- Start Time --- */}
        <div className="md:col-span-2">
          <DatePicker
            selected={startTime}
            onChange={handleStartTimeChange}
            showTimeSelect
            dateFormat="MMMM d, yyyy h:mm aa"
            minDate={new Date()}
            timeIntervals={15}
            customInput={<CustomInput label="Start Time" icon={<Calendar className="w-5 h-5 text-brand-primary" />} />}
          />
        </div>

        {/* --- End Time --- */}
        <div className="md:col-span-2">
          <DatePicker
            selected={endTime}
            onChange={(date) => setEndTime(date)}
            showTimeSelect
            dateFormat="MMMM d, yyyy h:mm aa"
            minDate={startTime} // Can't be before start time
            minTime={startTime} // Set minTime as well
            timeIntervals={15}
            customInput={<CustomInput label="End Time" icon={<Clock className="w-5 h-5 text-brand-primary" />} />}
          />
        </div>

        {/* --- Participants --- */}
        <div className="md:col-span-3">
          <label className="block text-sm font-medium text-brand-gray mb-1" htmlFor="participants">
            Participants
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <Users className="w-5 h-5 text-brand-gray" />
            </span>
            <input
              type="number"
              id="participants"
              value={participants}
              onChange={(e) => setParticipants(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-brand-secondary-dark rounded-lg focus:ring-2 focus:ring-brand-primary focus:outline-none"
              min="1"
              required
            />
          </div>
        </div>
        
        {/* --- Submit --- */}
        <div className="md:col-span-1 flex items-end">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-[50px] flex justify-center items-center gap-2 bg-brand-primary text-white font-semibold py-2.5 px-4 rounded-lg shadow-md hover:bg-brand-primary-dark focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 transition-all duration-200 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            {isLoading ? '...' : 'Search'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default BookingForm;