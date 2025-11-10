// FILE: ./src/pages/Admin/AdminFloorPlanEditor.jsx
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useFloorPlanStore } from "../../store/floorPlanStore";
import toast from "react-hot-toast";
// --- NEW: Import Tooltip for hover functionality ---
import { Loader2, Save, Plus, Users, Maximize, Clock, Mail, History } from "lucide-react"; 
import { v4 as uuidv4 } from 'uuid'; 
import EditRoomModal from "../../components/specific/EditRoomModal";
import { bookingApi } from "../../api/bookingApi"; // --- NEW: Import bookingApi ---
import { adminApi } from "../../api/adminApi";

// --- NEW: Import react-grid-layout ---
import { Responsive, WidthProvider } from 'react-grid-layout';
// --- NEW: Import the required CSS ---
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

// --- NEW UTILITY: Consistent HSL Color Generator (Unchanged) ---
/**
 * Generates a consistent, light background color (HSL) based on a string ID.
 * The lightness is kept high (L=95) for a faint shade.
 * @param {string} str - The room ID (UUID)
 * @returns {string} HSL color string (e.g., 'hsl(210, 50%, 95%)')
 */
const stringToHslColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const h = hash % 360; // Hue (0-360)
  const s = 40;        // Saturation (kept moderate for pleasant color)
  const l = 95;        // Lightness (kept high for faint background shade)

  return `hsl(${h}, ${s}%, ${l}%)`;
};
// --- END NEW UTILITY ---

// --- P4 NEW: Tooltip Component for Hover Info ---
const Tooltip = ({ bookingDetails }) => {
    if (!bookingDetails) return null;

    const endTime = new Date(bookingDetails.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="absolute z-50 p-3 bg-brand-primary text-white text-xs rounded-lg shadow-xl top-1/2 left-full transform -translate-y-1/2 ml-2 pointer-events-none w-48">
            <h5 className="font-bold mb-1 flex items-center gap-1">BOOKED NOW</h5>
            <p className="flex items-center gap-1.5"><Clock className="w-3 h-3"/> Until {endTime}</p>
            <p className="flex items-center gap-1.5"><Mail className="w-3 h-3"/> {bookingDetails.user_email}</p>
        </div>
    );
};
// --- END NEW COMPONENT ---

