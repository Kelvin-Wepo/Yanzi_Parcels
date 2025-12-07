import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { 
  User, 
  DollarSign, 
  Package, 
  Navigation,
  TrendingUp
} from 'lucide-react'
import { courierAPI } from '../../services/api'

export default function Profile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const response = await courierAPI.getProfile()
      setProfile(response.data)
    } catch (error) {
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Profile</h1>

      {/* Profile Info */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-orange-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              {profile?.first_name} {profile?.last_name}
            </h2>
            <p className="text-gray-500">{profile?.email}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-700">
              KSh {profile?.total_earnings?.toLocaleString()}
            </p>
            <p className="text-sm text-green-600">Total Earnings</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <Package className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-700">
              {profile?.total_jobs}
            </p>
            <p className="text-sm text-blue-600">Completed Jobs</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <Navigation className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-700">
              {profile?.total_km?.toFixed(1)}
            </p>
            <p className="text-sm text-purple-600">Total KM</p>
          </div>
        </div>
      </div>

      {/* Earnings Breakdown */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Earnings Overview
        </h3>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-600">Jobs Completed</span>
            <span className="font-semibold">{profile?.total_jobs}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-600">Distance Traveled</span>
            <span className="font-semibold">{profile?.total_km?.toFixed(1)} km</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-600">Your Share (80%)</span>
            <span className="font-semibold text-green-600">
              KSh {profile?.total_earnings?.toLocaleString()}
            </span>
          </div>
        </div>

        <p className="text-sm text-gray-500 mt-4">
          You receive 80% of each job's total price. Earnings are paid out to your
          M-Pesa account weekly.
        </p>
      </div>
    </div>
  )
}
