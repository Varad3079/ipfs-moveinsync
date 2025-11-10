// FILE: ./src/pages/User/UserBookingPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { bookingApi } from '../../api/bookingApi';
import { useWebSocket } from '../../hooks/useWebSocket';
import { Loader2, AlertTriangle, Users, WifiOff, XCircle, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import BookingModal from '../../components/specific/BookingModal';

// --- NEW: Import react-grid-layout ---
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

const UserBookingPage = () => {
  const { floorPlanId } = useParams();
  
  // --- State ---
  const [plan, setPlan] = useState(null); 
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // --- Modal State ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);

  // --- NEW: Grid layout configuration ---
  const cols = 12;
  const rowHeight = 10;
  // We get the grid width and column width from the plan state
  const gridWidth = plan?.width || 1000;
  const colWidth = gridWidth / cols;

  // --- Utility ---
  const formatTime = (isoString) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };


  // --- Fetching Logic (Unchanged) ---
  const fetchFloorPlanStatus = useCallback(async () => {
    console.log("Fetching live floor plan status...");
    setIsLoading(true); 
    try {
      const data = await bookingApi.getFloorPlanStatus(floorPlanId);
      setPlan(data);
    } catch (err) {
      setError("Could not load floor plan details.");
      toast.error("Could not load floor plan.");
    } finally {
      setIsLoading(false);
    }
  }, [floorPlanId]);

  // Initial fetch (Unchanged)
  useEffect(() => {
    fetchFloorPlanStatus();
  }, [fetchFloorPlanStatus]);

  // --- WebSocket Connection (Unchanged) ---
  const handleWebSocketEvent = (event) => {
    if (event === 'BOOKING_CHANGED' || event === 'FLOOR_PLAN_CHANGED') {
      toast('Floor plan was updated, refreshing...', { icon: '🔄' });
      fetchFloorPlanStatus();
    }
  };
  const isConnected = useWebSocket(floorPlanId, handleWebSocketEvent, 'user');

  // --- NEW: Grid layout generation (Unchanged) ---
  const generateLayout = () => {
    if (!plan || colWidth <= 0) return [];
    
    return plan.rooms.map(room => {
      const w = Math.round(room.width / colWidth) || 1;
      const h = Math.round(room.height / rowHeight) || 1;
      const x = Math.round(room.x_coord / colWidth);
      const y = Math.round(room.y_coord / rowHeight);

      return {
        i: room.id,
        x: x, y: y,
        w: w < 1 ? 1 : w,
        h: h < 1 ? 1 : h,
        isDraggable: false, 
        isResizable: false,
      };
    });
  };

  // --- Event Handlers (Updated for P1 Fix) ---
  const handleRoomClick = (room) => {
    const isBooked = room.current_status === 'Booked';
    
    if (isBooked) {
      // This toast message is now better informed (P4)
      const endTime = room.current_booking_details?.end_time;
      toast.error(
        `${room.name} is booked until ${formatTime(endTime)}.`,
        { duration: 4000 }
      );
      return;
    }
    setSelectedRoom(room);
    setIsModalOpen(true);
  };

  const handleBookingSuccess = () => {
    fetchFloorPlanStatus();
  };

  // --- Render Logic (Updated) ---
  if (isLoading || !plan) {
    return <div className="flex items-center justify-center h-[60vh]"><Loader2 className="w-12 h-12 animate-spin text-brand-primary" /></div>;
  }
  if (error) {
    return <div className="p-8 bg-red-50 text-red-700 rounded-lg">{error}</div>;
  }

  const currentLayout = generateLayout();

  return (
    <>
      {/* Moved Header content to UserLayout for consistent sidebar structure */}
      <div className="flex justify-between items-center mb-4 pb-4 border-b">
          <div>
            <h1 className="text-3xl font-bold text-brand-dark">{plan.name}</h1>
            <p className="text-brand-gray">Click an available room to book it.</p>
          </div>
          <div>
            {isConnected ? (
              <span className="flex items-center gap-2 text-sm text-brand-success font-medium">
                <CheckCircle className="w-5 h-5" /> Live
              </span>
            ) : (
              <span className="flex items-center gap-2 text-sm text-brand-warning font-medium">
                <WifiOff className="w-5 h-5" /> Connecting...
              </span>
            )}
          </div>
        </div>

      <div className="p-6 bg-brand-light rounded-lg shadow-xl animate-fade-in">

        {/* --- REFACTORED: The react-grid-layout Canvas --- */}
        <div 
          className="relative w-full h-full bg-brand-secondary-light rounded-lg overflow-hidden border border-brand-secondary-dark"
          style={{
            width: `${gridWidth}px`,
            height: `${plan.height}px`,
          }}
        >
          <ResponsiveGridLayout
            layouts={{ lg: currentLayout }}
            breakpoints={{ lg: 1000, md: 0 }}
            cols={{ lg: cols, md: cols }}
            rowHeight={rowHeight}
            width={gridWidth}
            compactType={null}
            preventCollision={true}
            measureBeforeMount={false}
          >
            {/* Map over the rooms from the 'plan' state */}
            {plan.rooms.map((room) => {
              const isBooked = room.current_status === 'Booked';
              const bookedUntil = room.current_booking_details?.end_time;
              
              return (
                <div 
                  key={room.id} 
                  onClick={() => handleRoomClick(room)}
                  // --- P1 FIX: Use a div and conditionally apply cursor/opacity ---
                  // Set tabIndex to make the div clickable and focusable
                  className={`p-3 rounded-lg shadow-lg flex flex-col justify-between focus:ring-4 focus:ring-brand-accent focus:ring-opacity-50 transition-all duration-200
                            ${isBooked 
                              ? 'bg-red-100 border-2 border-brand-error text-red-700 opacity-70 cursor-not-allowed' 
                              : 'bg-white border-2 border-brand-primary text-brand-dark cursor-pointer hover:shadow-xl'
                            }`}
                  tabIndex={isBooked ? -1 : 0} // Make booked rooms non-focusable
                  style={{ pointerEvents: isBooked ? 'none' : 'auto' }} // Stop clicks on booked rooms
                >
                  <div className="flex-grow">
                    <h4 className="font-semibold text-lg">{room.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">{room.capacity} People</span>
                    </div>
                  </div>
                  <div className="text-sm font-semibold flex items-center gap-2 mt-2">
                    {isBooked ? (
                      <span className="flex items-center gap-1">
                        <XCircle className="w-4 h-4" /> Booked 
                        {/* P4: Show End Time Alert */}
                        <span className="ml-2 text-xs font-normal flex items-center gap-1">
                          <Clock className="w-3 h-3" /> 
                          Until {formatTime(bookedUntil)}
                        </span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4 text-brand-success" /> Available
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </ResponsiveGridLayout>
        </div>
      </div>
      
      {/* --- The Booking Modal (Unchanged) --- */}
      {isModalOpen && (
        <BookingModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          room={selectedRoom}
          onBookingSuccess={handleBookingSuccess}
        />
      )}
    </>
  );
};

export default UserBookingPage;