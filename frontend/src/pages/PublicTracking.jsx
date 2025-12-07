import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Package, MapPin, Clock, Check, Truck, 
  User, Phone, AlertCircle 
} from 'lucide-react';
import { publicAPI } from '../services/api';

const STATUS_CONFIG = {
  creating: { 
    label: 'Order Created', 
    color: 'bg-gray-500',
    icon: Package,
    step: 1
  },
  processing: { 
    label: 'Processing', 
    color: 'bg-blue-500',
    icon: Clock,
    step: 2
  },
  picking: { 
    label: 'Courier Picking Up', 
    color: 'bg-amber-500',
    icon: Truck,
    step: 3
  },
  delivering: { 
    label: 'Out for Delivery', 
    color: 'bg-purple-500',
    icon: Truck,
    step: 4
  },
  completed: { 
    label: 'Delivered', 
    color: 'bg-green-500',
    icon: Check,
    step: 5
  },
  cancelled: { 
    label: 'Cancelled', 
    color: 'bg-red-500',
    icon: AlertCircle,
    step: 0
  },
};

export default function PublicTracking() {
  const { shortCode } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTrackingData();
  }, [shortCode]);

  const fetchTrackingData = async () => {
    try {
      setLoading(true);
      const response = await publicAPI.getTracking(shortCode);
      setJob(response.data);
      setError(null);
    } catch (err) {
      setError('Tracking information not found');
      setJob(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tracking information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Tracking Not Found</h1>
          <p className="text-gray-600 mb-6">
            We couldn't find any delivery with tracking code: <br />
            <span className="font-mono font-semibold">{shortCode}</span>
          </p>
          <Link 
            to="/"
            className="inline-block px-6 py-3 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[job.status] || STATUS_CONFIG.creating;
  const StatusIcon = statusConfig.icon;
  const currentStep = statusConfig.step;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <Link to="/" className="flex items-center gap-2 mb-6 text-white/80 hover:text-white">
            <Package className="w-6 h-6" />
            <span className="font-bold text-lg">Yanzi Parcels</span>
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm">Tracking Number</p>
              <p className="text-2xl font-bold font-mono">{shortCode}</p>
            </div>
            <div className={`px-4 py-2 rounded-full text-sm font-semibold ${statusConfig.color}`}>
              <div className="flex items-center gap-2">
                <StatusIcon className="w-4 h-4" />
                {statusConfig.label}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Progress Steps */}
        {job.status !== 'cancelled' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-semibold text-gray-800 mb-6">Delivery Progress</h2>
            
            <div className="flex items-center justify-between relative">
              {/* Progress Line */}
              <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200">
                <div 
                  className="h-full bg-amber-500 transition-all duration-500"
                  style={{ width: `${((currentStep - 1) / 4) * 100}%` }}
                />
              </div>

              {/* Steps */}
              {[
                { step: 1, label: 'Created', icon: Package },
                { step: 2, label: 'Processing', icon: Clock },
                { step: 3, label: 'Picking Up', icon: Truck },
                { step: 4, label: 'Delivering', icon: Truck },
                { step: 5, label: 'Delivered', icon: Check },
              ].map(({ step, label, icon: Icon }) => (
                <div key={step} className="relative flex flex-col items-center z-10">
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      step <= currentStep 
                        ? 'bg-amber-500 text-white' 
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-xs mt-2 ${
                    step <= currentStep ? 'text-amber-600 font-medium' : 'text-gray-400'
                  }`}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Package Details */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Package Details</h2>
          
          <div className="flex items-start gap-4">
            {job.photo && (
              <img 
                src={job.photo} 
                alt={job.name}
                className="w-20 h-20 rounded-lg object-cover"
              />
            )}
            <div className="flex-1">
              <h3 className="font-medium text-gray-800">{job.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{job.description}</p>
              <div className="flex gap-3 mt-2">
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  {job.size_display || job.size}
                </span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  Qty: {job.quantity}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Route */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Delivery Route</h2>
          
          <div className="space-y-4">
            {/* Pickup */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-green-600 font-medium uppercase">Pickup</p>
                <p className="text-gray-800">{job.pickup_address}</p>
                <p className="text-sm text-gray-500">{job.pickup_name}</p>
              </div>
            </div>

            {/* Divider */}
            <div className="ml-4 w-px h-8 bg-gray-200" />

            {/* Delivery */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-red-600 font-medium uppercase">Delivery</p>
                <p className="text-gray-800">{job.delivery_address}</p>
                <p className="text-sm text-gray-500">{job.delivery_name}</p>
              </div>
            </div>
          </div>

          {/* Distance & Duration */}
          {(job.distance || job.duration) && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex gap-6">
              {job.distance && (
                <div>
                  <p className="text-xs text-gray-500">Distance</p>
                  <p className="font-semibold text-gray-800">{job.distance} km</p>
                </div>
              )}
              {job.duration && (
                <div>
                  <p className="text-xs text-gray-500">Est. Duration</p>
                  <p className="font-semibold text-gray-800">{job.duration} min</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Courier Info */}
        {job.courier && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Your Courier</h2>
            
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center">
                <User className="w-7 h-7 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-800">{job.courier.name}</p>
                {job.courier.vehicle_type && (
                  <p className="text-sm text-gray-500">
                    {job.courier.vehicle_type} • {job.courier.plate_number}
                  </p>
                )}
              </div>
              {job.courier.phone && (
                <a 
                  href={`tel:${job.courier.phone}`}
                  className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 hover:bg-green-200 transition"
                >
                  <Phone className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Delivery Photos */}
        {(job.pickup_photo || job.delivery_photo) && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Delivery Photos</h2>
            
            <div className="grid grid-cols-2 gap-4">
              {job.pickup_photo && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">Pickup Confirmation</p>
                  <img 
                    src={job.pickup_photo} 
                    alt="Pickup" 
                    className="w-full h-32 object-cover rounded-lg"
                  />
                </div>
              )}
              {job.delivery_photo && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">Delivery Confirmation</p>
                  <img 
                    src={job.delivery_photo} 
                    alt="Delivery" 
                    className="w-full h-32 object-cover rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-6">
          <p className="text-gray-500 text-sm">
            Need help? Contact us at support@yanzi.co.ke
          </p>
          <Link 
            to="/"
            className="text-amber-600 font-medium text-sm hover:underline mt-2 inline-block"
          >
            Visit Yanzi Parcels →
          </Link>
        </div>
      </div>
    </div>
  );
}
