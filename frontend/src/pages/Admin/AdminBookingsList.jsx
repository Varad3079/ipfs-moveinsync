// FILE: ./src/pages/Admin/AdminBookingsList.jsx
import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/adminApi';
import { Loader2, AlertTriangle, CalendarCheck, Clock, User, MapPin } from 'lucide-react';

const AdminBookingsList = () => {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBookings = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // This is the new tenant-aware endpoint
        const data = await adminApi.getAllBookings();
        setBookings(data);
      } catch (err) {
        setError(err.response?.data?.detail || "Failed to fetch bookings.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const formatDate = (isoString) => new Date(isoString).toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  let content;
  if (isLoading) {
    content = (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
        <p className="ml-4 text-brand-gray">Loading All Bookings...</p>
      </div>
    );
  } else if (error) {
    content = (
      <div className="flex flex-col items-center justify-center p-12 bg-red-50 rounded-lg border border-brand-error">
        <AlertTriangle className="w-12 h-12 text-brand-error" />
        <p className="mt-4 text-red-700">{error}</p>
      </div>
    );
  } else if (bookings.length === 0) {
    content = (
      <div className="flex flex-col items-center justify-center p-12 bg-brand-light rounded-lg shadow-inner">
        <CalendarCheck className="w-12 h-12 text-brand-gray" />
        <p className="mt-4 text-brand-gray">There are no upcoming bookings for your company.</p>
      </div>
    );
  } else {
    content = (
      <div className="bg-brand-light rounded-lg shadow-xl overflow-hidden">
        <ul className="divide-y divide-brand-secondary-dark">
          {bookings.map((booking) => (
            <li key={booking.id} className="p-5">
              <div className="flex flex-col sm:flex-row sm:justify-between">
                <h3 className="text-lg font-semibold text-brand-primary">
                  {booking.room.name}
                </h3>
                <span className="text-sm font-medium text-brand-dark">
                  {booking.participants} Participants
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-sm text-brand-gray mt-3 gap-2">
                <span className="flex items-center gap-1.5">
                  <User className="w-4 h-4" /> 
                  {booking.user.email}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> 
                  {formatDate(booking.start_time)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-brand-dark mb-6">All Upcoming Bookings</h1>
      {content}
    </div>
  );
};

export default AdminBookingsList;