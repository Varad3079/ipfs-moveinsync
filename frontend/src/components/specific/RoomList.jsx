// FILE: ./src/components/specific/RoomList.jsx
import React, { useState } from 'react';
import { bookingApi } from '../../api/bookingApi';
import toast from 'react-hot-toast';
import { Loader2, Users, Star, Check, AlertTriangle, MapPin } from 'lucide-react';

/**
 * Displays a list of recommended rooms and handles booking.
 * @param {object} props
 * @param {Array} props.rooms - List of recommended rooms
 * @param {object} props.searchParams - { start_time, end_time, participants }
 * @param {function} props.onBookingSuccess - Callback to refresh data
 */
const RoomList = ({ rooms, searchParams, onBookingSuccess }) => {
  const [bookingRoomId, setBookingRoomId] = useState(null); // Tracks which room is being booked

  const handleBook = async (room) => {
    setBookingRoomId(room.id);
    
    try {
      await bookingApi.bookRoom({
        room_id: room.id,
        start_time: searchParams.start_time,
        end_time: searchParams.end_time,
        participants: searchParams.participants,
      });
      
      toast.success(`Booked ${room.name} successfully!`);
      onBookingSuccess(); // Tell the parent to clear the list
      
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to book room.');
    } finally {
      setBookingRoomId(null);
    }
  };

  if (rooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-brand-light rounded-lg shadow-lg border-2 border-dashed border-brand-secondary-dark mt-8">
        <AlertTriangle className="w-16 h-16 text-brand-warning" />
        <h2 className="mt-4 text-2xl font-semibold text-brand-dark">No Rooms Found</h2>
        <p className="mt-2 text-brand-gray">Try adjusting your search criteria.</p>
      </div>
    );
  }

  return (
    <div className="mt-8 animate-fade-in">
      <h3 className="text-xl font-semibold text-brand-dark mb-4">Recommended Rooms</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room) => (
          <div key={room.id} className="bg-brand-light rounded-lg shadow-xl border border-brand-secondary overflow-hidden flex flex-col">
            {/* --- Room Details --- */}
            <div className="p-5">
              <div className="flex justify-between items-center gap-2 flex-wrap">
                <h4 className="text-lg font-bold text-brand-dark">{room.name}</h4>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {room.recommendation_score > 1.0 && (
                    <span className="flex items-center gap-1 text-xs font-medium text-brand-accent-dark bg-cyan-100 px-2 py-0.5 rounded-full">
                      <Star className="w-3 h-3" /> Preferred
                    </span>
                  )}
                  {room.proximity_score > 0 && (
                    <span className="flex items-center gap-1 text-xs font-medium text-brand-primary bg-sky-100 px-2 py-0.5 rounded-full">
                      <MapPin className="w-3 h-3" /> Near last booking
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 mt-2 text-brand-gray">
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" /> {room.capacity} People
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" /> ({room.x_coord}, {room.y_coord})
                </span>
              </div>
              <ul className="mt-3 text-sm text-brand-gray space-y-1">
                {room.features?.map(feature => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-brand-success" /> {feature}
                  </li>
                ))}
              </ul>
            </div>
            
            {/* --- Booking Button --- */}
            <div className="mt-auto p-4 bg-brand-secondary-light border-t">
              <button
                onClick={() => handleBook(room)}
                disabled={bookingRoomId === room.id}
                className="w-full flex justify-center items-center gap-2 bg-brand-success text-white font-semibold py-2.5 px-4 rounded-lg shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50"
              >
                {bookingRoomId === room.id ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Check className="w-5 h-5" />
                )}
                {bookingRoomId === room.id ? 'Booking...' : 'Book Now'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoomList;