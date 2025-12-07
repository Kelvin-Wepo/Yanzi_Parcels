import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  ArrowRight,
  Calendar,
  Route,
  Timer,
  Truck,
  Search
} from 'lucide-react'
import { customerAPI } from '../../services/api'

const STATUS_CONFIG = {
  processing: { 
    bg: 'bg-blue-50', 
    text: 'text-blue-700',
    icon: Clock,
    label: 'Processing'
  },
  picking: { 
    bg: 'bg-amber-50', 
    text: 'text-amber-700',
    icon: Package,
    label: 'Picking Up'
  },
  delivering: { 
    bg: 'bg-orange-50', 
    text: 'text-orange-700',
    icon: Truck,
    label: 'In Transit'
  },
  completed: { 
    bg: 'bg-green-50', 
    text: 'text-green-700',
    icon: CheckCircle,
    label: 'Delivered'
  },
  cancelled: { 
    bg: 'bg-red-50', 
    text: 'text-red-700',
    icon: XCircle,
    label: 'Cancelled'
  },
}

export default function Jobs() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  
  const activeTab = searchParams.get('tab') || 'current'

  useEffect(() => {
    loadJobs()
  }, [activeTab])

  const loadJobs = async () => {
    setLoading(true)
    try {
      const response = await customerAPI.getJobs(activeTab)
      setJobs(response.data)
    } catch (error) {
      toast.error('Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const filteredJobs = jobs.filter(job => 
    job.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const stats = {
    total: jobs.length,
    inProgress: jobs.filter(j => ['processing', 'picking', 'delivering'].includes(j.status)).length,
    completed: jobs.filter(j => j.status === 'completed').length,
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Jobs</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">In Progress</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{stats.inProgress}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Completed</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.completed}</p>
        </div>
      </div>

      {/* Tabs and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setSearchParams({ tab: 'current' })}
            className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
              activeTab === 'current'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Active Jobs
          </button>
          <button
            onClick={() => setSearchParams({ tab: 'archived' })}
            className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
              activeTab === 'archived'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Archived
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search jobs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none w-64"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full border-3 border-gray-200 border-t-emerald-600 animate-spin" />
            <p className="text-gray-500 text-sm">Loading deliveries...</p>
          </div>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No deliveries found</h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            {activeTab === 'current'
              ? "You don't have any active deliveries. Create one to ship across Kenya!"
              : "You don't have any completed deliveries yet."}
          </p>
          {activeTab === 'current' && (
            <Link
              to="/customer/create-job"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
            >
              Create New Delivery
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredJobs.map((job) => {
            const statusConfig = STATUS_CONFIG[job.status] || STATUS_CONFIG.processing
            const StatusIcon = statusConfig.icon
            
            return (
              <Link
                key={job.id}
                to={`/customer/jobs/${job.id}`}
                className="block bg-white rounded-xl border border-gray-200 p-4 hover:border-emerald-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start gap-4">
                  {/* Image */}
                  <div className="flex-shrink-0">
                    {job.photo ? (
                      <img
                        src={job.photo}
                        alt={job.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Package className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{job.name}</h3>
                        <p className="text-sm text-gray-500 line-clamp-1">{job.description}</p>
                      </div>
                      <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {job.status_display || statusConfig.label}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <Route className="w-4 h-4" />
                        {job.distance} km
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Timer className="w-4 h-4" />
                        ~{job.duration} mins
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        {formatDate(job.created_at)}
                      </span>
                      <span className="font-semibold text-emerald-600">
                        KSh {job.price?.toLocaleString()}
                      </span>
                    </div>

                    {/* Progress for active jobs */}
                    {['processing', 'picking', 'delivering'].includes(job.status) && (
                      <div className="mt-3">
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500 rounded-full transition-all"
                            style={{ width: job.status === 'processing' ? '25%' : job.status === 'picking' ? '50%' : '75%' }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Arrow */}
                  <ArrowRight className="w-5 h-5 text-gray-300 flex-shrink-0 hidden sm:block" />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
