import React from 'react';
import { Building2 } from 'lucide-react';
import HubDashboard from '../components/hub/HubDashboard';

const HubPartnerPortal = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3">
            <Building2 size={32} />
            <div>
              <h1 className="text-2xl font-bold">Hub Partner Portal</h1>
              <p className="text-blue-100">Manage your delivery hub operations</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <HubDashboard />
      </div>
    </div>
  );
};

export default HubPartnerPortal;
