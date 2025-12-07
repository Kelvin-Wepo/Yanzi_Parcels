import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { 
  ArrowLeft, 
  MapPin, 
  User, 
  Phone, 
  Package,
  DollarSign,
  Navigation,
  Clock,
  CheckCircle
} from 'lucide-react'
import { courierAPI } from '../../services/api'

export default function AvailableJobDetail() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)

  useEffect(() => {
    loadJob()
  }, [jobId])

  const loadJob = async () => {
    try {
      const response = await courierAPI.getAvailableJob(jobId)
      setJob(response.data)
    } catch (error) {
      toast.error('Job not found or already taken')
      navigate('/courier/available-jobs')
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async () => {
    if (!confirm('Accept this job? You will need to pick up and deliver the package.')) return

    setAccepting(true)
    try {
      await courierAPI.acceptJob(jobId)
      toast.success('Job accepted! Head to the pickup location.')
      navigate('/courier/current-job')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to accept job')
    } finally {
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  if (!job) return null

  const earnings = Math.round(job.price * 0.8)

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Back
      </button>

      {/* Job Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-start gap-4">
          {job.photo && (
            <img
              src={job.photo}
              alt={job.name}
              className="w-24 h-24 object-cover rounded-lg"
            />
          )}
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-800">{job.name}</h1>
            <p className="text-gray-500">{job.description}</p>
            <div className="mt-2 flex items-center gap-3 text-sm">
              <span className="px-2 py-1 bg-gray-100 rounded">
                {job.size_display}
              </span>
              <span>Qty: {job.quantity}</span>
              {job.category && (
                <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded">
                  {job.category.name}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Earnings Card */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-sm p-6 mb-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-green-100 text-sm">Your Earnings (80%)</p>
            <p className="text-4xl font-bold">KSh {earnings.toLocaleString()}</p>
          </div>
          <DollarSign className="w-16 h-16 text-green-300" />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Navigation className="w-5 h-5" />
            <span>{job.distance} km</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            <span>~{job.duration} min</span>
          </div>
        </div>
      </div>

      {/* Pickup & Delivery */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Route</h2>
        
        <div className="space-y-6">
          {/* Pickup */}
          <div className="relative pl-8">
            <div className="absolute left-0 top-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
              <MapPin className="w-4 h-4 text-green-600" />
            </div>
            <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-gray-200" />
            
            <div>
              <p className="text-sm font-medium text-green-600">PICKUP</p>
              <p className="font-medium text-gray-800 mt-1">{job.pickup_address}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {job.pickup_name}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  {job.pickup_phone}
                </span>
              </div>
            </div>
          </div>

          {/* Delivery */}
          <div className="relative pl-8">
            <div className="absolute left-0 top-0 w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
              <MapPin className="w-4 h-4 text-red-600" />
            </div>
            
            <div>
              <p className="text-sm font-medium text-red-600">DELIVERY</p>
              <p className="font-medium text-gray-800 mt-1">{job.delivery_address}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {job.delivery_name}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  {job.delivery_phone}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Info */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Customer</h2>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <p className="font-medium text-gray-800">{job.customer_name}</p>
            <p className="text-sm text-gray-500">Customer</p>
          </div>
        </div>
      </div>

      {/* Accept Button */}
      <button
        onClick={handleAccept}
        disabled={accepting}
        className="w-full py-4 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition disabled:opacity-50 flex items-center justify-center gap-2 text-lg"
      >
        <CheckCircle className="w-6 h-6" />
        {accepting ? 'Accepting...' : `Accept Job - Earn KSh ${earnings.toLocaleString()}`}
      </button>
    </div>
  )
}
