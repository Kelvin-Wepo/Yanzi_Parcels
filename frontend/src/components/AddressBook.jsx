import { useState, useEffect } from 'react';
import { User, Plus, Edit2, Trash2, Phone, Mail, MapPin, Star, X, Check } from 'lucide-react';
import { addressesAPI } from '../services/api';
import { toast } from 'react-hot-toast';

export default function AddressBook() {
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRecipient, setEditingRecipient] = useState(null);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    phone_number: '',
    email: '',
    address: '',
    notes: '',
  });

  useEffect(() => {
    fetchRecipients();
  }, []);

  const fetchRecipients = async () => {
    try {
      const response = await addressesAPI.getRecipients();
      setRecipients(response.data || []);
    } catch (error) {
      console.error('Failed to load recipients');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone_number.trim()) {
      toast.error('Name and phone are required');
      return;
    }

    setSaving(true);
    try {
      if (editingRecipient) {
        await addressesAPI.updateRecipient(editingRecipient.id, formData);
        toast.success('Recipient updated');
      } else {
        await addressesAPI.createRecipient(formData);
        toast.success('Recipient saved');
      }
      fetchRecipients();
      resetForm();
    } catch (error) {
      toast.error('Failed to save recipient');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (recipientId) => {
    if (!confirm('Delete this recipient?')) return;
    try {
      await addressesAPI.deleteRecipient(recipientId);
      toast.success('Recipient deleted');
      fetchRecipients();
    } catch (error) {
      toast.error('Failed to delete recipient');
    }
  };

  const handleSetFavorite = async (recipientId) => {
    try {
      await addressesAPI.toggleFavoriteRecipient(recipientId);
      toast.success('Favorite updated');
      fetchRecipients();
    } catch (error) {
      toast.error('Failed to update favorite');
    }
  };

  const handleEdit = (recipient) => {
    setEditingRecipient(recipient);
    setFormData({
      name: recipient.name || '',
      phone_number: recipient.phone_number || '',
      email: recipient.email || '',
      address: recipient.address || '',
      notes: recipient.notes || '',
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingRecipient(null);
    setFormData({
      name: '',
      phone_number: '',
      email: '',
      address: '',
      notes: '',
    });
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
          Add New Recipient
        </button>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">
              {editingRecipient ? 'Edit Recipient' : 'New Recipient'}
            </h3>
            <button onClick={resetForm} className="p-1 hover:bg-gray-100 rounded">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Full name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone *
                </label>
                <input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  placeholder="0712 345 678"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email (optional)
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address (optional)
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Default delivery address"
                rows={2}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (optional)
              </label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="e.g., Call before delivery"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
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
                    {editingRecipient ? 'Update' : 'Save'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Recipients list */}
      {recipients.length === 0 && !showForm ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No saved recipients yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Save frequently used recipients for quick selection
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {recipients.map((recipient) => (
            <div
              key={recipient.id}
              className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <User className="w-6 h-6 text-amber-600" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800">
                      {recipient.name}
                    </span>
                    {recipient.is_favorite && (
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    )}
                    {recipient.delivery_count > 0 && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                        {recipient.delivery_count} deliveries
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {recipient.phone_number}
                    </span>
                    {recipient.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {recipient.email}
                      </span>
                    )}
                  </div>
                  {recipient.address && (
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {recipient.address}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleSetFavorite(recipient.id)}
                    className={`p-2 rounded-lg transition ${
                      recipient.is_favorite 
                        ? 'bg-amber-50 text-amber-500' 
                        : 'hover:bg-gray-100 text-gray-400'
                    }`}
                    title={recipient.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Star className={`w-4 h-4 ${recipient.is_favorite ? 'fill-amber-500' : ''}`} />
                  </button>
                  <button
                    onClick={() => handleEdit(recipient)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4 text-gray-400" />
                  </button>
                  <button
                    onClick={() => handleDelete(recipient.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
