import { useState } from 'react';
import { 
  MapPin, Users, Calendar, Gift, CreditCard, 
  RefreshCw, Settings, ChevronRight, Shield,
  Home, Briefcase
} from 'lucide-react';

import SavedAddresses from '../../components/SavedAddresses';
import AddressBook from '../../components/AddressBook';
import ScheduledDeliveries from '../../components/ScheduledDeliveries';
import ReferralProgram from '../../components/ReferralProgram';
import WalletCard from '../../components/WalletCard';
import ReorderList from '../../components/ReorderList';

const MENU_ITEMS = [
  {
    id: 'addresses',
    label: 'Saved Addresses',
    description: 'Home, Office & favorite locations',
    icon: MapPin,
    color: 'bg-blue-100 text-blue-600',
  },
  {
    id: 'recipients',
    label: 'Address Book',
    description: 'Frequent recipients & contacts',
    icon: Users,
    color: 'bg-purple-100 text-purple-600',
  },
  {
    id: 'scheduled',
    label: 'Scheduled Deliveries',
    description: 'Set up recurring deliveries',
    icon: Calendar,
    color: 'bg-green-100 text-green-600',
  },
  {
    id: 'reorder',
    label: 'Quick Reorder',
    description: 'Repeat previous deliveries',
    icon: RefreshCw,
    color: 'bg-amber-100 text-amber-600',
  },
  {
    id: 'wallet',
    label: 'Wallet & Credits',
    description: 'Balance, rewards & transactions',
    icon: CreditCard,
    color: 'bg-emerald-100 text-emerald-600',
  },
  {
    id: 'referral',
    label: 'Refer & Earn',
    description: 'Get KSh 100 for each friend',
    icon: Gift,
    color: 'bg-red-100 text-red-600',
  },
];

export default function More() {
  const [activeSection, setActiveSection] = useState(null);

  const renderContent = () => {
    switch (activeSection) {
      case 'addresses':
        return <SavedAddresses />;
      case 'recipients':
        return <AddressBook />;
      case 'scheduled':
        return <ScheduledDeliveries />;
      case 'reorder':
        return <ReorderList />;
      case 'wallet':
        return (
          <div className="space-y-6">
            <WalletCard />
          </div>
        );
      case 'referral':
        return <ReferralProgram />;
      default:
        return null;
    }
  };

  if (activeSection) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
          <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
            <button
              onClick={() => setActiveSection(null)}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition"
            >
              ←
            </button>
            <h1 className="text-xl font-semibold text-gray-800">
              {MENU_ITEMS.find(item => item.id === activeSection)?.label}
            </h1>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-lg mx-auto px-4 py-6">
          {renderContent()}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white">
        <div className="max-w-lg mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold">More Features</h1>
          <p className="text-amber-100 mt-1">
            Addresses, schedules, rewards & more
          </p>
        </div>
      </div>

      {/* Quick Wallet Preview */}
      <div className="max-w-lg mx-auto px-4 -mt-4 relative z-10">
        <WalletCard />
      </div>

      {/* Menu Items */}
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className="w-full px-4 py-4 flex items-center gap-4 hover:bg-gray-50 transition text-left"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.color}`}>
                  <Icon className="text-xl" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-800">{item.label}</h3>
                  <p className="text-sm text-gray-500">{item.description}</p>
                </div>
                <ChevronRight className="text-gray-400" />
              </button>
            );
          })}
        </div>

        {/* Insurance Info */}
        <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Shield className="text-purple-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-800">Delivery Insurance</h4>
              <p className="text-sm text-gray-600 mt-1">
                Protect your valuable items with our optional insurance coverage. 
                Available when creating a new delivery.
              </p>
            </div>
          </div>
        </div>

        {/* Coming Soon */}
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-500 mb-3 px-1">Coming Soon</h3>
          <div className="bg-white rounded-xl border border-gray-100 p-4 opacity-60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                <Briefcase className="text-gray-400" />
              </div>
              <div>
                <h4 className="font-medium text-gray-600">Business Dashboard</h4>
                <p className="text-sm text-gray-400">For e-commerce & bulk deliveries</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
