// FILE: ./src/pages/Admin/AdminFloorPlanList.jsx
import React, { useEffect } from 'react';
import { useFloorPlanStore } from '../../store/floorPlanStore';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, AlertTriangle, Map, Plus, ChevronRight, Home } from 'lucide-react';

const AdminFloorPlanList = () => {
  const navigate = useNavigate();

  // Select state individually
  const floorPlans = useFloorPlanStore((state) => state.floorPlans);
  const isLoading = useFloorPlanStore((state) => state.isLoadingList);
  const error = useFloorPlanStore((state) => state.error);
  const fetchFloorPlanList = useFloorPlanStore((state) => state.fetchFloorPlanList);

  useEffect(() => {
    // Fetch the list of plans when the component mounts
    fetchFloorPlanList();
  }, [fetchFloorPlanList]);

  const handleCreateNew = () => {
    navigate('/admin/floorplan/new');
  };

  let content;
  if (isLoading) {
    content = (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
        <p className="ml-4 text-brand-gray">Loading Floor Plans...</p>
      </div>
    );
  } else if (error) {
    content = (
      <div className="p-8 bg-red-50 rounded-lg border border-brand-error text-center">
        <AlertTriangle className="w-12 h-12 text-brand-error mx-auto" />
        <h2 className="mt-4 text-xl font-semibold text-brand-error">Error</h2>
        <p className="mt-2 text-red-700">{error}</p>
        <button 
          onClick={fetchFloorPlanList}
          className="mt-6 bg-brand-error text-white font-semibold py-2 px-6 rounded-lg shadow-md"
        >
          Try Again
        </button>
      </div>
    );
  } else if (floorPlans.length === 0) {
    content = (
      <div className="text-center p-12 bg-brand-light rounded-lg shadow-lg border-2 border-dashed border-brand-secondary-dark">
        <Home className="w-16 h-16 text-brand-primary mx-auto" />
        <h2 className="mt-4 text-2xl font-semibold text-brand-dark">No Floor Plans Found</h2>
        <p className="mt-2 text-brand-gray">Get started by creating your first floor plan.</p>
        <button 
          onClick={handleCreateNew}
          className="mt-6 inline-flex items-center gap-2 bg-brand-primary text-white font-semibold py-2 px-6 rounded-lg shadow-md hover:bg-brand-primary-dark"
        >
          <Plus className="w-5 h-5" />
          Create New Plan
        </button>
      </div>
    );
  } else {
    content = (
      <div className="bg-brand-light rounded-lg shadow-xl overflow-hidden">
        <ul className="divide-y divide-brand-secondary-dark">
          {floorPlans.map((plan) => (
            <li key={plan.id}>
              <Link 
                to={`/admin/floorplan/${plan.id}`}
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
    <div className="animate-fade-in max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-brand-dark">Floor Plans</h1>
        {floorPlans.length > 0 && (
          <button 
            onClick={handleCreateNew}
            className="inline-flex items-center gap-2 bg-brand-primary text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-brand-primary-dark"
          >
            <Plus className="w-5 h-5" />
            Create New Plan
          </button>
        )}
      </div>
      {content}
    </div>
  );
};

export default AdminFloorPlanList;