import { useState, useEffect, useRef } from 'react'
import { toast } from 'react-hot-toast'
import { 
  Truck, 
  Plus, 
  Camera, 
  FileCheck, 
  Shield, 
  Check,
  X,
  ChevronRight,
  AlertCircle,
  Clock,
  Star,
  Trash2,
  Edit2
} from 'lucide-react'
import { courierAPI, vehicleAPI } from '../../services/api'

// Vehicle type info
const VEHICLE_TYPES = {
  boda_boda: { name: 'Boda Boda', icon: '🏍️', description: 'Motorcycle' },
  tuk_tuk: { name: 'TukTuk', icon: '🛺', description: 'Three-wheeler' },
  car: { name: 'Car', icon: '🚗', description: 'Sedan/Hatchback' },
  van: { name: 'Van', icon: '🚐', description: 'Cargo Van' },
  pickup: { name: 'Pickup', icon: '🛻', description: 'Pickup Truck' },
}

const VERIFICATION_STATUSES = {
  pending: { label: 'Pending Review', color: 'amber', icon: Clock },
  approved: { label: 'Verified', color: 'green', icon: Check },
  rejected: { label: 'Rejected', color: 'red', icon: X },
}

export default function Vehicles() {
  const [loading, setLoading] = useState(true)
  const [vehicles, setVehicles] = useState([])
  const [activeVehicleId, setActiveVehicleId] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState(null)
  const [vehicleTypes, setVehicleTypes] = useState([])
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    vehicle_type: 'boda_boda',
    plate_number: '',
    make: '',
    model: '',
    year: '',
    color: '',
    max_weight_kg: '',
    insurance_number: '',
    insurance_expiry: '',
  })
  
  const [photos, setPhotos] = useState({
    license_photo: null,
    insurance_photo: null,
    vehicle_photo: null,
    helmet_cam_photo: null,
  })
  
  const [photoPreviews, setPhotoPreviews] = useState({
    license_photo: null,
    insurance_photo: null,
    vehicle_photo: null,
    helmet_cam_photo: null,
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [vehiclesRes, typesRes] = await Promise.all([
        courierAPI.getVehicles(),
        vehicleAPI.getTypes(),
      ])
      
      setVehicles(vehiclesRes.data.vehicles || [])
      setActiveVehicleId(vehiclesRes.data.active_vehicle_id)
      setVehicleTypes(typesRes.data || [])
    } catch (error) {
      toast.error('Failed to load vehicles')
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoChange = (field) => (e) => {
    const file = e.target.files[0]
    if (file) {
      setPhotos({ ...photos, [field]: file })
      setPhotoPreviews({ ...photoPreviews, [field]: URL.createObjectURL(file) })
    }
  }

  const resetForm = () => {
    setFormData({
      vehicle_type: 'boda_boda',
      plate_number: '',
      make: '',
      model: '',
      year: '',
      color: '',
      max_weight_kg: '',
      insurance_number: '',
      insurance_expiry: '',
    })
    setPhotos({
      license_photo: null,
      insurance_photo: null,
      vehicle_photo: null,
      helmet_cam_photo: null,
    })
    setPhotoPreviews({
      license_photo: null,
      insurance_photo: null,
      vehicle_photo: null,
      helmet_cam_photo: null,
    })
    setEditingVehicle(null)
    setShowAddForm(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      const data = new FormData()
      
      // Add form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value) data.append(key, value)
      })
      
      // Add photos
      Object.entries(photos).forEach(([key, file]) => {
        if (file) data.append(key, file)
      })

      if (editingVehicle) {
        await courierAPI.updateVehicle(editingVehicle.id, data)
        toast.success('Vehicle updated successfully')
      } else {
        await courierAPI.addVehicle(data)
        toast.success('Vehicle added successfully')
      }

      loadData()
      resetForm()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save vehicle')
    } finally {
      setSaving(false)
    }
  }

  const handleSetActive = async (vehicleId) => {
    try {
      await courierAPI.setActiveVehicle(vehicleId)
      setActiveVehicleId(vehicleId)
      toast.success('Active vehicle updated')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to set active vehicle')
    }
  }

  const handleDelete = async (vehicleId) => {
    if (!confirm('Are you sure you want to remove this vehicle?')) return

    try {
      await courierAPI.deleteVehicle(vehicleId)
      toast.success('Vehicle removed')
      loadData()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to remove vehicle')
    }
  }

  const handleEdit = (vehicle) => {
    setFormData({
      vehicle_type: vehicle.vehicle_type,
      plate_number: vehicle.plate_number,
      make: vehicle.make || '',
      model: vehicle.model || '',
      year: vehicle.year || '',
      color: vehicle.color || '',
      max_weight_kg: vehicle.max_weight_kg || '',
      insurance_number: vehicle.insurance_number || '',
      insurance_expiry: vehicle.insurance_expiry || '',
    })
    setPhotoPreviews({
      license_photo: vehicle.license_photo,
      insurance_photo: vehicle.insurance_photo,
      vehicle_photo: vehicle.vehicle_photo,
      helmet_cam_photo: vehicle.helmet_cam_photo,
    })
    setEditingVehicle(vehicle)
    setShowAddForm(true)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Vehicles</h1>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-amber-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-amber-600 transition flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Vehicle
          </button>
        )}
      </div>

      {/* Add/Edit Vehicle Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-700">
              {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
            </h2>
            <button
              onClick={resetForm}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Vehicle Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vehicle Type *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(VEHICLE_TYPES).map(([type, info]) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData({ ...formData, vehicle_type: type })}
                    className={`p-3 border-2 rounded-xl text-center transition ${
                      formData.vehicle_type === type
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-gray-200 hover:border-amber-300'
                    }`}
                  >
                    <span className="text-2xl">{info.icon}</span>
                    <p className="font-medium text-sm mt-1">{info.name}</p>
                    <p className="text-xs text-gray-500">{info.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Vehicle Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plate Number *
                </label>
                <input
                  type="text"
                  value={formData.plate_number}
                  onChange={(e) => setFormData({ ...formData, plate_number: e.target.value.toUpperCase() })}
                  required
                  placeholder="KCA 123A"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="e.g., Red"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Make
                </label>
                <input
                  type="text"
                  value={formData.make}
                  onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                  placeholder="e.g., Honda, TVS"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Model
                </label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="e.g., Boxer"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Year
                </label>
                <input
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  placeholder="2020"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Weight (kg)
                </label>
                <input
                  type="number"
                  value={formData.max_weight_kg}
                  onChange={(e) => setFormData({ ...formData, max_weight_kg: e.target.value })}
                  placeholder="50"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>

            {/* Insurance */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Insurance Number
                </label>
                <input
                  type="text"
                  value={formData.insurance_number}
                  onChange={(e) => setFormData({ ...formData, insurance_number: e.target.value })}
                  placeholder="Insurance policy number"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Insurance Expiry
                </label>
                <input
                  type="date"
                  value={formData.insurance_expiry}
                  onChange={(e) => setFormData({ ...formData, insurance_expiry: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>

            {/* Photo Uploads */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Camera className="w-4 h-4 inline mr-2" />
                Verification Photos
              </label>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'vehicle_photo', label: 'Vehicle Photo', required: true },
                  { key: 'license_photo', label: 'License (NTSA)', required: true },
                  { key: 'insurance_photo', label: 'Insurance Sticker', required: false },
                  { key: 'helmet_cam_photo', label: 'Helmet Cam (Boda)', required: formData.vehicle_type === 'boda_boda' },
                ].map((photo) => (
                  <div key={photo.key}>
                    <label className="block text-xs text-gray-500 mb-1">
                      {photo.label} {photo.required && '*'}
                    </label>
                    <div className="relative">
                      {photoPreviews[photo.key] ? (
                        <div className="relative">
                          <img
                            src={photoPreviews[photo.key]}
                            alt={photo.label}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setPhotos({ ...photos, [photo.key]: null })
                              setPhotoPreviews({ ...photoPreviews, [photo.key]: null })
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-amber-400 transition">
                          <Camera className="w-6 h-6 text-gray-400" />
                          <span className="text-xs text-gray-400 mt-1">Upload</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoChange(photo.key)}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3">
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
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Check className="w-5 h-5" />
                )}
                {editingVehicle ? 'Update Vehicle' : 'Add Vehicle'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Vehicle List */}
      {vehicles.length === 0 && !showAddForm ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <Truck className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Vehicles Yet</h3>
          <p className="text-gray-500 mb-4">
            Add your vehicle to start accepting delivery jobs
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-amber-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-amber-600 transition inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Your First Vehicle
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {vehicles.map((vehicle) => {
            const typeInfo = VEHICLE_TYPES[vehicle.vehicle_type] || {}
            const statusInfo = VERIFICATION_STATUSES[vehicle.verification_status] || {}
            const StatusIcon = statusInfo.icon || Clock
            const isActive = vehicle.id === activeVehicleId
            
            return (
              <div
                key={vehicle.id}
                className={`bg-white rounded-xl shadow-sm overflow-hidden border-2 transition ${
                  isActive ? 'border-amber-500' : 'border-transparent'
                }`}
              >
                <div className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Vehicle Icon */}
                    <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center text-3xl">
                      {typeInfo.icon || '🚗'}
                    </div>

                    {/* Vehicle Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-800">
                          {typeInfo.name || vehicle.vehicle_type}
                        </h3>
                        {isActive && (
                          <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Star className="w-3 h-3" />
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 font-mono">
                        {vehicle.plate_number}
                      </p>
                      <p className="text-xs text-gray-500">
                        {vehicle.make} {vehicle.model} {vehicle.year && `(${vehicle.year})`}
                      </p>
                      
                      {/* Verification Status */}
                      <div className={`mt-2 inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-${statusInfo.color}-100 text-${statusInfo.color}-700`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusInfo.label}
                      </div>
                      
                      {vehicle.verification_notes && vehicle.verification_status === 'rejected' && (
                        <p className="text-xs text-red-500 mt-1">
                          {vehicle.verification_notes}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      {vehicle.verification_status === 'approved' && !isActive && (
                        <button
                          onClick={() => handleSetActive(vehicle.id)}
                          className="text-xs bg-amber-500 text-white px-3 py-1.5 rounded-lg hover:bg-amber-600 transition"
                        >
                          Set Active
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(vehicle)}
                        className="text-xs border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(vehicle.id)}
                        className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1 justify-center"
                      >
                        <Trash2 className="w-3 h-3" />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>

                {/* Vehicle Photo Strip */}
                {vehicle.vehicle_photo && (
                  <div className="border-t bg-gray-50 p-2 flex gap-2 overflow-x-auto">
                    {vehicle.vehicle_photo && (
                      <img
                        src={vehicle.vehicle_photo}
                        alt="Vehicle"
                        className="h-16 w-24 object-cover rounded"
                      />
                    )}
                    {vehicle.license_photo && (
                      <img
                        src={vehicle.license_photo}
                        alt="License"
                        className="h-16 w-24 object-cover rounded"
                      />
                    )}
                    {vehicle.helmet_cam_photo && (
                      <img
                        src={vehicle.helmet_cam_photo}
                        alt="Helmet Cam"
                        className="h-16 w-24 object-cover rounded"
                      />
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Info Card */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex gap-3">
          <Shield className="w-6 h-6 text-blue-500 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-blue-800">Vehicle Verification</h3>
            <p className="text-sm text-blue-600 mt-1">
              All vehicles must be verified before you can accept jobs. Upload clear photos of your 
              vehicle, license, and insurance. Boda boda riders need to include a helmet cam photo.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
