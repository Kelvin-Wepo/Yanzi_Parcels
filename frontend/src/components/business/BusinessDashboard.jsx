import React, { useState, useEffect } from 'react';
import { TrendingUp, Package, DollarSign, Users } from 'lucide-react';
import businessAPI from '../../services/businessAPI';

const BusinessDashboard = ({ businessId }) => {
  const [dashboard, setDashboard] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, [businessId]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [dashboardRes, analyticsRes] = await Promise.all([
        businessAPI.getDashboard(businessId),
        businessAPI.getAnalytics(businessId)
      ]);
      
      setDashboard(dashboardRes.data);
      setAnalytics(analyticsRes.data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching dashboard:', err);
    } finally {
      setLoading(false);
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
        <p className="text-red-700">Error loading dashboard: {error}</p>
      </div>
    );
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Deliveries</p>
              <p className="text-3xl font-bold text-gray-900">{dashboard?.total_deliveries || 0}</p>
            </div>
            <Package className="text-blue-600" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">This Month</p>
              <p className="text-3xl font-bold text-gray-900">{dashboard?.month_deliveries || 0}</p>
            </div>
            <TrendingUp className="text-green-600" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Spent</p>
              <p className="text-3xl font-bold text-gray-900">KES {dashboard?.total_spent?.toFixed(0) || 0}</p>
            </div>
            <DollarSign className="text-orange-600" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Pending Orders</p>
              <p className="text-3xl font-bold text-gray-900">{dashboard?.pending_orders || 0}</p>
            </div>
            <Users className="text-red-600" size={32} />
          </div>
        </div>
      </div>

      {/* Cost Breakdown */}
      {analytics?.cost_breakdown && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Cost Breakdown</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold">KES {analytics.cost_breakdown.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Discount ({dashboard?.discount_percentage}%)</span>
                <span>-KES {analytics.cost_breakdown.discount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax (16%)</span>
                <span>KES {analytics.cost_breakdown.tax.toFixed(2)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>KES {analytics.cost_breakdown.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Credit Balance */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Account Balance</h3>
            <div className="space-y-4">
              <div>
                <p className="text-gray-600 text-sm">Available Credit</p>
                <p className="text-3xl font-bold text-blue-600">KES {dashboard?.credit_balance?.toFixed(2) || 0}</p>
              </div>
              <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                Add Credit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Routes */}
      {analytics?.top_routes && analytics.top_routes.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Top Delivery Locations</h3>
          <div className="space-y-2">
            {analytics.top_routes.map((route, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="text-gray-700">{route.address}</span>
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                  {route.count} deliveries
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessDashboard;
