import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { 
  Package, 
  MapPin, 
  User, 
  Phone, 
  Camera,
  ArrowRight,
  ArrowLeft,
  CreditCard,
  Check,
  X,
  Truck,
  Scale
} from 'lucide-react'
import { customerAPI, categoriesAPI } from '../../services/api'
import VehicleSelector from '../../components/VehicleSelector'
import { WeightSelector, SizeSelector } from '../../components/ParcelOptions'

const SIZES = [
  { value: 'small', label: 'Small', description: 'Fits in hand', icon: '✋' },
  { value: 'medium', label: 'Medium', description: 'Fits in backpack', icon: '🎒' },
  { value: 'large', label: 'Large', description: 'Needs carrier', icon: '📦' },
  { value: 'extra_large', label: 'Extra Large', description: 'Needs vehicle cargo', icon: '🚛' },
]

export default function CreateJob() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [job, setJob] = useState(null)
  const [categories, setCategories] = useState([])
  
  // Vehicle selection state
  const [vehicleOptions, setVehicleOptions] = useState([])
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [isPeakHour, setIsPeakHour] = useState(false)
  
  const [step1Data, setStep1Data] = useState({
    name: '',
    description: '',
    category: '',
    size: 'medium',
    weight: 'light',
    quantity: 1,
    photo: null,
  })
  
  const [step2Data, setStep2Data] = useState({
    pickup_address: '',
    pick_lat: 0,
    pick_up: 0,
    pickup_name: '',
    pickup_phone: '',
  })
  
  const [step3Data, setStep3Data] = useState({
    delivery_address: '',
    delivery_lat: 0,
    delivery_lng: 0,
    delivery_name: '',
    delivery_phone: '',
  })

  const [photoPreview, setPhotoPreview] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [jobResponse, categoriesResponse] = await Promise.all([
        customerAPI.getCreatingJob(),
        categoriesAPI.getAll(),
      ])
      
      setCategories(categoriesResponse.data)
      
      if (jobResponse.data.job) {
        setJob(jobResponse.data.job)
        setCurrentStep(jobResponse.data.current_step)
        
        // Populate form data from existing job
        const j = jobResponse.data.job
        setStep1Data({
          name: j.name || '',
          description: j.description || '',
          category: j.category?.id || '',
          size: j.size || 'medium',
          quantity: j.quantity || 1,
          photo: null,
        })
        setStep2Data({
          pickup_address: j.pickup_address || '',
          pick_lat: j.pick_lat || 0,
          pick_up: j.pick_up || 0,
          pickup_name: j.pickup_name || '',
          pickup_phone: j.pickup_phone || '',
        })
        setStep3Data({
          delivery_address: j.delivery_address || '',
          delivery_lat: j.delivery_lat || 0,
          delivery_lng: j.delivery_lng || 0,
          delivery_name: j.delivery_name || '',
          delivery_phone: j.delivery_phone || '',
        })
        if (j.photo) {
          setPhotoPreview(j.photo)
        }
      }
    } catch (error) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setStep1Data({ ...step1Data, photo: file })
      setPhotoPreview(URL.createObjectURL(file))
    }
  }

  const handleStep1Submit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await customerAPI.createJobStep({
        step: 1,
        ...step1Data,
      })
      setJob(response.data.job)
      setCurrentStep(2)
      toast.success('Step 1 completed')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleStep2Submit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await customerAPI.createJobStep({
        step: 2,
        ...step2Data,
      })
      setJob(response.data.job)
      setCurrentStep(3)
      toast.success('Step 2 completed')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleStep3Submit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await customerAPI.createJobStep({
        step: 3,
        ...step3Data,
      })
      setJob(response.data.job)
      
      // Store vehicle options and peak hour status
      if (response.data.vehicle_options) {
        setVehicleOptions(response.data.vehicle_options)
        setIsPeakHour(response.data.is_peak_hour || false)
        
        // Auto-select recommended vehicle
        const recommended = response.data.vehicle_options.find(o => o.is_recommended && o.can_handle)
        if (recommended) {
          setSelectedVehicle(recommended.vehicle_type)
        }
      }
      
      setCurrentStep(4)
      toast.success('Route calculated - Select your vehicle')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to calculate route')
    } finally {
      setSaving(false)
    }
  }

  const handlePayment = async () => {
    if (!selectedVehicle) {
      toast.error('Please select a vehicle type')
      return
    }
    
    setSaving(true)

    try {
      await customerAPI.createJobStep({ 
        step: 4,
        vehicle_type: selectedVehicle 
      })
      toast.success('Job created successfully!')
      navigate('/customer/jobs')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Payment failed')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this job?')) return
    
    try {
      await customerAPI.deleteCreatingJob()
      toast.success('Draft deleted')
      setJob(null)
      setCurrentStep(1)
      setStep1Data({
        name: '',
        description: '',
        category: '',
        size: 'medium',
        quantity: 1,
        photo: null,
      })
      setStep2Data({
        pickup_address: '',
        pick_lat: 0,
        pick_up: 0,
        pickup_name: '',
        pickup_phone: '',
      })
      setStep3Data({
        delivery_address: '',
        delivery_lat: 0,
        delivery_lng: 0,
        delivery_name: '',
        delivery_phone: '',
      })
      setPhotoPreview(null)
    } catch (error) {
      toast.error('Failed to cancel')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Create Job</h1>
        {job && (
          <button
            onClick={handleCancel}
            className="text-red-600 hover:text-red-700 flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
        )}
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                step < currentStep
                  ? 'bg-green-500 text-white'
                  : step === currentStep
                  ? 'bg-yellow-500 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {step < currentStep ? <Check className="w-5 h-5" /> : step}
            </div>
            {step < 4 && (
              <div
                className={`w-16 h-1 mx-2 ${
                  step < currentStep ? 'bg-green-500' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Item Details */}
      {currentStep === 1 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Item Details
          </h2>

          <form onSubmit={handleStep1Submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Item Name *
              </label>
              <input
                type="text"
                value={step1Data.name}
                onChange={(e) => setStep1Data({ ...step1Data, name: e.target.value })}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none"
                placeholder="e.g., Documents, Electronics"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={step1Data.description}
                onChange={(e) => setStep1Data({ ...step1Data, description: e.target.value })}
                required
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none resize-none"
                placeholder="Describe your item..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={step1Data.category}
                onChange={(e) => setStep1Data({ ...step1Data, category: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none"
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Size *
              </label>
              <div className="grid grid-cols-2 gap-3">
                {SIZES.map((size) => (
                  <button
                    key={size.value}
                    type="button"
                    onClick={() => setStep1Data({ ...step1Data, size: size.value })}
                    className={`p-3 border rounded-lg text-left transition ${
                      step1Data.size === size.value
                        ? 'border-yellow-500 bg-yellow-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{size.icon}</span>
                      <div>
                        <p className="font-medium">{size.label}</p>
                        <p className="text-xs text-gray-500">{size.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Weight Selection */}
            <WeightSelector 
              value={step1Data.weight}
              onChange={(weight) => setStep1Data({ ...step1Data, weight })}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                value={step1Data.quantity}
                onChange={(e) => setStep1Data({ ...step1Data, quantity: parseInt(e.target.value) })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photo *
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {photoPreview ? (
                  <div className="relative inline-block">
                    <img
                      src={photoPreview}
                      alt="Item"
                      className="max-h-48 rounded-lg mx-auto"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoPreview(null)
                        setStep1Data({ ...step1Data, photo: null })
                      }}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">Click to upload photo</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      required={!job?.photo}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              Next
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        </div>
      )}

      {/* Step 2: Pickup Information */}
      {currentStep === 2 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Pickup Information
          </h2>

          <form onSubmit={handleStep2Submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pickup Address *
              </label>
              <input
                type="text"
                value={step2Data.pickup_address}
                onChange={(e) => setStep2Data({ ...step2Data, pickup_address: e.target.value })}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none"
                placeholder="Enter pickup address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={step2Data.pickup_name}
                  onChange={(e) => setStep2Data({ ...step2Data, pickup_name: e.target.value })}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none"
                  placeholder="Person to contact"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Phone *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={step2Data.pickup_phone}
                  onChange={(e) => setStep2Data({ ...step2Data, pickup_phone: e.target.value })}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none"
                  placeholder="Phone number"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-3 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                Next
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Step 3: Delivery Information */}
      {currentStep === 3 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Delivery Information
          </h2>

          <form onSubmit={handleStep3Submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Address *
              </label>
              <input
                type="text"
                value={step3Data.delivery_address}
                onChange={(e) => setStep3Data({ ...step3Data, delivery_address: e.target.value })}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none"
                placeholder="Enter delivery address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipient Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={step3Data.delivery_name}
                  onChange={(e) => setStep3Data({ ...step3Data, delivery_name: e.target.value })}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none"
                  placeholder="Recipient name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipient Phone *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={step3Data.delivery_phone}
                  onChange={(e) => setStep3Data({ ...step3Data, delivery_phone: e.target.value })}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none"
                  placeholder="Phone number"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-3 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                Calculate Route
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Step 4: Select Vehicle & Review */}
      {currentStep === 4 && job && (
        <div className="space-y-6">
          {/* Vehicle Selection */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Select Your Vehicle
            </h2>
            
            <VehicleSelector
              options={vehicleOptions}
              selectedVehicle={selectedVehicle}
              onSelect={setSelectedVehicle}
              isPeakHour={isPeakHour}
            />
          </div>

          {/* Job Summary */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Delivery Summary
            </h2>

            <div className="space-y-4">
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-4">
                  {job.photo && (
                    <img
                      src={job.photo}
                      alt={job.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-800">{job.name}</h3>
                    <p className="text-sm text-gray-500">{job.description}</p>
                    <p className="text-sm text-gray-500">
                      {job.size_display} • {job.weight_display} • Qty: {job.quantity}
                    </p>
                  </div>
                </div>

                <hr />

                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-green-500 mt-1" />
                    <div>
                      <p className="text-sm font-medium">Pickup</p>
                      <p className="text-sm text-gray-500">{job.pickup_address}</p>
                      <p className="text-sm text-gray-500">{job.pickup_name} • {job.pickup_phone}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-red-500 mt-1" />
                    <div>
                      <p className="text-sm font-medium">Delivery</p>
                      <p className="text-sm text-gray-500">{job.delivery_address}</p>
                      <p className="text-sm text-gray-500">{job.delivery_name} • {job.delivery_phone}</p>
                    </div>
                  </div>
                </div>

                <hr />

                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">Distance: {job.distance} km</p>
                    <p className="text-sm text-gray-500">
                      Est. delivery: {vehicleOptions.find(v => v.vehicle_type === selectedVehicle)?.estimated_time || `~${job.duration} mins`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="text-2xl font-bold text-emerald-600">
                      KSh {vehicleOptions.find(v => v.vehicle_type === selectedVehicle)?.price?.toLocaleString() || job.price?.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back
                </button>
                <button
                  onClick={handlePayment}
                  disabled={saving || !selectedVehicle}
                  className="flex-1 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  {saving ? 'Processing...' : 'Create Delivery'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
