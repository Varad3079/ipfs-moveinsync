// FILE: ./src/pages/Admin/AdminVersionHistory.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useFloorPlanStore } from '../../store/floorPlanStore';
import { adminApi } from '../../api/adminApi';
import { Loader2, AlertTriangle, History, GitCommit, User, Clock, Map } from 'lucide-react';

const VersionHistoryPage = () => {
  const { floorPlanId } = useParams(); // Get the ID from the URL
  const [versions, setVersions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- START OF FIX ---
  // Select state individually to prevent infinite re-renders
  const floorPlans = useFloorPlanStore((state) => state.floorPlans);
  const fetchFloorPlanList = useFloorPlanStore((state) => state.fetchFloorPlanList);
  // --- END OF FIX ---

  useEffect(() => {
    // If no ID is in the URL, just load the list of plans
    if (!floorPlanId) {
      fetchFloorPlanList();
      setIsLoading(false);
      return;
    }

    // An ID *is* in the URL, so fetch the versions for it
    const fetchVersions = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await adminApi.getFloorPlanVersions(floorPlanId);
        setVersions(data);
      } catch (err) {
        setError(err.response?.data?.detail || "Failed to fetch version history.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchVersions();
  }, [floorPlanId, fetchFloorPlanList]); // fetchFloorPlanList is now a stable dependency

  // --- Render Logic ---
  let content;
  if (isLoading) {
    content = <div className="flex items-center justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-brand-primary" /></div>;
  } else if (error) {
    content = <div className="p-8 bg-red-50 text-red-700 rounded-lg">{error}</div>;
  } else if (versions.length > 0) {
    // --- Render the list ---
    content = (
      <div className="flow-root">
        <ul className="-mb-8">
          {versions.map((version, index) => (
            <li key={version.version_id}>
              <div className="relative pb-8">
                {index !== versions.length - 1 && <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-brand-secondary-dark" aria-hidden="true" />}
                <div className="relative flex space-x-3">
                  <div><span className="h-8 w-8 rounded-full bg-brand-primary flex items-center justify-center ring-8 ring-brand-light"><GitCommit className="h-5 w-5 text-white" /></span></div>
                  <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                    <div>
                      <p className="text-sm text-brand-dark">Floor plan was updated</p>
                      <p className="text-xs text-brand-gray flex items-center gap-1.5"><User className="w-3 h-3" /> by Committer ID: {version.committer_id.substring(0, 8)}...</p>
                    </div>
                    <div className="text-right text-sm whitespace-nowrap text-brand-gray">
                      <div className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{new Date(version.timestamp).toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  } else {
    // No versions, or no plan selected
    content = (
      <div className="bg-brand-light rounded-lg shadow-xl overflow-hidden">
        <h2 className="text-lg font-semibold p-4 border-b">Select a Floor Plan to View History</h2>
        <ul className="divide-y divide-brand-secondary-dark">
          {floorPlans.map((plan) => (
            <li key={plan.id}>
              <Link 
                to={`/admin/history/${plan.id}`}
                className="flex items-center justify-between p-4 hover:bg-brand-secondary-light transition-colors"
              >
                <div className="flex items-center gap-3"><div className="p-2 bg-brand-secondary-light rounded-lg"><Map className="w-5 h-5 text-brand-primary" /></div>
                  <div>
                    <p className="font-semibold text-brand-dark">{plan.name}</p>
                    <p className="text-sm text-brand-gray">{plan.rooms.length} Rooms</p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="animate-fade-in p-6 bg-brand-light rounded-lg shadow-xl max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-brand-dark mb-6 border-b pb-4">Version History</h1>
      {content}
    </div>
  );
};

export default VersionHistoryPage;