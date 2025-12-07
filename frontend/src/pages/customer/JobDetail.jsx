import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { 
  ArrowLeft, 
  MapPin, 
  User, 
  Phone, 
  Clock,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Camera,
  Star,
  RefreshCw
} from 'lucide-react'
import { customerAPI, trackingAPI, reorderAPI } from '../../services/api'
import CourierMap from '../../components/CourierMap'
import ChatButton from '../../components/ChatButton'
import RatingModal from '../../components/RatingModal'
import ShareTracking from '../../components/ShareTracking'

const STATUS_STEPS = [
  { status: 'processing', label: 'Processing', icon: Clock },
  { status: 'picking', label: 'Picking Up', icon: Package },
  { status: 'delivering', label: 'Delivering', icon: Truck },
  { status: 'completed', label: 'Completed', icon: CheckCircle },
]

export default function JobDetail() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [locationData, setLocationData] = useState(null)
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [trackingCode, setTrackingCode] = useState(null)
  const [reordering, setReordering] = useState(false)

  useEffect(() => {
    loadJob()
  }, [jobId])

  // Load job and location data
  useEffect(() => {
    if (job && ['processing', 'picking', 'delivering'].includes(job.status)) {
      loadCourierLocation()
    }
  }, [job?.status])

  const loadJob = async () => {
    try {
      const response = await customerAPI.getJob(jobId)
      setJob(response.data)
      
      // Generate tracking code for sharing
      if (response.data && response.data.status !== 'cancelled') {
        try {
          const trackingResponse = await trackingAPI.createTrackingLink({ job_id: jobId })
          setTrackingCode(trackingResponse.data.short_code)
        } catch (err) {
          console.log('Could not generate tracking code')
        }
      }
    } catch (error) {
      toast.error('Failed to load job')
      navigate('/customer/jobs')
    } finally {
      setLoading(false)
    }
  }

  const loadCourierLocation = useCallback(async () => {
    try {
      const response = await customerAPI.getCourierLocation(jobId)
      setLocationData(response.data)
    } catch (error) {
      console.log('Failed to load courier location')
    }
  }, [jobId])

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this job?')) return

    setCancelling(true)
    try {
      await customerAPI.cancelJob(jobId)
      toast.success('Job cancelled')
      loadJob()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to cancel')
    } finally {
      setCancelling(false)
    }
  }

  const handleReorder = async () => {
    setReordering(true)
    try {
      const response = await reorderAPI.reorder({ job_id: jobId })
      toast.success('New delivery created from this order!')
      navigate(`/customer/jobs/${response.data.new_job_id}`)
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to reorder')
    } finally {
      setReordering(false)
    }
  }

  const handleRatingSubmitted = () => {
    setShowRatingModal(false)
    loadJob()
    toast.success('Thank you for your feedback!')
  }

  const getStatusIndex = (status) => {
    return STATUS_STEPS.findIndex((s) => s.status === status)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    )
  }

  if (!job) return null

  const currentStatusIndex = getStatusIndex(job.status)
  const isCancelled = job.status === 'cancelled'
  const showMap = ['processing', 'picking', 'delivering'].includes(job.status)

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
              <span className="px-2 py-1 bg-gray-100 rounded">{job.size_display}</span>
              <span>Qty: {job.quantity}</span>
              {job.category && (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
                  {job.category.name}
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-bold text-emerald-600">KSh {job.price?.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Status Timeline */}
      {!isCancelled && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Status</h2>
          <div className="flex items-center justify-between">
            {STATUS_STEPS.map((step, index) => {
              const isCompleted = index <= currentStatusIndex
              const isCurrent = index === currentStatusIndex
              const Icon = step.icon

              return (
                <div key={step.status} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-400'
                      } ${isCurrent ? 'ring-4 ring-green-200' : ''}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <p
                      className={`text-xs mt-2 ${
                        isCompleted ? 'text-green-600 font-medium' : 'text-gray-400'
                      }`}
                    >
                      {step.label}
                    </p>
                  </div>
                  {index < STATUS_STEPS.length - 1 && (
                    <div
                      className={`w-12 h-1 mx-1 ${
                        index < currentStatusIndex ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Cancelled Status */}
      {isCancelled && (
        <div className="bg-red-50 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 text-red-700">
            <XCircle className="w-8 h-8" />
            <div>
              <h3 className="font-semibold">Job Cancelled</h3>
              <p className="text-sm">This job has been cancelled</p>
            </div>
          </div>
        </div>
      )}

      {/* Courier Info */}
      {job.courier && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Courier</h2>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="font-medium text-gray-800">
                {job.courier.user?.first_name} {job.courier.user?.last_name}
              </p>
              <p className="text-sm text-gray-500">Your courier</p>
            </div>
          </div>
        </div>
      )}

      {/* Live Tracking Map */}
      {showMap && (
        <div className="mb-6">
          <CourierMap
            pickup={locationData?.pickup || {
              lat: job.pick_lat,
              lng: job.pick_up,
              address: job.pickup_address
            }}
            delivery={locationData?.delivery || {
              lat: job.delivery_lat,
              lng: job.delivery_lng,
              address: job.delivery_address
            }}
            courier={locationData?.courier}
            jobStatus={job.status}
            onRefresh={loadCourierLocation}
            autoRefresh={true}
            refreshInterval={10000}
          />
        </div>
      )}

      {/* Pickup & Delivery */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="space-y-6">
          {/* Pickup */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-green-500" />
              PICKUP
            </h3>
            <p className="font-medium text-gray-800">{job.pickup_address}</p>
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
            {job.pickup_photo && (
              <div className="mt-3">
                <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                  <Camera className="w-3 h-3" />
                  Pickup Photo
                </p>
                <img
                  src={job.pickup_photo}
                  alt="Pickup"
                  className="w-32 h-32 object-cover rounded-lg"
                />
              </div>
            )}
          </div>

          <hr />

          {/* Delivery */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-red-500" />
              DELIVERY
            </h3>
            <p className="font-medium text-gray-800">{job.delivery_address}</p>
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
            {job.delivery_photo && (
              <div className="mt-3">
                <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                  <Camera className="w-3 h-3" />
                  Delivery Photo
                </p>
                <img
                  src={job.delivery_photo}
                  alt="Delivery"
                  className="w-32 h-32 object-cover rounded-lg"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Route Info */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-800">{job.distance}</p>
            <p className="text-sm text-gray-500">km</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">~{job.duration}</p>
            <p className="text-sm text-gray-500">minutes</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-600">KSh {job.price?.toLocaleString()}</p>
            <p className="text-sm text-gray-500">total</p>
          </div>
        </div>
      </div>

      {/* Cancel Button */}
      {job.status === 'processing' && (
        <button
          onClick={handleCancel}
          disabled={cancelling}
          className="w-full py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition disabled:opacity-50"
        >
          {cancelling ? 'Cancelling...' : 'Cancel Job'}
        </button>
      )}

      {/* Share Tracking Link */}
      {trackingCode && !isCancelled && (
        <div className="mb-6">
          <ShareTracking jobId={jobId} trackingCode={trackingCode} />
        </div>
      )}

      {/* Actions for Completed Jobs */}
      {job.status === 'completed' && (
        <div className="space-y-4 mb-6">
          {/* Rate Courier */}
          {!job.rating && (
            <button
              onClick={() => setShowRatingModal(true)}
              className="w-full py-3 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition flex items-center justify-center gap-2"
            >
              <Star className="w-5 h-5" />
              Rate Your Courier
            </button>
          )}
          
          {/* Reorder */}
          <button
            onClick={handleReorder}
            disabled={reordering}
            className="w-full py-3 border-2 border-emerald-500 text-emerald-600 rounded-lg font-medium hover:bg-emerald-50 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${reordering ? 'animate-spin' : ''}`} />
            {reordering ? 'Creating...' : 'Order Again'}
          </button>
        </div>
      )}

      {/* Chat Button - shows during picking and delivering */}
      {['picking', 'delivering'].includes(job.status) && job.courier && (
        <ChatButton jobId={jobId} isCustomer={true} />
      )}

      {/* Rating Modal */}
      {showRatingModal && job.courier && (
        <RatingModal
          jobId={jobId}
          courierId={job.courier.id}
          courierName={`${job.courier.user?.first_name} ${job.courier.user?.last_name}`}
          onClose={() => setShowRatingModal(false)}
          onRated={handleRatingSubmitted}
        />
      )}
    </div>
  )
}
