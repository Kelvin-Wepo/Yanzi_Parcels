import { useState, useEffect } from 'react'
import { MessageCircle } from 'lucide-react'
import { chatAPI } from '../services/api'
import ChatBox from './ChatBox'

export default function ChatButton({ jobId, isCustomer = true }) {
  const [showChat, setShowChat] = useState(false)
  const [minimized, setMinimized] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  // Poll for unread count only when jobId exists
  useEffect(() => {
    if (!jobId) return
    
    loadUnreadCount()
    const interval = setInterval(loadUnreadCount, 10000)
    return () => clearInterval(interval)
  }, [jobId])

  const loadUnreadCount = async () => {
    if (!jobId) return
    try {
      const response = await chatAPI.getUnreadCount(jobId)
      setUnreadCount(response.data.unread_count)
    } catch (error) {
      // Silent fail
    }
  }

  // Don't render if no jobId
  if (!jobId) return null

  const handleToggle = () => {
    if (!showChat) {
      setShowChat(true)
      setMinimized(false)
    } else {
      setMinimized(!minimized)
    }
    
    // Mark as read when opening
    if (minimized && unreadCount > 0) {
      chatAPI.markAsRead(jobId).then(() => setUnreadCount(0))
    }
  }

  if (!showChat) {
    return (
      <button
        onClick={handleToggle}
        className="fixed bottom-4 right-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all z-50 group"
      >
        <MessageCircle className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
          Chat with {isCustomer ? 'Courier' : 'Customer'}
        </span>
      </button>
    )
  }

  return (
    <ChatBox
      jobId={jobId}
      isCustomer={isCustomer}
      minimized={minimized}
      onToggleMinimize={handleToggle}
      onClose={() => setShowChat(false)}
    />
  )
}
