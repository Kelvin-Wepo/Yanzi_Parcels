import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { 
  MapPin, 
  User, 
  Phone, 
  Camera,
  Navigation,
  Package,
  Truck,
  CheckCircle,
  X,
  Clock,
  DollarSign,
  Route,
  ExternalLink,
  MessageCircle,
  AlertCircle
} from 'lucide-react'
import { courierAPI } from '../../services/api'
import ChatButton from '../../components/ChatButton'

export default function CurrentJob() {
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [photoType, setPhotoType] = useState(null) // 'pickup' or 'delivery'
  const fileInputRef = useRef(null)

  useEffect(() => {
    loadCurrentJob()
  }, [])

  const loadCurrentJob = async () => {
    try {
      const response = await courierAPI.getCurrentJob()
      setJob(response.data)
    } catch (error) {
      toast.error('Failed to load current job')
    } finally {
      setLoading(false)
    }
  }

  const handleTakePhoto = (type) => {
    setPhotoType(type)
    fileInputRef.current?.click()
  }

  const handlePhotoCapture = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true)

    try {
      const data = {}
      if (photoType === 'pickup') {
        data.pickup_photo = file
      } else {
        data.delivery_photo = file
      }

      await courierAPI.updateCurrentJob(job.id, data)
      
      if (photoType === 'pickup') {
        toast.success('Pickup confirmed! Head to delivery location.')
      } else {
        toast.success('Delivery completed! Great job!')
        navigate('/courier/available-jobs')
        return
      }
      
      loadCurrentJob()
    } catch (error) {
      toast.error('Failed to upload photo')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-teal-200 border-t-teal-500 animate-spin" />
          <p className="text-gray-400 text-sm">Loading job details...</p>
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="w-24 h-24 bg-slate-800 rounded-3xl flex items-center justify-center mb-6 border border-slate-700">
          <Truck className="w-12 h-12 text-slate-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">No Active Delivery</h2>
        <p className="text-gray-400 mb-8 max-w-sm">
          You don't have any active delivery right now. Browse available jobs to start earning!
        </p>
        <button
          onClick={() => navigate('/courier/available-jobs')}
          className="px-8 py-3.5 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-teal-500/25 transition-all hover:-translate-y-0.5"
        >
          Browse Available Jobs
        </button>
      </div>
    )
  }

  const isPicking = job.status === 'picking'
  const isDelivering = job.status === 'delivering'
  const progress = isPicking ? 50 : isDelivering ? 75 : 100

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        capture="environment"
        onChange={handlePhotoCapture}
        className="hidden"
      />

      {/* Status Banner */}
      <div className={`rounded-2xl p-6 relative overflow-hidden ${
        isPicking 
          ? 'bg-gradient-to-br from-amber-500 to-orange-600' 
          : 'bg-gradient-to-br from-teal-500 to-cyan-600'
      }`}>
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16" />
        
        <div className="relative flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
            {isPicking ? (
              <Package className="w-8 h-8 text-white" />
            ) : (
              <Truck className="w-8 h-8 text-white" />
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white">
              {isPicking ? 'Pick Up Package' : 'Deliver Package'}
            </h2>
            <p className="text-white/80 text-sm mt-1">
              {isPicking 
                ? 'Head to the pickup location and collect the package'
                : 'Deliver the package to the recipient'
              }
            </p>
          </div>
          <div className="hidden sm:block text-right">
            <p className="text-white/70 text-xs uppercase tracking-wide">Earning</p>
            <p className="text-2xl font-bold text-white">KSh {Math.round(job.price * 0.8).toLocaleString()}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between text-xs text-white/70 mb-2">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
        <div className="flex items-center justify-between">
          {/* Step 1: Accepted */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg shadow-green-500/25">
              <CheckCircle className="w-6 h-6" />
            </div>
            <span className="text-xs text-gray-400">Accepted</span>
          </div>

          {/* Connector */}
          <div className={`flex-1 h-1 mx-3 rounded-full ${isDelivering || isPicking ? 'bg-green-500' : 'bg-slate-700'}`} />

          {/* Step 2: Picked Up */}
          <div className="flex flex-col items-center gap-2">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isDelivering 
                ? 'bg-green-500 text-white shadow-lg shadow-green-500/25' 
                : isPicking 
                  ? 'bg-amber-500 text-white animate-pulse shadow-lg shadow-amber-500/25' 
                  : 'bg-slate-700 text-slate-400'
            }`}>
              {isDelivering ? <CheckCircle className="w-6 h-6" /> : <Package className="w-6 h-6" />}
            </div>
            <span className="text-xs text-gray-400">Picked Up</span>
          </div>

          {/* Connector */}
          <div className={`flex-1 h-1 mx-3 rounded-full ${isDelivering ? 'bg-teal-500' : 'bg-slate-700'}`} />

          {/* Step 3: Delivered */}
          <div className="flex flex-col items-center gap-2">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isDelivering 
                ? 'bg-teal-500 text-white animate-pulse shadow-lg shadow-teal-500/25' 
                : 'bg-slate-700 text-slate-400'
            }`}>
              <Truck className="w-6 h-6" />
            </div>
            <span className="text-xs text-gray-400">Delivered</span>
          </div>
        </div>
      </div>

      {/* Job Info Card */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
        <div className="p-5 border-b border-slate-700">
          <div className="flex items-start gap-4">
            {job.photo ? (
              <img
                src={job.photo}
                alt={job.name}
                className="w-20 h-20 object-cover rounded-xl"
              />
            ) : (
              <div className="w-20 h-20 bg-slate-700 rounded-xl flex items-center justify-center">
                <Package className="w-8 h-8 text-slate-500" />
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-white text-lg">{job.name}</h3>
              <p className="text-sm text-gray-400 mt-1">{job.description}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 bg-slate-700 text-gray-300 rounded-lg text-sm">
                  {job.size_display}
                </span>
                <span className="px-3 py-1 bg-slate-700 text-gray-300 rounded-lg text-sm">
                  Qty: {job.quantity}
                </span>
                <span className="flex items-center gap-1 px-3 py-1 bg-slate-700 text-gray-300 rounded-lg text-sm">
                  <Route className="w-3.5 h-3.5" />
                  {job.distance} km
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Current Destination */}
        <div className={`p-5 ${isPicking ? 'bg-amber-500/10' : 'bg-teal-500/10'}`}>
          <div className="flex items-center gap-2 mb-4">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isPicking ? 'bg-amber-500' : 'bg-teal-500'
            }`}>
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <span className={`font-semibold ${isPicking ? 'text-amber-400' : 'text-teal-400'}`}>
              {isPicking ? 'Pickup Location' : 'Delivery Location'}
            </span>
            <span className={`ml-auto px-2 py-0.5 rounded text-xs font-medium ${
              isPicking ? 'bg-amber-500/20 text-amber-400' : 'bg-teal-500/20 text-teal-400'
            }`}>
              CURRENT
            </span>
          </div>
          
          <p className="text-white text-lg font-medium mb-3">
            {isPicking ? job.pickup_address : job.delivery_address}
          </p>
          
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex items-center gap-2 text-gray-300">
              <User className="w-4 h-4 text-gray-500" />
              <span>{isPicking ? job.pickup_name : job.delivery_name}</span>
            </div>
            <a
              href={`tel:${isPicking ? job.pickup_phone : job.delivery_phone}`}
              className="flex items-center gap-2 text-teal-400 hover:text-teal-300 transition-colors"
            >
              <Phone className="w-4 h-4" />
              {isPicking ? job.pickup_phone : job.delivery_phone}
            </a>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                isPicking ? job.pickup_address : job.delivery_address
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 bg-slate-700 text-white rounded-xl font-medium hover:bg-slate-600 transition flex items-center justify-center gap-2"
            >
              <Navigation className="w-5 h-5" />
              Open Maps
              <ExternalLink className="w-4 h-4 text-gray-400" />
            </a>
            <a
              href={`tel:${isPicking ? job.pickup_phone : job.delivery_phone}`}
              className="flex-1 py-3 border border-slate-600 text-white rounded-xl font-medium hover:bg-slate-700/50 transition flex items-center justify-center gap-2"
            >
              <Phone className="w-5 h-5" />
              Call {isPicking ? 'Sender' : 'Recipient'}
            </a>
          </div>
        </div>
      </div>

      {/* Pickup Photo (if already taken) */}
      {job.pickup_photo && (
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5">
          <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Pickup Photo Confirmed
          </h3>
          <img
            src={job.pickup_photo}
            alt="Pickup"
            className="w-full max-h-48 object-cover rounded-xl"
          />
          <p className="text-sm text-gray-500 mt-3 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Picked up at {new Date(job.pickedup_at).toLocaleString()}
          </p>
        </div>
      )}

      {/* Main Action Button */}
      <button
        onClick={() => handleTakePhoto(isPicking ? 'pickup' : 'delivery')}
        disabled={uploading}
        className={`w-full py-4 text-white rounded-2xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-3 text-lg shadow-lg hover:-translate-y-0.5 ${
          isPicking 
            ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:shadow-amber-500/25' 
            : 'bg-gradient-to-r from-teal-500 to-cyan-600 hover:shadow-teal-500/25'
        }`}
      >
        <Camera className="w-6 h-6" />
        {uploading 
          ? 'Uploading Photo...' 
          : isPicking 
            ? 'Take Pickup Photo & Confirm' 
            : 'Take Delivery Photo & Complete'
        }
      </button>

      {/* Help Text */}
      <p className="text-center text-gray-500 text-sm flex items-center justify-center gap-2">
        <AlertCircle className="w-4 h-4" />
        Need help? Contact support or chat with the customer
      </p>

      {/* Chat Button */}
      {job && <ChatButton jobId={job.id} isCustomer={false} />}
    </div>
  )
}
