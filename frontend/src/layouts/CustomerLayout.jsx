import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { 
  User, 
  Plus, 
  Package, 
  CreditCard, 
  LogOut,
  Menu,
  X,
  Bell,
  Home,
  MoreHorizontal
} from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import { authAPI } from '../services/api'

export default function CustomerLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, refreshToken, logout } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)

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
    { to: '/customer/profile', icon: User, label: 'Profile' },
    { to: '/customer/create-job', icon: Plus, label: 'New Delivery', highlight: true },
    { to: '/customer/jobs', icon: Package, label: 'My Deliveries' },
    { to: '/customer/payment-method', icon: CreditCard, label: 'Payment' },
    { to: '/customer/more', icon: MoreHorizontal, label: 'More' },
  ]

  const getPageTitle = () => {
    const path = location.pathname
    if (path.includes('profile')) return 'My Profile'
    if (path.includes('create-job')) return 'Create New Delivery'
    if (path.includes('jobs')) return 'My Deliveries'
    if (path.includes('payment')) return 'Payment Methods'
    if (path.includes('more')) return 'More Features'
    return 'Dashboard'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile header */}
      <header className="lg:hidden bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg bg-emerald-600 text-white"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Package className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">Yanzi</span>
          </div>
          <button className="p-2 rounded-lg hover:bg-gray-100 relative">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-200 z-40 lg:translate-x-0 border-r border-gray-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="p-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Yanzi Parcels</h1>
              <p className="text-xs text-gray-500">Customer Portal</p>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-700 font-semibold">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm truncate">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
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
                    ? 'bg-emerald-50 text-emerald-700'
                    : item.highlight
                    ? 'text-emerald-600 hover:bg-emerald-50'
                    : 'text-gray-600 hover:bg-gray-50'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium text-sm">{item.label}</span>
              {item.highlight && (
                <span className="ml-auto px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full font-medium">
                  New
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Quick Stats */}
        <div className="mx-4 mt-4 p-4 bg-gray-50 rounded-xl">
          <p className="text-xs font-medium text-gray-500 uppercase mb-3">Quick Stats</p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Active Deliveries</span>
              <span className="font-semibold text-gray-900">3</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Completed</span>
              <span className="font-semibold text-gray-900">24</span>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 w-full px-3 py-2.5 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors mb-2"
          >
            <Home className="w-5 h-5" />
            <span className="font-medium text-sm">Back to Home</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-sm">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="lg:ml-64 pt-14 lg:pt-0 min-h-screen">
        {/* Desktop Header */}
        <header className="hidden lg:flex items-center justify-between px-8 py-5 bg-white border-b border-gray-200">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{getPageTitle()}</h1>
            <p className="text-sm text-gray-500">Welcome back, {user?.first_name}</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2.5 hover:bg-gray-100 rounded-lg relative">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <button 
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium text-sm hover:bg-emerald-700 transition-colors"
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
    </div>
  )
}
