// FILE: ./src/pages/Admin/FloorPlanPage.jsx
import React, { useEffect } from 'react';
import { useFloorPlanStore } from '../../store/floorPlanStore';
import { SquareTerminal, UploadCloud, AlertTriangle } from 'lucide-react';
import UploadFloorPlan from '../../components/specific/UploadFloorPlan'; 
import FloorPlanEditor from '../../components/specific/FloorPlanEditor';

// This component is now the "brains" that decides to show the uploader or the editor.
const FloorPlanPage = () => {
  // Select state individually
  const floorPlan = useFloorPlanStore((state) => state.floorPlan);
  const isLoading = useFloorPlanStore((state) => state.isLoading);
  const error = useFloorPlanStore((state) => state.error);
  const fetchFloorPlan = useFloorPlanStore((state) => state.fetchFloorPlan);

  // Fetch data on component mount
  useEffect(() => {
    // This logic now correctly belongs on the floor plan page
    fetchFloorPlan();
  }, [fetchFloorPlan]);

  // --- Render Logic ---
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <SquareTerminal className="w-12 h-12 animate-spin text-brand-primary" />
        <p className="ml-4 text-brand-gray">Loading Floor Plan...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 bg-red-50 rounded-lg border border-brand-error">
        <AlertTriangle className="w-12 h-12 text-brand-error" />
        <h2 className="mt-4 text-xl font-semibold text-brand-error">Error</h2>
        <p className="mt-2 text-red-700">{error}</p>
        <button 
          onClick={fetchFloorPlan}
          className="mt-6 bg-brand-error text-white font-semibold py-2 px-6 rounded-lg shadow-md"
        >
          Try Again
        </button>
      </div>
    );
  }

  // --- Conditional UI ---
  return (
    <div className="animate-fade-in">
      {floorPlan ? (
        <FloorPlanEditor />
      ) : (
        <UploadFloorPlan />
      )}
    </div>
  );
};

export default FloorPlanPage;