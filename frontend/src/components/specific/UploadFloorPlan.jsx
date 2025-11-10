// FILE: ./src/components/specific/UploadFloorPlan.jsx
import React, { useState } from 'react';
import { useFloorPlanStore } from '../../store/floorPlanStore';
import { adminApi } from '../../api/adminApi';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, Plus, X, Loader2, Map, Users, Square, Maximize } from 'lucide-react';

const UploadFloorPlan = () => {
  const navigate = useNavigate();

  // --- State for the form ---
  const [planName, setPlanName] = useState('Main Office - 1st Floor');
  const [planWidth, setPlanWidth] = useState(1000);
  const [planHeight, setPlanHeight] = useState(800);
  
  const [rooms, setRooms] = useState([
    { name: 'Conference Room A', capacity: '10', features: 'Projector, Whiteboard', x_coord: 50, y_coord: 50, width: 150, height: 100 },
    { name: 'Huddle Room B', capacity: '4', features: 'Monitor', x_coord: 250, y_coord: 50, width: 100, height: 80 },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  // Get the action from the store to update the UI on success
  const setFloorPlanData = useFloorPlanStore((state) => state.setFloorPlanData);

  // --- Form Handlers ---
  const handleRoomChange = (index, field, value) => {
    const newRooms = [...rooms];
    newRooms[index][field] = value;
    setRooms(newRooms);
  };

  const addRoom = () => {
    setRooms([
      ...rooms,
      { name: '', capacity: '0', features: '', x_coord: 0, y_coord: 0, width: 100, height: 50 },
    ]);
  };

  const removeRoom = (index) => {
    const newRooms = rooms.filter((_, i) => i !== index);
    setRooms(newRooms);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    toast.loading('Uploading floor plan...');

    try {
      // 1. Format the data for the new backend API
      const payload = {
        name: planName,
        width: Number(planWidth),
        height: Number(planHeight),
        map_data: { "ui_settings": "default" },
        rooms: rooms.map(room => ({
          name: room.name,
          capacity: room.capacity,
          features: room.features.split(',').map(f => f.trim()).filter(f => f),
          x_coord: Number(room.x_coord) || 0,
          y_coord: Number(room.y_coord) || 0,
          width: Number(room.width) || 100,
          height: Number(room.height) || 50,
        })),
      };

      // 2. Call the API
      const newPlan = await adminApi.uploadInitialFloorPlan(payload);

      // 3. On success, update the global store
      setFloorPlanData(newPlan);
      toast.dismiss();
      toast.success('Floor plan uploaded successfully!');
      
      // 4. --- NEW: Redirect to the new editor page ---
      navigate(`/admin/floorplan/${newPlan.id}`);

    } catch (err) {
      toast.dismiss();
      toast.error(err.response?.data?.detail || 'Failed to upload plan.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Render ---
  return (
    <div className="p-6 bg-brand-light rounded-lg shadow-xl max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <UploadCloud className="w-10 h-10 text-brand-primary" />
        <div>
          <h2 className="text-2xl font-semibold text-brand-dark">Create New Floor Plan</h2>
          <p className="text-brand-gray">Define the floor plan's dimensions and add its rooms.</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {/* Floor Plan Details */}
        <fieldset className="p-4 border rounded-lg">
          <legend className="px-2 font-semibold text-brand-dark">Floor Details</legend>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-brand-gray mb-1" htmlFor="planName">Floor Name</label>
              <input
                type="text" id="planName" value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                className="w-full p-2 border border-brand-secondary-dark rounded-lg"
                placeholder="e.g., Building A - 1st Floor" required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-gray mb-1" htmlFor="planWidth">Total Width (px)</label>
              <input
                type="number" id="planWidth" value={planWidth}
                onChange={(e) => setPlanWidth(e.target.value)}
                className="w-full p-2 border border-brand-secondary-dark rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-gray mb-1" htmlFor="planHeight">Total Height (px)</label>
              <input
                type="number" id="planHeight" value={planHeight}
                onChange={(e) => setPlanHeight(e.target.value)}
                className="w-full p-2 border border-brand-secondary-dark rounded-lg"
              />
            </div>
          </div>
        </fieldset>

        {/* Rooms List */}
        <fieldset className="p-4 border rounded-lg">
          <legend className="px-2 font-semibold text-brand-dark">Rooms</legend>
          <div className="space-y-4">
            {rooms.map((room, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 border rounded-lg bg-brand-secondary-light">
                {/* Fields for name, capacity, features */}
                <div className="md:col-span-3"><label className="block text-xs font-medium text-brand-gray mb-1">Name</label><input type="text" value={room.name} onChange={(e) => handleRoomChange(index, 'name', e.target.value)} placeholder="Room Name" className="w-full p-2 border rounded-md"/></div>
                <div className="md:col-span-2"><label className="block text-xs font-medium text-brand-gray mb-1">Capacity</label><input type="number" value={room.capacity} onChange={(e) => handleRoomChange(index, 'capacity', e.target.value)} placeholder="10" className="w-full p-2 border rounded-md"/></div>
                <div className="md:col-span-7"><label className="block text-xs font-medium text-brand-gray mb-1">Features (comma-separated)</label><input type="text" value={room.features} onChange={(e) => handleRoomChange(index, 'features', e.target.value)} placeholder="Projector" className="w-full p-2 border rounded-md"/></div>
                {/* Fields for geometry */}
                <div className="md:col-span-3"><label className="block text-xs font-medium text-brand-gray mb-1">X-Pos</label><input type="number" value={room.x_coord} onChange={(e) => handleRoomChange(index, 'x_coord', e.target.value)} className="w-full p-2 border rounded-md"/></div>
                <div className="md:col-span-3"><label className="block text-xs font-medium text-brand-gray mb-1">Y-Pos</label><input type="number" value={room.y_coord} onChange={(e) => handleRoomChange(index, 'y_coord', e.target.value)} className="w-full p-2 border rounded-md"/></div>
                <div className="md:col-span-3"><label className="block text-xs font-medium text-brand-gray mb-1">Width</label><input type="number" value={room.width} onChange={(e) => handleRoomChange(index, 'width', e.target.value)} className="w-full p-2 border rounded-md"/></div>
                <div className="md:col-span-2"><label className="block text-xs font-medium text-brand-gray mb-1">Height</label><input type="number" value={room.height} onChange={(e) => handleRoomChange(index, 'height', e.target.value)} className="w-full p-2 border rounded-md"/></div>
                <div className="flex items-end justify-end md:col-span-1"><button type="button" onClick={() => removeRoom(index)} className="p-2 text-brand-error hover:bg-red-100 rounded-md"><X className="w-5 h-5" /></button></div>
              </div>
            ))}
            <button
              type="button"
              onClick={addRoom}
              className="flex items-center gap-2 text-sm font-medium text-brand-primary hover:text-brand-primary-dark"
            >
              <Plus className="w-4 h-4" /> Add Another Room
            </button>
          </div>
        </fieldset>

        {/* Submit Button */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full md:w-auto flex justify-center items-center gap-2 bg-brand-primary text-white font-semibold py-2.5 px-6 rounded-lg shadow-md hover:bg-brand-primary-dark focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 transition-all duration-200 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-s" />}
            {isLoading ? 'Uploading...' : 'Upload & Create Plan'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UploadFloorPlan;