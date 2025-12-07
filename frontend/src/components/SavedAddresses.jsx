import { useState, useEffect } from 'react';
import { Home, MapPin, Briefcase, Plus, Edit2, Trash2, Star, Check, X } from 'lucide-react';
import { addressesAPI } from '../services/api';
import { toast } from 'react-hot-toast';

const ADDRESS_TYPES = [
  { value: 'home', label: 'Home', icon: Home, color: 'bg-blue-100 text-blue-600' },
  { value: 'office', label: 'Office', icon: Briefcase, color: 'bg-purple-100 text-purple-600' },
  { value: 'other', label: 'Other', icon: MapPin, color: 'bg-gray-100 text-gray-600' },
];

export default function SavedAddresses() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    address_type: 'other',
    label: '',
    address: '',
    lat: -1.2921,
    lng: 36.8219,
  });

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const response = await addressesAPI.getSavedAddresses();
      setAddresses(response.data || []);
    } catch (error) {
      console.error('Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.address.trim()) {
      toast.error('Please enter an address');
      return;
    }

    setSaving(true);
    try {
      if (editingAddress) {
        await addressesAPI.updateSavedAddress(editingAddress.id, formData);
        toast.success('Address updated');
      } else {
        await addressesAPI.createSavedAddress(formData);
        toast.success('Address saved');
      }
      fetchAddresses();
      resetForm();
    } catch (error) {
      toast.error('Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (addressId) => {
    if (!confirm('Delete this address?')) return;
    try {
      await addressesAPI.deleteSavedAddress(addressId);
      toast.success('Address deleted');
      fetchAddresses();
    } catch (error) {
      toast.error('Failed to delete address');
    }
  };

  const handleSetDefault = async (addressId) => {
    try {
      await addressesAPI.useAddress(addressId);
      toast.success('Default address updated');
      fetchAddresses();
    } catch (error) {
      toast.error('Failed to set default');
    }
  };

  const handleEdit = (address) => {
    setEditingAddress(address);
    setFormData({
      address_type: address.address_type || 'other',
      label: address.label || '',
      address: address.address || '',
      lat: address.lat || -1.2921,
      lng: address.lng || 36.8219,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingAddress(null);
    setFormData({
      address_type: 'other',
      label: '',
      address: '',
      lat: -1.2921,
      lng: 36.8219,
    });
  };

  const getTypeConfig = (type) => {
    return ADDRESS_TYPES.find(t => t.value === type) || ADDRESS_TYPES[2];
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-100 rounded-xl h-24" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-amber-400 hover:text-amber-600 transition flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add New Address
        </button>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">
              {editingAddress ? 'Edit Address' : 'New Address'}
            </h3>
            <button onClick={resetForm} className="p-1 hover:bg-gray-100 rounded">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Address type selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <div className="flex gap-2">
                {ADDRESS_TYPES.map(({ value, label, icon: Icon, color }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFormData({ ...formData, address_type: value })}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition ${
                      formData.address_type === value
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom label */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Label Name
              </label>
              <input
                type="text"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="e.g., Home, Office, Mum's Place, Gym"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address *
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter full address"
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none resize-none"
                required
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-3 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    {editingAddress ? 'Update' : 'Save'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Addresses list */}
      {addresses.length === 0 && !showForm ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No saved addresses yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Save your frequently used addresses for quick selection
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((address) => {
            const typeConfig = getTypeConfig(address.address_type);
            const Icon = typeConfig.icon;
            
            return (
              <div
                key={address.id}
                className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${typeConfig.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800 capitalize">
                        {address.label || typeConfig.label}
                      </span>
                      {(address.is_default_pickup || address.is_default_delivery) && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Star className="w-3 h-3 fill-green-500" />
                          {address.is_default_pickup && address.is_default_delivery ? 'Default' : 
                           address.is_default_pickup ? 'Pickup' : 'Delivery'}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {address.address}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(address)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4 text-gray-400" />
                    </button>
                    <button
                      onClick={() => handleDelete(address.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
