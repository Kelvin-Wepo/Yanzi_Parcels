import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { 
  User, 
  Search, 
  Truck, 
  Archive,
  Wallet,
  LogOut,
  Menu,
  X,
  Bell,
  MapPin,
  Home,
  Bike
} from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '../stores/authStore'
import { authAPI, courierAPI } from '../services/api'
import { requestNotificationPermission, onForegroundMessage } from '../services/firebase'
import JobNotificationPopup from '../components/JobNotificationPopup'

export default function CourierLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, refreshToken, logout } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [newJobNotification, setNewJobNotification] = useState(null)
  const [notificationCount, setNotificationCount] = useState(0)

  // Initialize Firebase push notifications
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        const fcmToken = await requestNotificationPermission()
        if (fcmToken) {
          // Send token to backend
          await courierAPI.updateFCMToken(fcmToken)
          console.log('FCM token registered with backend')
        }
      } catch (error) {
        console.error('Failed to initialize notifications:', error)
      }
    }

    initializeNotifications()

    // Listen for foreground messages
    const unsubscribe = onForegroundMessage((payload) => {
      console.log('Received foreground message:', payload)
      
      // Check if it's a new job notification
      if (payload.data?.type === 'new_job') {
        // Play notification sound
        playNotificationSound()
        
        // Show the popup
        setNewJobNotification(payload.data)
        setNotificationCount((prev) => prev + 1)
      } else {
        // Show a toast for other notifications
        toast(payload.notification?.body || 'New notification', {
          icon: '🔔',
          duration: 5000,
        })
      }
    })

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe()
      }
    }
  }, [])

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    try {
      const audio = new Audio('/notification.mp3')
      audio.volume = 0.5
      audio.play().catch(() => {
        // Ignore autoplay errors
      })
    } catch (error) {
      // Ignore sound errors
    }
  }, [])

  const handleCloseNotification = useCallback(() => {
    setNewJobNotification(null)
  }, [])

  const handleJobAccepted = useCallback(() => {
    setNotificationCount(0)
  }, [])

  const handleLogout = async () => {
    try {
      await authAPI.logout({ refresh: refreshToken })
    } catch (error) {
      // Ignore errors
    }
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  const navItems = [
    { to: '/courier/available-jobs', icon: Search, label: 'Find Jobs' },
    { to: '/courier/current-job', icon: Truck, label: 'Active Delivery', badge: true },
    { to: '/courier/vehicles', icon: Bike, label: 'My Vehicles' },
    { to: '/courier/archived-jobs', icon: Archive, label: 'History' },
    { to: '/courier/profile', icon: User, label: 'Profile' },
    { to: '/courier/payout-method', icon: Wallet, label: 'Earnings' },
  ]

  const getPageTitle = () => {
    const path = location.pathname
    if (path.includes('available')) return 'Available Jobs'
    if (path.includes('current')) return 'Active Delivery'
    if (path.includes('vehicles')) return 'My Vehicles'
    if (path.includes('archived')) return 'Delivery History'
    if (path.includes('profile')) return 'My Profile'
    if (path.includes('payout')) return 'Earnings & Payouts'
    return 'Dashboard'
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Mobile header */}
      <header className="lg:hidden bg-gray-800 border-b border-gray-700 fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg bg-amber-500 text-white"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
              <Truck className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white">Yanzi Courier</span>
          </div>
          <button className="p-2 rounded-lg hover:bg-gray-700 relative">
            <Bell className="w-5 h-5 text-gray-400" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-gray-800 transform transition-transform duration-200 z-40 lg:translate-x-0 border-r border-gray-700 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="p-5 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Yanzi Courier</h1>
              <p className="text-xs text-gray-400">Driver Portal</p>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-900/50 rounded-lg flex items-center justify-center text-amber-500 font-semibold">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white text-sm truncate">
                {user?.first_name} {user?.last_name}
              </p>
              <div className="flex items-center gap-1 text-xs text-amber-500">
                <span>⭐</span>
                <span>4.9 Rating</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="p-4 border-b border-gray-700">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-700/50 rounded-lg p-3">
              <p className="text-xs text-gray-400">Today</p>
              <p className="text-lg font-bold text-white">3</p>
              <p className="text-xs text-gray-500">Deliveries</p>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-3">
              <p className="text-xs text-gray-400">Earned</p>
              <p className="text-lg font-bold text-amber-500">KSh 2,850</p>
              <p className="text-xs text-gray-500">Today</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-amber-500/20 text-amber-500'
                    : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium text-sm">{item.label}</span>
              {item.badge && (
                <span className="ml-auto w-2 h-2 bg-amber-500 rounded-full" />
              )}
            </NavLink>
          ))}
        </nav>

        {/* Online Status */}
        <div className="mx-4 mt-4 p-4 bg-emerald-900/30 border border-emerald-700/50 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-emerald-400">Online</span>
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          </div>
          <p className="text-xs text-gray-400">Accepting new jobs in Nairobi</p>
        </div>

        {/* Bottom Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 w-full px-3 py-2.5 text-gray-400 hover:bg-gray-700/50 rounded-lg transition-colors mb-2"
          >
            <Home className="w-5 h-5" />
            <span className="font-medium text-sm">Back to Home</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-sm">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="lg:ml-64 pt-14 lg:pt-0 min-h-screen">
        {/* Desktop Header */}
        <header className="hidden lg:flex items-center justify-between px-8 py-5 bg-gray-800 border-b border-gray-700">
          <div>
            <h1 className="text-xl font-bold text-white">{getPageTitle()}</h1>
            <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
              <MapPin className="w-4 h-4 text-amber-500" />
              <span>Nairobi, Kenya</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2.5 hover:bg-gray-700 rounded-lg relative">
              <Bell className="w-5 h-5 text-gray-400" />
              {notificationCount > 0 && (
                <span className="absolute top-1 right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </button>
            <button 
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg font-medium text-sm hover:bg-amber-600 transition-colors"
            >
              <Home className="w-4 h-4" />
              Home
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6 lg:p-8">
          <Outlet />
        </div>
      </main>

      {/* Job Notification Popup */}
      {newJobNotification && (
        <JobNotificationPopup
          job={newJobNotification}
          onClose={handleCloseNotification}
          onAccepted={handleJobAccepted}
        />
      )}
    </div>
  )
}
