// FILE: ./src/components/specific/FloorPlanEditor.jsx
import React, { useState } from 'react';
import { useFloorPlanStore } from '../../store/floorPlanStore';
import EditRoomModal from './EditRoomModal'; // Import our new modal
import { MapPin, Users } from 'lucide-react';

const FloorPlanEditor = () => {
  // --- START OF FIX ---
  // Select each piece of state individually
  const floorPlan = useFloorPlanStore((state) => state.floorPlan);
  const rooms = useFloorPlanStore((state) => state.rooms);
  // --- END OF FIX ---

  // --- Modal State ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);

  const handleRoomClick = (room) => {
    setSelectedRoom(room);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRoom(null);
  };

  return (
    <>
      {/* --- The Floor Plan --- */}
      <div className="p-6 bg-brand-light rounded-lg shadow-xl">
        <h2 className="text-2xl font-semibold text-brand-dark mb-1">Floor Plan: {floorPlan.name}</h2>
        <p className="text-brand-gray mb-6">Click on any room to edit its details.</p>
        
        {/* This is the "map" area. We set a large height for scrolling. */}
        <div className="relative w-full h-[600px] bg-brand-secondary-light rounded-lg overflow-auto border border-brand-secondary-dark">
          {rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => handleRoomClick(room)}
              style={{
                left: `${room.x_coord || 0}px`, // Use 0,0 as fallback
                top: `${room.y_coord || 0}px`,
              }}
              className="absolute p-3 w-48 bg-white border-2 border-brand-primary rounded-lg shadow-lg cursor-pointer hover:shadow-xl hover:border-brand-accent-dark transform transition-all"
            >
              <h4 className="font-semibold text-brand-dark">{room.name}</h4>
              <div className="flex items-center gap-2 mt-1 text-brand-gray">
                <Users className="w-4 h-4" />
                <span className="text-sm">{room.capacity} People</span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-brand-gray text-xs">
                <MapPin className="w-4 h-4" />
                <span>({room.x_coord}, {room.y_coord})</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* --- The Modal --- */}
      {/* We render the modal but it's invisible until isOpen=true. 
        It's important to pass 'selectedRoom' so it has the data to edit.
      */}
      {isModalOpen && (
        <EditRoomModal
          isOpen={isModalOpen}
          onClose={closeModal}
          room={selectedRoom}
        />
      )}
    </>
  );
};

export default FloorPlanEditor;