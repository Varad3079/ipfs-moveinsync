// FILE: ./src/components/specific/MyBookings.jsx
import React, { useState, useEffect } from 'react';
import { bookingApi } from '../../api/bookingApi';
import { Loader2, CalendarX, CalendarCheck, Clock, MapPin } from 'lucide-react';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        // We're using the mock API function for now
        const data = await bookingApi.getMyBookings();
        setBookings(data);
      } catch (err) {
        console.error("Failed to fetch bookings", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBookings();
  }, []);

  const formatDate = (isoString) => new Date(isoString).toLocaleString();

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-semibold text-brand-dark mb-4">My Upcoming Bookings</h2>
      {isLoading && (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
        </div>
      )}

      {!isLoading && bookings.length === 0 && (
        <div className="flex flex-col items-center justify-center p-12 bg-brand-light rounded-lg shadow-lg border-2 border-dashed border-brand-secondary-dark">
          <CalendarX className="w-16 h-16 text-brand-gray" />
          <p className="mt-4 text-brand-gray">You have no upcoming bookings.</p>
        </div>
      )}

      {!isLoading && bookings.length > 0 && (
        <div className="bg-brand-light rounded-lg shadow-xl overflow-hidden">
          <ul className="divide-y divide-brand-secondary-dark">
            {bookings.map(booking => (
              <li key={booking.id} className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-brand-primary">{booking.room?.name || 'Mock Room'}</h3>
                  <div className="flex items-center gap-1.5 text-brand-dark mt-1">
                    <Clock className="w-4 h-4" /> 
                    <span>{formatDate(booking.start_time)}</span>
                    <span className="mx-1">&rarr;</span>
                    <span>{formatDate(booking.end_time)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="flex items-center gap-2 text-sm font-medium text-brand-success bg-green-100 px-3 py-1 rounded-full">
                    <CalendarCheck className="w-4 h-4" /> Confirmed
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MyBookings;