const AdminFloorPlanEditor = () => {
  const { floorPlanId } = useParams();

  // State (Unchanged)
  const currentPlan = useFloorPlanStore((state) => state.currentPlan);
  const isLoadingPlan = useFloorPlanStore((state) => state.isLoadingPlan);
  const error = useFloorPlanStore((state) => state.error);
  const fetchFloorPlanById = useFloorPlanStore((state) => state.fetchFloorPlanById);
  const saveFloorPlanLayout = useFloorPlanStore((state) => state.saveFloorPlanLayout);

  const [draftRooms, setDraftRooms] = useState([]);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  
  // --- P4 NEW: State for Live Booking Status Data ---
  const [liveStatus, setLiveStatus] = useState({});
  const [isHovering, setIsHovering] = useState(null); // Track which room is being hovered
  // --- END P4 NEW ---

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  
  // Grid layout configuration (Unchanged)
  const cols = 12;
  const rowHeight = 10;
  const [gridWidth, setGridWidth] = useState(1000);
  const [colWidth, setColWidth] = useState(gridWidth / cols);

  // --- Effects (Updated) ---
  const fetchLiveStatus = async (id) => {
      try {
          // Use the meeting/user endpoint to get status, as it's lighter than admin's status endpoint
          const data = await bookingApi.getFloorPlanStatus(id);
          const statusMap = {};
          data.rooms.forEach(room => {
              statusMap[room.id] = {
                  status: room.current_status,
                  details: room.current_booking_details
              };
          });
          setLiveStatus(statusMap);
      } catch (err) {
          console.error("Could not fetch live status for admin view:", err);
      }
  };

  useEffect(() => {
    fetchFloorPlanById(floorPlanId);
    // Fetch live status once on load
    fetchLiveStatus(floorPlanId); 
  }, [floorPlanId, fetchFloorPlanById]);

  useEffect(() => {
    if (currentPlan && currentPlan.id === floorPlanId && !isDirty) {
      setDraftRooms(JSON.parse(JSON.stringify(currentPlan.rooms)));
      const newGridWidth = currentPlan.width || 1000;
      setGridWidth(newGridWidth);
      setColWidth(newGridWidth / cols);
    }
  }, [currentPlan, floorPlanId, isDirty]); 

  // Grid-specific handlers (Unchanged)
  const handleLayoutChange = (newLayout) => {
    if (colWidth <= 0) return;
    const newDraftRooms = draftRooms.map(draftRoom => {
      const layoutItem = newLayout.find(item => item.i === draftRoom.id);
      if (!layoutItem) return draftRoom; 
      const newRoomData = {
        ...draftRoom,
        x_coord: Math.round(layoutItem.x * colWidth),
        y_coord: Math.round(layoutItem.y * rowHeight),
        width: Math.round(layoutItem.w * colWidth),
        height: Math.round(layoutItem.h * rowHeight),
      };
      return newRoomData;
    });
    setDraftRooms(newDraftRooms);
    setIsDirty(true);
  };

  const generateLayout = () => {
    if (colWidth <= 0) return [];
    return draftRooms.map(room => {
      const w = Math.round(room.width / colWidth) || 1;
      const h = Math.round(room.height / rowHeight) || 1;
      const x = Math.round(room.x_coord / colWidth);
      const y = Math.round(room.y_coord / rowHeight);
      return {
        i: room.id,
        x: x, y: y,
        w: w < 1 ? 1 : w, 
        h: h < 1 ? 1 : h, 
      };
    });
  };

  // Modal & Save Handlers (Unchanged)
  const handleRoomClick = (room) => {
    setSelectedRoom(room);
    setIsModalOpen(true);
  };

  const handleModalSave = (updatedRoom) => {
    setDraftRooms((prevRooms) =>
      prevRooms.map((r) => (r.id === updatedRoom.id ? updatedRoom : r))
    );
    setIsDirty(true);
    setIsModalOpen(false);
  };
  
  const handleAddRoom = () => {
    const newRoom = {
      id: uuidv4(), 
      name: 'New Room',
      capacity: '4',
      features: [],
      x_coord: 0, 
      y_coord: 0,
      width: Math.round(colWidth * 2), 
      height: Math.round(rowHeight * 5),
      floor_plan_id: currentPlan.id, 
    };
    setDraftRooms((prev) => [...prev, newRoom]);
    setIsDirty(true);
    setSelectedRoom(newRoom);
    setIsModalOpen(true);
  };
  
  const handleDeleteRoom = (roomIdToDelete) => {
    setDraftRooms((prevRooms) => 
      prevRooms.filter((room) => room.id !== roomIdToDelete)
    );
    setIsDirty(true);
    setIsModalOpen(false);
    toast.success("Room removed. Click 'Save' to confirm deletion.");
  };

  const handleSaveLayout = async () => {
    setIsSaving(true);
    const roomUpdates = draftRooms.map((room) => ({
      room_id: room.id,
      name: room.name,
      capacity: String(room.capacity),
      features: room.features || [], 
      x_coord: room.x_coord,
      y_coord: room.y_coord,
      width: room.width,
      height: room.height,
    }));

    const result = await saveFloorPlanLayout({
      floor_plan_id: currentPlan.id,
      client_last_modified_at: currentPlan.last_modified_at,
      room_updates: roomUpdates,
    });

    setIsSaving(false);
    if (result === "success") {
      toast.success("Floor plan saved!");
      setIsDirty(false); 
      fetchFloorPlanById(floorPlanId); 
      fetchLiveStatus(floorPlanId); // --- P4 FIX: Refresh status data too ---
    } else if (result === "conflict") {
      toast.error(
        "Someone else updated this plan. Your view has been refreshed.",
        { duration: 4000 }
      );
      setIsDirty(false);
    } else {
      toast.error("Error saving. Try again.");
    }
  };

  const handleRestoreFromBackup = async () => {
    setIsRestoring(true);
    try {
      await adminApi.restoreFloorPlan(floorPlanId);
      toast.success("Restored from latest backup.");
      setIsDirty(false);
      fetchFloorPlanById(floorPlanId);
      fetchLiveStatus(floorPlanId);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to restore backup.");
    } finally {
      setIsRestoring(false);
    }
  };

  // --- Render logic (Updated) ---
  if (isLoadingPlan)
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-12 h-12 animate-spin text-brand-primary" />
      </div>
    );

  if (error)
    return <div className="p-8 bg-red-50 text-red-700 rounded-lg">Error: {error}</div>;

  if (!currentPlan) return <div className="p-8">Floor plan not found.</div>;

  const currentLayout = generateLayout();

  return (
    <>
      <div className="p-6 bg-brand-light rounded-lg shadow-xl">
        {/* Header (unchanged) */}
        <div className="flex justify-between items-center mb-4 pb-4 border-b">
          <div>
            <h1 className="text-3xl font-bold text-brand-dark">{currentPlan.name}</h1>
            <p className="text-brand-gray">Drag rooms & resize. Click to edit.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAddRoom}
              className="flex items-center gap-2 bg-brand-secondary text-brand-dark font-semibold py-2 px-4 rounded-lg hover:bg-brand-secondary-dark"
            >
              <Plus className="w-5 h-5" /> Add Room
            </button>
            <button
              onClick={handleRestoreFromBackup}
              disabled={isRestoring}
              className="flex items-center gap-2 bg-brand-secondary-light text-brand-dark font-semibold py-2 px-4 rounded-lg hover:bg-brand-secondary disabled:opacity-50"
            >
              {isRestoring ? <Loader2 className="w-5 h-5 animate-spin" /> : <History className="w-5 h-5" />}
              {isRestoring ? "Restoring..." : "Restore Backup"}
            </button>
            <button
              onClick={handleSaveLayout}
              disabled={!isDirty || isSaving}
              className="w-32 flex justify-center items-center gap-2 bg-brand-success text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-green-600 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        {/* Grid Canvas (Updated to use HSL color) */}
        <div 
          className="relative w-full h-full bg-brand-secondary-light rounded-lg overflow-hidden border border-brand-secondary-dark"
          style={{
            width: `${gridWidth}px`,
            height: `${currentPlan.height}px`,
          }}
        >
          <ResponsiveGridLayout
            layouts={{ lg: currentLayout }}
            breakpoints={{ lg: 1000, md: 0 }}
            cols={{ lg: cols, md: cols }}
            rowHeight={rowHeight}
            width={gridWidth}
            onLayoutChange={handleLayoutChange}
            compactType={null}
            preventCollision={true}
            measureBeforeMount={false}
          >
            {draftRooms.map((room) => {
                // --- P4 FIX: Get Status Data ---
                const statusData = liveStatus[room.id];
                const isBooked = statusData?.status === 'Booked';

                return (
                    <div 
                        key={room.id} 
                        // --- P3 FIX: Apply consistent, faint background color ---
                        style={{ 
                            backgroundColor: isBooked ? '#FEE2E2' : stringToHslColor(room.id), // Use red shade if booked
                            borderStyle: isBooked ? 'dashed' : 'solid', // Use dashed border if booked
                            borderColor: isBooked ? '#EF4444' : '#06B6D4',
                        }}
                        className="p-3 border-2 rounded-lg shadow-lg flex flex-col justify-between cursor-move relative group"
                        onMouseEnter={() => isBooked && setIsHovering(room.id)}
                        onMouseLeave={() => isBooked && setIsHovering(null)}
                    >
                        {/* P4 FIX: Show Tooltip on Hover */}
                        {isHovering === room.id && <Tooltip bookingDetails={statusData?.details} />}

                        <div className="flex flex-col h-full">
                            <div 
                                className="flex-grow cursor-pointer"
                                onClick={() => handleRoomClick(room)}
                            >
                                <h4 className="font-semibold text-brand-dark text-lg">{room.name}</h4>
                                <div className="flex items-center gap-2 mt-1 text-brand-gray">
                                    <Users className="w-4 h-4" />
                                    <span className="text-sm">{room.capacity} People</span>
                                </div>
                            </div>
                            {/* P4: Status Indicator */}
                            <div className="text-xs font-medium mt-2 flex justify-between items-center">
                                <div className={`px-2 py-0.5 rounded-full ${isBooked ? 'bg-red-400 text-white' : 'bg-green-100 text-green-700'}`}>
                                    {isBooked ? 'BOOKED' : 'EDIT MODE'}
                                </div>
                                <div className="text-brand-gray flex items-center gap-1">
                                    <Maximize className="w-3 h-3" />
                                    <span>{Math.round(room.width)}x{Math.round(room.height)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
          </ResponsiveGridLayout>
        </div>
      </div>

      {/* --- Modal (Unchanged) --- */}
      {isModalOpen && (
        <EditRoomModal
          isOpen={true}
          room={selectedRoom}
          onSave={handleModalSave}
          onDelete={handleDeleteRoom} 
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
};

export default AdminFloorPlanEditor;