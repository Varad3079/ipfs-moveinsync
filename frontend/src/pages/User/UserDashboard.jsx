// FILE: ./src/pages/User/UserDashboard.jsx
import React, { useState } from 'react';
import { bookingApi } from '../../api/bookingApi';
import toast from 'react-hot-toast';

// Import our new components
import BookingForm from '../../components/specific/BookingForm';
import RoomList from '../../components/specific/RoomList';
import MyBookings from '../../components/specific/MyBookings';

const UserDashboard = () => {
  // State to hold the search results
  const [recommendedRooms, setRecommendedRooms] = useState(null); // null = "haven't searched yet"
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams, setSearchParams] = useState(null); // Store the search times for booking

  /**
   * Called by BookingForm when a search is submitted
   */
  const handleSearch = async (params) => {
    setIsLoading(true);
    setSearchParams(params); // Save params for the "Book" button
    try {
      const rooms = await bookingApi.getRecommendedRooms(params);
      setRecommendedRooms(rooms);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Could not find rooms.");
      setRecommendedRooms([]); // Set to empty array on error
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Called by RoomList after a successful booking
   */
  const handleBookingSuccess = () => {
    // Clear the search results to prompt a new search
    setRecommendedRooms(null);
    setSearchParams(null);
    // Here, we would also trigger a refresh of 'MyBookings'
    // For now, the user must refresh the page to see new bookings
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* --- Booking Form --- */}
      <BookingForm onSearch={handleSearch} isLoading={isLoading} />

      {/* --- Results --- */}
      {/* Only show the RoomList (or no results) *after* a search */}
      {recommendedRooms && (
        <RoomList
          rooms={recommendedRooms}
          searchParams={searchParams}
          onBookingSuccess={handleBookingSuccess}
        />
      )}
      
      {/* --- My Bookings --- */}
      <MyBookings />
    </div>
  );
};

export default UserDashboard;