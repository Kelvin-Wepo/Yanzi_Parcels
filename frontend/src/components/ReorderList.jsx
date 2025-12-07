import { useState, useEffect } from 'react';
import { RefreshCw, Package, MapPin, Clock, ArrowRight } from 'lucide-react';
import { customerAPI, reorderAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

export default function ReorderList() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reorderingId, setReorderingId] = useState(null);

  useEffect(() => {
    fetchCompletedJobs();
  }, []);

  const fetchCompletedJobs = async () => {
    try {
      const response = await customerAPI.getJobs('archived');
      setJobs(response.data || []);
    } catch (error) {
      console.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleReorder = async (jobId) => {
    setReorderingId(jobId);
    try {
      const response = await reorderAPI.reorder({ job_id: jobId });
      toast.success('New delivery created!');
      navigate(`/customer/jobs/${response.data.new_job_id}`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to reorder');
    } finally {
      setReorderingId(null);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-100 rounded-xl h-28" />
        ))}
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
        <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No completed deliveries yet</p>
        <p className="text-sm text-gray-400 mt-1">
          Your completed deliveries will appear here for quick reordering
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Tap to quickly create a new delivery with the same details
      </p>

      <div className="space-y-3">
        {jobs.slice(0, 10).map((job) => (
          <div
            key={job.id}
            className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition"
          >
            <div className="flex items-start gap-4">
              {job.photo ? (
                <img
                  src={job.photo}
                  alt={job.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              ) : (
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Package className="w-8 h-8 text-gray-400" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-800 truncate">{job.name}</h4>
                
                <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">
                    {job.pickup_address?.split(',')[0]} → {job.delivery_address?.split(',')[0]}
                  </span>
                </div>
                
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(job.created_at).toLocaleDateString()}
                  </span>
                  <span className="font-medium text-emerald-600">
                    KSh {job.price?.toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleReorder(job.id)}
                disabled={reorderingId === job.id}
                className="p-3 bg-amber-100 text-amber-600 rounded-xl hover:bg-amber-200 transition disabled:opacity-50"
              >
                {reorderingId === job.id ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <RefreshCw className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {jobs.length > 10 && (
        <button
          onClick={() => navigate('/customer/jobs?status=archived')}
          className="w-full py-3 text-amber-600 font-medium hover:bg-amber-50 rounded-lg transition flex items-center justify-center gap-2"
        >
          View All {jobs.length} Deliveries
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
