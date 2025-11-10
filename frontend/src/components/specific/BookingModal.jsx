// FILE: ./src/components/specific/BookingModal.jsx
import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import { addHours, set } from 'date-fns';
import { bookingApi } from '../../api/bookingApi';
import toast from 'react-hot-toast';
import { Loader2, Calendar, Clock, Users, Check } from 'lucide-react';
import Modal from '../common/Modal';

const BookingModal = ({ room, isOpen, onClose, onBookingSuccess }) => {
  const defaultStartTime = set(addHours(new Date(), 1), { minutes: 0, seconds: 0 });
  const [startTime, setStartTime] = useState(defaultStartTime);
  const [endTime, setEndTime] = useState(addHours(defaultStartTime, 1));
  const [participants, setParticipants] = useState(2);
  const [isLoading, setIsLoading] = useState(false);

  const handleStartTimeChange = (date) => {
    setStartTime(date);
    setEndTime(addHours(date, 1)); 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (endTime <= startTime) {
      toast.error('End time must be after start time.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await bookingApi.bookRoom({
        room_id: room.id,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        participants: Number(participants),
      });
      
      toast.success(`Booked ${room.name} successfully!`);
      onBookingSuccess(); 
      onClose(); 
      
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to book room. It may have been taken.');
    } finally {
      setIsLoading(false);
    }
  };

  const CustomInput = React.forwardRef(({ value, onClick, icon, label }, ref) => (
    <div>
      <label className="block text-sm font-medium text-brand-gray mb-1">{label}</label>
      <button 
        type="button" 
        className="w-full flex items-center gap-2 text-left p-2.5 border border-brand-secondary-dark rounded-lg" 
        onClick={onClick} ref={ref}
      >
        {icon} {value}
      </button>
    </div>
  ));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Book Room: ${room?.name}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Start Time */}
        <div>
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

        {/* End Time */}
        <div>
          <DatePicker
            selected={endTime}
            onChange={(date) => setEndTime(date)}
            showTimeSelect
            dateFormat="MMMM d, yyyy h:mm aa" 
            minDate={startTime}
            minTime={startTime}
            timeIntervals={15}
            customInput={<CustomInput label="End Time" icon={<Clock className="w-5 h-5 text-brand-primary" />} />}
          />
        </div>

        {/* Participants */}
        <div>
          <label className="block text-sm font-medium text-brand-gray mb-1" htmlFor="participants">
            Participants (Max: {room?.capacity})
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
              className="w-full pl-10 pr-4 py-2.5 border border-brand-secondary-dark rounded-lg"
              min="1"
              max={room?.capacity}
              required
            />
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 font-semibold text-brand-gray bg-brand-secondary-light rounded-lg hover:bg-brand-secondary">
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="w-32 flex justify-center items-center gap-2 bg-brand-success text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-green-600 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
            {isLoading ? 'Booking...' : 'Book Now'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default BookingModal;