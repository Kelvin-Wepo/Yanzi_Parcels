import React, { useState, useEffect } from 'react';
import { Menu, LogOut, Home, Package, CreditCard, BarChart3 } from 'lucide-react';
import BusinessDashboard from '../../components/business/BusinessDashboard';
import BulkUploadCSV from '../../components/business/BulkUploadCSV';
import BulkOrdersList from '../../components/business/BulkOrdersList';
import CreditManagement from '../../components/business/CreditManagement';
import businessAPI from '../../services/businessAPI';

const BusinessPortal = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [businessAccount, setBusinessAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBusinessAccount();
  }, []);

  const fetchBusinessAccount = async () => {
    try {
      setLoading(true);
      const response = await businessAPI.getAccounts();
      if (response.data && response.data.length > 0) {
        setBusinessAccount(response.data[0]);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching business account:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading business portal...</p>
        </div>
      </div>
    );
  }

  if (error || !businessAccount) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">
            {error || 'Business account not found. Please create one first.'}
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'bulk-orders', label: 'Bulk Orders', icon: Package },
    { id: 'upload', label: 'Upload CSV', icon: Package },
    { id: 'credits', label: 'Credits', icon: CreditCard },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-gray-900 text-white transition-all duration-300 overflow-hidden`}>
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-xl font-bold">Yanzi B2B</h1>
          <p className="text-gray-400 text-sm mt-1">{businessAccount.business_name}</p>
        </div>

        <nav className="p-4 space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  activeTab === tab.id
                    ? 'bg-blue-600'
                    : 'hover:bg-gray-800'
                }`}
              >
                <Icon size={20} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
          <button
            onClick={() => {
              localStorage.removeItem('auth_token');
              window.location.href = '/';
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-gray-800 rounded-lg transition"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <Menu size={24} />
          </button>
          <div className="text-right">
            <p className="text-sm text-gray-600">Tier: {businessAccount.tier}</p>
            <p className="font-semibold text-gray-900">{businessAccount.contact_email}</p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'dashboard' && (
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h2>
              <BusinessDashboard businessId={businessAccount.id} />
            </div>
          )}

          {activeTab === 'bulk-orders' && (
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Bulk Orders</h2>
              <BulkOrdersList />
            </div>
          )}

          {activeTab === 'upload' && (
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Upload Deliveries</h2>
              <div className="bg-white rounded-lg shadow p-6">
                <BulkUploadCSV onUploadSuccess={() => setActiveTab('bulk-orders')} />
              </div>
            </div>
          )}

          {activeTab === 'credits' && businessAccount.credit_account && (
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Account Credits</h2>
              <CreditManagement creditId={businessAccount.credit_account} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BusinessPortal;
