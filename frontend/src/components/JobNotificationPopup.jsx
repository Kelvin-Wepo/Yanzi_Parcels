import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { 
  X, 
  MapPin, 
  Navigation, 
  Clock, 
  Package,
  DollarSign,
  CheckCircle,
  XCircle,
  Truck
} from 'lucide-react'
import { courierAPI } from '../services/api'

export default function JobNotificationPopup({ job, onClose, onAccepted }) {
  const navigate = useNavigate()
  const [accepting, setAccepting] = useState(false)
  const [timeLeft, setTimeLeft] = useState(60) // 60 seconds to respond

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      onClose()
      return
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft, onClose])

  const handleAccept = async () => {
    setAccepting(true)
    try {
      await courierAPI.acceptJob(job.job_id)
      toast.success('Job accepted! Starting delivery...')
      onAccepted?.()
      onClose()
      navigate('/courier/current-job')
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to accept job'
      toast.error(errorMsg)
      setAccepting(false)
    }
  }

  const handleViewDetails = () => {
    onClose()
    navigate(`/courier/available-jobs/${job.job_id}`)
  }

  const handleDecline = () => {
    toast('Job declined', { icon: '👋' })
    onClose()
  }

  // Calculate courier earnings (80% of price)
  const earnings = parseFloat(job.price) * 0.8

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        {/* Header with countdown */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">New Job Available!</h3>
                <p className="text-white/80 text-sm">Respond within {timeLeft}s</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
          
          {/* Progress bar */}
          <div className="mt-3 h-1 bg-white/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white transition-all duration-1000 ease-linear"
              style={{ width: `${(timeLeft / 60) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Job Title */}
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Package className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-lg">{job.name}</h4>
              {job.description && (
                <p className="text-gray-400 text-sm mt-0.5">{job.description}</p>
              )}
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 bg-gray-700 rounded text-xs text-gray-300 capitalize">
                  {job.size}
                </span>
                <span className="text-gray-500 text-xs">Qty: {job.quantity}</span>
              </div>
            </div>
          </div>

          {/* Route Info */}
          <div className="bg-gray-700/50 rounded-xl p-4 space-y-3">
            {/* Pickup */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <MapPin className="w-4 h-4 text-green-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Pickup</p>
                <p className="text-white text-sm font-medium truncate">{job.pickup_address}</p>
              </div>
            </div>

            {/* Dotted line connector */}
            <div className="ml-4 border-l-2 border-dashed border-gray-600 h-3" />

            {/* Delivery */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <MapPin className="w-4 h-4 text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Delivery</p>
                <p className="text-white text-sm font-medium truncate">{job.delivery_address}</p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-700/50 rounded-xl p-3 text-center">
              <Navigation className="w-5 h-5 text-blue-400 mx-auto mb-1" />
              <p className="text-xl font-bold text-white">{job.distance}</p>
              <p className="text-xs text-gray-400">km</p>
            </div>
            <div className="bg-gray-700/50 rounded-xl p-3 text-center">
              <Clock className="w-5 h-5 text-purple-400 mx-auto mb-1" />
              <p className="text-xl font-bold text-white">~{job.duration}</p>
              <p className="text-xs text-gray-400">mins</p>
            </div>
            <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl p-3 text-center border border-amber-500/30">
              <DollarSign className="w-5 h-5 text-amber-400 mx-auto mb-1" />
              <p className="text-xl font-bold text-amber-400">KSh {earnings.toLocaleString()}</p>
              <p className="text-xs text-gray-400">earnings</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-5 pt-0 space-y-3">
          <button
            onClick={handleAccept}
            disabled={accepting}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {accepting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Accepting...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Accept Job
              </>
            )}
          </button>

          <div className="flex gap-3">
            <button
              onClick={handleViewDetails}
              className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-xl transition"
            >
              View Details
            </button>
            <button
              onClick={handleDecline}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-700 hover:bg-red-500/20 text-gray-300 hover:text-red-400 font-medium rounded-xl transition"
            >
              <XCircle className="w-4 h-4" />
              Decline
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
