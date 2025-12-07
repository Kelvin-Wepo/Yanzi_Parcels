import React from 'react';
import { MapPin } from 'lucide-react';
import HubFinder from '../components/hub/HubFinder';

const HubFinderPage = () => {
  const handleSelectHub = (hub) => {
    console.log('Selected hub:', hub);
    // This could store the selected hub in state/context for job creation
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3">
            <MapPin size={32} />
            <div>
              <h1 className="text-2xl font-bold">Find Delivery Hubs Near You</h1>
              <p className="text-green-100">Pick up your parcels from the nearest convenient location</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <HubFinder onSelectHub={handleSelectHub} />
      </div>
    </div>
  );
};

export default HubFinderPage;
