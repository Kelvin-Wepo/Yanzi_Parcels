import { useState, useEffect } from 'react';
import { Calendar, Plus, Pause, Play, Trash2, Clock, RefreshCw, X, Check } from 'lucide-react';
import { scheduledAPI } from '../services/api';
import { toast } from 'react-hot-toast';

const FREQUENCIES = [
  { value: 'daily', label: 'Daily', description: 'Every day' },
  { value: 'weekly', label: 'Weekly', description: 'Once a week' },
  { value: 'biweekly', label: 'Bi-weekly', description: 'Every 2 weeks' },
  { value: 'monthly', label: 'Monthly', description: 'Once a month' },
];

export default function ScheduledDeliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const fetchDeliveries = async () => {
    try {
      const response = await scheduledAPI.getScheduledDeliveries();
      setDeliveries(response.data || []);
    } catch (error) {
      console.error('Failed to load scheduled deliveries');
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async (id, isActive) => {
    try {
      if (isActive) {
        await scheduledAPI.pauseScheduledDelivery(id);
      } else {
        await scheduledAPI.resumeScheduledDelivery(id);
      }
      toast.success('Schedule updated');
      fetchDeliveries();
    } catch (error) {
      toast.error('Failed to update schedule');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this scheduled delivery?')) return;
    try {
      await scheduledAPI.deleteScheduledDelivery(id);
      toast.success('Schedule deleted');
      fetchDeliveries();
    } catch (error) {
      toast.error('Failed to delete schedule');
    }
  };

  const formatNextRun = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = date - now;
    
    if (diff < 0) return 'Overdue';
    if (diff < 86400000) return 'Today';
    if (diff < 172800000) return 'Tomorrow';
    
    return date.toLocaleDateString('en-KE', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="bg-gray-100 rounded-xl h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800">Scheduled Deliveries</p>
            <p className="text-xs text-blue-600 mt-1">
              Set up recurring deliveries to automatically create jobs on your schedule.
              Great for regular supplies, subscriptions, or routine shipments.
            </p>
          </div>
        </div>
      </div>

      {/* Deliveries List */}
      {deliveries.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No scheduled deliveries</p>
          <p className="text-sm text-gray-400 mt-1">
            Create a delivery first, then you can schedule it to repeat
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {deliveries.map((delivery) => (
            <div
              key={delivery.id}
              className={`bg-white rounded-xl border p-4 shadow-sm ${
                delivery.is_active ? 'border-gray-100' : 'border-gray-200 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    delivery.is_active ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    <RefreshCw className={`w-5 h-5 ${
                      delivery.is_active ? 'text-green-600' : 'text-gray-400'
                    }`} />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">
                      {delivery.template_job?.name || 'Scheduled Delivery'}
                    </h4>
                    <p className="text-xs text-gray-500 capitalize">
                      {FREQUENCIES.find(f => f.value === delivery.frequency)?.label || delivery.frequency}
                    </p>
                  </div>
                </div>
                
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  delivery.is_active 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {delivery.is_active ? 'Active' : 'Paused'}
                </div>
              </div>

              {/* Route Preview */}
              <div className="text-sm text-gray-500 mb-3">
                <p className="truncate">
                  📍 {delivery.template_job?.pickup_address?.split(',')[0] || 'Pickup'} → {' '}
                  {delivery.template_job?.delivery_address?.split(',')[0] || 'Delivery'}
                </p>
              </div>

              {/* Next Run */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500">Next run:</span>
                  <span className="font-medium text-gray-800">
                    {formatNextRun(delivery.next_run)}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handlePause(delivery.id, delivery.is_active)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                    title={delivery.is_active ? 'Pause' : 'Resume'}
                  >
                    {delivery.is_active ? (
                      <Pause className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Play className="w-4 h-4 text-green-500" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(delivery.id)}
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

      {/* How to Create */}
      <div className="bg-gray-50 rounded-xl p-4">
        <h4 className="font-medium text-gray-700 mb-2">How to create a schedule</h4>
        <ol className="text-sm text-gray-600 space-y-1">
          <li>1. Complete a delivery first</li>
          <li>2. Open the completed delivery details</li>
          <li>3. Tap "Schedule this delivery" to set up recurring runs</li>
        </ol>
      </div>
    </div>
  );
}
