// FILE: ./src/pages/Admin/VersionHistoryPage.jsx
import React, { useState, useEffect } from 'react';
import { useFloorPlanStore } from '../../store/floorPlanStore';
import { adminApi } from '../../api/adminApi';
import { Loader2, AlertTriangle, History, GitCommit, User, Clock } from 'lucide-react';

const VersionHistoryPage = () => {
  // --- State for this page ---
  const [versions, setVersions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Get FloorPlan from Global Store ---
  // We must select individually to avoid infinite loops
  const floorPlan = useFloorPlanStore((state) => state.floorPlan);

  useEffect(() => {
    const fetchVersions = async () => {
      if (!floorPlan) {
        setError("Please load the floor plan on the dashboard first.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const data = await adminApi.getFloorPlanVersions(floorPlan.id);
        setVersions(data);
      } catch (err) {
        setError(err.response?.data?.detail || "Failed to fetch version history.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchVersions();
  }, [floorPlan]); // Re-fetch if the floorPlan changes

  // --- Render Logic ---

  let content;
  if (isLoading) {
    content = (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
        <p className="ml-4 text-brand-gray">Loading History...</p>
      </div>
    );
  } else if (error) {
    content = (
      <div className="flex flex-col items-center justify-center p-12 bg-red-50 rounded-lg border border-brand-error">
        <AlertTriangle className="w-12 h-12 text-brand-error" />
        <p className="mt-4 text-red-700">{error}</p>
      </div>
    );
  } else if (versions.length === 0) {
    content = (
      <div className="flex flex-col items-center justify-center p-12">
        <History className="w-12 h-12 text-brand-gray" />
        <p className="mt-4 text-brand-gray">No version history found for this plan.</p>
      </div>
    );
  } else {
    // --- Render the list ---
    content = (
      <div className="flow-root">
        <ul className="-mb-8">
          {versions.map((version, index) => (
            <li key={version.version_id}>
              <div className="relative pb-8">
                {/* --- Timeline connector --- */}
                {index !== versions.length - 1 && (
                  <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-brand-secondary-dark" aria-hidden="true" />
                )}
                
                <div className="relative flex space-x-3">
                  {/* --- Icon --- */}
                  <div>
                    <span className="h-8 w-8 rounded-full bg-brand-primary flex items-center justify-center ring-8 ring-brand-light">
                      <GitCommit className="h-5 w-5 text-white" />
                    </span>
                  </div>
                  {/* --- Content --- */}
                  <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                    <div>
                      <p className="text-sm text-brand-dark">
                        Floor plan was updated
                      </p>
                      <p className="text-xs text-brand-gray flex items-center gap-1.5">
                        <User className="w-3 h-3" /> by Committer ID: {version.committer_id.substring(0, 8)}...
                      </p>
                    </div>
                    <div className="text-right text-sm whitespace-nowrap text-brand-gray">
                      <div className="flex items-center gap-1.5">
                         <Clock className="w-4 h-4" />
                         {/* Format the date nicely */}
                         {new Date(version.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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