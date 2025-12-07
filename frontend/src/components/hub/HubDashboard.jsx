import React, { useState, useEffect } from 'react';
import { Package, TrendingUp, DollarSign, CheckCircle, Clock, Search } from 'lucide-react';
import hubAPI from '../../services/hubAPI';

const HubDashboard = ({ hubId }) => {
  const [dashboard, setDashboard] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pickupCode, setPickupCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState(null);

  useEffect(() => {
    fetchDashboard();
    fetchDeliveries();
  }, [hubId]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await hubAPI.getHubDashboard(hubId);
      setDashboard(response.data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliveries = async () => {
    try {
      const response = await hubAPI.getHubDeliveries();
      // Filter deliveries for this hub that are pending pickup
      const filtered = response.data.filter(
        d => d.hub && ['at_hub', 'ready_for_pickup'].includes(d.status)
      );
      setDeliveries(filtered);
    } catch (err) {
      console.error('Error fetching deliveries:', err);
    }
  };

  const handleVerifyPickup = async (e) => {
    e.preventDefault();
    if (!pickupCode.trim()) return;

    try {
      setVerifying(true);
      setVerifyMessage(null);
      await hubAPI.verifyPickup(hubId, pickupCode);
      
      setVerifyMessage({ type: 'success', text: 'Pickup verified successfully!' });
      setPickupCode('');
      
      // Refresh data
      fetchDashboard();
      fetchDeliveries();
    } catch (err) {
      setVerifyMessage({
        type: 'error',
        text: err.response?.data?.error || 'Invalid pickup code'
      });
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hub Info Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">{dashboard?.hub_name}</h2>
        <p className="text-blue-100 text-sm">Hub Code: {dashboard?.hub_code}</p>
        <div className="mt-4 flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
            dashboard?.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'
          }`}>
            {dashboard?.status}
          </span>
          <span className="text-blue-100">
            Storage: {dashboard?.current_occupancy}/{dashboard?.storage_capacity} ({dashboard?.occupancy_percentage?.toFixed(0)}%)
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Today's Deliveries</p>
              <p className="text-3xl font-bold text-gray-900">{dashboard?.today_deliveries || 0}</p>
            </div>
            <Package className="text-blue-600" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Pending Pickups</p>
              <p className="text-3xl font-bold text-gray-900">{dashboard?.pending_pickups || 0}</p>
            </div>
            <Clock className="text-orange-600" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Month Earnings</p>
              <p className="text-3xl font-bold text-gray-900">KES {dashboard?.month_earnings?.toFixed(0) || 0}</p>
            </div>
            <DollarSign className="text-green-600" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Earnings</p>
              <p className="text-3xl font-bold text-gray-900">KES {dashboard?.total_earnings?.toFixed(0) || 0}</p>
            </div>
            <TrendingUp className="text-purple-600" size={32} />
          </div>
        </div>
      </div>

      {/* Pickup Verification */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Verify Pickup</h3>
        <form onSubmit={handleVerifyPickup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter 8-Digit Pickup Code
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={pickupCode}
                onChange={(e) => setPickupCode(e.target.value)}
                placeholder="12345678"
                maxLength={8}
                pattern="[0-9]{8}"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl font-mono"
              />
              <button
                type="submit"
                disabled={verifying || pickupCode.length !== 8}
                className={`px-6 py-2 rounded-lg font-semibold transition ${
                  verifying || pickupCode.length !== 8
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {verifying ? 'Verifying...' : 'Verify'}
              </button>
            </div>
          </div>

          {verifyMessage && (
            <div className={`p-4 rounded-lg ${
              verifyMessage.type === 'success'
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}>
              <p className={verifyMessage.type === 'success' ? 'text-green-700' : 'text-red-700'}>
                {verifyMessage.text}
              </p>
            </div>
          )}
        </form>
      </div>

      {/* Pending Pickups List */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Pending Pickups ({deliveries.length})</h3>
        
        {deliveries.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="mx-auto text-gray-400 mb-2" size={48} />
            <p className="text-gray-600">No pending pickups</p>
          </div>
        ) : (
          <div className="space-y-3">
            {deliveries.map((delivery) => (
              <div key={delivery.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-gray-900">{delivery.recipient_name}</h4>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                        {delivery.pickup_code}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{delivery.recipient_phone}</p>
                    {delivery.is_cod && (
                      <p className="text-sm font-semibold text-orange-600">
                        COD: KES {delivery.cod_amount}
                      </p>
                    )}
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    Arrived: {new Date(delivery.arrived_at_hub).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HubDashboard;
