import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
// --- NEW: Import Trash icon ---
import { Loader2, Save, Users, Type, Maximize, Hash, Trash2 } from 'lucide-react';
import Modal from '../common/Modal'; 

/**
 * A modal form for editing a room's details.
 * @param {object} props
 * @param {object} props.room - The room object to edit
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {function} props.onClose - Function to close the modal
 * @param {function} props.onSave - Callback with the updated room data
 * @param {function} props.onDelete - NEW: Callback to delete the room
 */
const EditRoomModal = ({ room, isOpen, onClose, onSave, onDelete }) => {
  // --- Form State (Unchanged) ---
  const [formData, setFormData] = useState({
    name: '',
    capacity: '0',
    features: '',
    x_coord: 0,
    y_coord: 0,
    width: 100,
    height: 50
  });
  
  // Effect to update form state (Unchanged)
  useEffect(() => {
    if (room) {
      setFormData({
        name: room.name || '',
        capacity: room.capacity || '0',
        features: (room.features || []).join(', '), // Join array to string
        x_coord: room.x_coord || 0,
        y_coord: room.y_coord || 0,
        width: room.width || 100,
        height: room.height || 50,
      });
    }
  }, [room]);

  // handleChange (Unchanged)
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // handleSubmit (Unchanged)
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...room, 
      ...formData,
      features: formData.features.split(',').map(f => f.trim()).filter(f => f), 
      capacity: String(formData.capacity),
      x_coord: Number(formData.x_coord),
      y_coord: Number(formData.y_coord),
      width: Number(formData.width),
      height: Number(formData.height),
    });
  };
  
  // --- NEW: Handle Delete Button Click ---
  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${room.name}"? This action cannot be undone.`)) {
      onDelete(room.id);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit Room: ${room?.name}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Form Fields (Unchanged) */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-brand-dark mb-1" htmlFor="name">Room Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full p-2 border border-brand-secondary-dark rounded-lg" required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-brand-dark mb-1" htmlFor="capacity">Capacity</label>
            <input type="number" name="capacity" value={formData.capacity} onChange={handleChange} className="w-full p-2 border border-brand-secondary-dark rounded-lg" required />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-brand-dark mb-1" htmlFor="features">Features (comma-separated)</label>
          <input type="text" name="features" value={formData.features} onChange={handleChange} className="w-full p-2 border border-brand-secondary-dark rounded-lg" />
        </div>
        <div className="grid grid-cols-4 gap-3">
          <div>
            <label className="block text-sm font-medium text-brand-gray mb-1">X-Pos</label>
            <input type="number" name="x_coord" value={formData.x_coord} onChange={handleChange} className="w-full p-2 border rounded-md"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-gray mb-1">Y-Pos</label>
            <input type="number" name="y_coord" value={formData.y_coord} onChange={handleChange} className="w-full p-2 border rounded-md"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-gray mb-1">Width</label>
            <input type="number" name="width" value={formData.width} onChange={handleChange} className="w-full p-2 border rounded-md"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-gray mb-1">Height</label>
            <input type="number" name="height" value={formData.height} onChange={handleChange} className="w-full p-2 border rounded-md"/>
          </div>
        </div>
        
        {/* --- UPDATED: Actions --- */}
        <div className="flex justify-between items-center gap-3 pt-4">
          {/* NEW: Delete Button */}
          <button 
            type="button" 
            onClick={handleDelete} 
            className="flex items-center gap-2 px-4 py-2 font-semibold text-brand-error rounded-lg hover:bg-red-100"
          >
            <Trash2 className="w-5 h-5" />
            Delete Room
          </button>
          
          {/* Existing Save/Cancel Buttons */}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 font-semibold text-brand-gray bg-brand-secondary-light rounded-lg hover:bg-brand-secondary">
              Cancel
            </button>
            <button type="submit" className="w-28 flex justify-center items-center gap-2 bg-brand-primary text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-brand-primary-dark">
              <Save className="w-5 h-5" />
              Save
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default EditRoomModal;