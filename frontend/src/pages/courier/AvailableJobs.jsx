import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { 
  Package, 
  Navigation,
  Clock,
  ArrowRight,
  RefreshCw,
  Search
} from 'lucide-react'
import { courierAPI } from '../../services/api'

export default function AvailableJobs() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadJobs()
    
    // Refresh jobs every 30 seconds
    const interval = setInterval(loadJobs, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadJobs = async () => {
    try {
      const response = await courierAPI.getAvailableJobs()
      setJobs(response.data)
    } catch (error) {
      toast.error('Failed to load jobs')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    loadJobs()
  }

  const filteredJobs = jobs.filter(job =>
    job.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.pickup_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.delivery_address?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Calculate stats
  const totalEarnings = jobs.reduce((sum, job) => sum + (job.price * 0.8), 0)

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-3 border-gray-600 border-t-amber-500 animate-spin" />
          <p className="text-gray-400 text-sm">Finding available jobs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
          <p className="text-sm text-gray-400">Available Jobs</p>
          <p className="text-2xl font-bold text-white mt-1">{jobs.length}</p>
        </div>
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
          <p className="text-sm text-gray-400">Potential Earnings</p>
          <p className="text-2xl font-bold text-amber-500 mt-1">KSh {totalEarnings.toLocaleString()}</p>
        </div>
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
          <p className="text-sm text-gray-400">Area</p>
          <p className="text-2xl font-bold text-white mt-1">Nairobi</p>
        </div>
      </div>

      {/* Search and Refresh */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by location or item..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
          />
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 rounded-lg text-white font-medium hover:bg-amber-600 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {filteredJobs.length === 0 ? (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
          <div className="w-16 h-16 bg-gray-700 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-gray-500" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No Available Jobs</h3>
          <p className="text-gray-400 max-w-sm mx-auto">
            {searchTerm 
              ? "No jobs match your search. Try different keywords."
              : "New delivery requests in Nairobi will appear here."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredJobs.map((job) => (
            <Link
              key={job.id}
              to={`/courier/available-jobs/${job.id}`}
              className="block bg-gray-800 rounded-xl border border-gray-700 p-4 hover:border-amber-500/50 transition-colors"
            >
              <div className="flex items-start gap-4">
                {/* Image */}
                <div className="flex-shrink-0">
                  {job.photo ? (
                    <img
                      src={job.photo}
                      alt={job.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gray-700 rounded-lg flex items-center justify-center">
                      <Package className="w-8 h-8 text-gray-500" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-white">{job.name}</h3>
                      <p className="text-sm text-gray-400 line-clamp-1">{job.description}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-bold text-amber-500">
                        KSh {(job.price * 0.8).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">Your earning</p>
                    </div>
                  </div>

                  {/* Route Info */}
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-gray-400 truncate">{job.pickup_address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <span className="text-gray-400 truncate">{job.delivery_address}</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <Navigation className="w-4 h-4" />
                      {job.distance} km
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      ~{job.duration} min
                    </span>
                  </div>
                </div>

                {/* Arrow */}
                <ArrowRight className="w-5 h-5 text-gray-600 flex-shrink-0 hidden sm:block" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
