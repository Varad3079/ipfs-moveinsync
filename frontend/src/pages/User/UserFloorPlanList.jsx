// FILE: ./src/pages/User/UserFloorPlanList.jsx
import React, { useState, useEffect } from 'react';
import { bookingApi } from '../../api/bookingApi';
import { Link, useParams } from 'react-router-dom'; // Import useParams
import { Loader2, AlertTriangle, Map, ChevronRight, Home, Clock } from 'lucide-react';
import MyBookings from '../../components/specific/MyBookings'; 
// --- NEW: Import BookingForm and RoomList to reuse here ---
import BookingForm from '../../components/specific/BookingForm'; 
import RoomList from '../../components/specific/RoomList'; 


const UserFloorPlanList = () => {
  // Use useParams to read the booking filter from the URL
  const { filter } = useParams(); 
  
  // State for Floor Plan List
  const [floorPlans, setFloorPlans] = useState([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [errorPlans, setErrorPlans] = useState(null);

  // State for Recommended Rooms (if we add the search feature back)
  const [recommendedRooms, setRecommendedRooms] = useState(null); 
  const [searchParams, setSearchParams] = useState(null); 
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);

  // Fetch all floor plans (unchanged logic)
  useEffect(() => {
    const loadPlans = async () => {
      setIsLoadingPlans(true);
      setErrorPlans(null);
      try {
        const data = await bookingApi.getFloorPlans();
        setFloorPlans(data);
      } catch (err) {
        setErrorPlans("Could not load floor plans.");
      } finally {
        setIsLoadingPlans(false);
      }
    };
    loadPlans();
  }, []);
  
  // --- NEW: Simplified Booking Feature handlers (for future integration) ---
  const handleSearch = (params) => {
    // Placeholder logic - we haven't enabled searching on this page yet
    console.log("Search attempted with params:", params);
  }
  const handleBookingSuccess = () => {
    // Placeholder
  }
  // --- END NEW ---

  // --- CONTENT SWITCHING LOGIC (P3) ---
  
  // 1. Upcoming/Completed Bookings View
  if (filter === 'upcoming' || filter === 'completed') {
    return (
      <div className="animate-fade-in max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-brand-dark mb-4 border-b pb-2">
          {filter === 'upcoming' ? 'Upcoming Bookings' : 'Completed Bookings'}
        </h1>
        {/* NOTE: MyBookings only fetches UPCOMING bookings currently.
           A full implementation would modify MyBookings or the API call it uses
           to filter for completed (past) bookings when filter === 'completed'. 
           For now, we just display the same component.
        */}
        <div className="p-6 bg-brand-light rounded-lg shadow-xl">
            <MyBookings />
        </div>
      </div>
    );
  }

  // 2. Default View (Floor Plan List)
  let content;
  if (isLoadingPlans) {
    content = (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
      </div>
    );
  } else if (errorPlans) {
    content = <div className="p-8 bg-red-50 text-red-700 rounded-lg">{errorPlans}</div>;
  } else if (floorPlans.length === 0) {
    content = (
      <div className="text-center p-12 bg-brand-light rounded-lg shadow-inner">
        <Home className="w-16 h-16 text-brand-gray mx-auto" />
        <h2 className="mt-4 text-2xl font-semibold text-brand-dark">No Floor Plans Found</h2>
        <p className="mt-2 text-brand-gray">Your company's admin has not set up any floor plans yet.</p>
      </div>
    );
  } else {
    content = (
      <div className="bg-brand-light rounded-lg shadow-xl overflow-hidden">
        <ul className="divide-y divide-brand-secondary-dark">
          {floorPlans.map((plan) => (
            <li key={plan.id}>
              <Link 
                to={`/book/${plan.id}`}
                className="flex items-center justify-between p-4 hover:bg-brand-secondary-light transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brand-secondary-light rounded-lg">
                    <Map className="w-5 h-5 text-brand-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-brand-dark">{plan.name}</p>
                    <p className="text-sm text-brand-gray">
                      {plan.width} x {plan.height} | {plan.rooms.length} Rooms
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-brand-gray" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-4xl mx-auto space-y-8">
      {/* Section 1: Book a Room */}
      <div className="p-6 bg-brand-light rounded-lg shadow-xl">
        <h1 className="text-3xl font-bold text-brand-dark mb-4 border-b pb-2">Select a Floor to Book</h1>
        {content}
      </div>
      
      {/* Section 2: My Bookings - This section is now unnecessary as the links are in the sidebar */}
    </div>
  );
};

export default UserFloorPlanList;