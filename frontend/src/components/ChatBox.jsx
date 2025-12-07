import { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { 
  Send, 
  Phone, 
  PhoneCall,
  MessageCircle, 
  X, 
  ChevronDown,
  ChevronUp,
  User,
  Clock,
  Check,
  CheckCheck,
  Smile
} from 'lucide-react'
import { chatAPI } from '../services/api'

export default function ChatBox({ 
  jobId, 
  isCustomer = true,
  onClose,
  minimized = false,
  onToggleMinimize
}) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [chatInfo, setChatInfo] = useState(null)
  const [quickMessages, setQuickMessages] = useState([])
  const [showQuickMessages, setShowQuickMessages] = useState(false)
  const [canChat, setCanChat] = useState(false)
  const [calling, setCalling] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Load initial data
  useEffect(() => {
    loadChatData()
    loadQuickMessages()
    
    // Poll for new messages every 5 seconds
    const interval = setInterval(loadMessages, 5000)
    return () => clearInterval(interval)
  }, [jobId])

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadChatData = async () => {
    try {
      const [messagesRes, infoRes] = await Promise.all([
        chatAPI.getMessages(jobId),
        chatAPI.getChatInfo(jobId)
      ])
      setMessages(messagesRes.data.messages || [])
      setCanChat(messagesRes.data.can_chat)
      setChatInfo(infoRes.data)
    } catch (error) {
      console.error('Failed to load chat:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async () => {
    try {
      const response = await chatAPI.getMessages(jobId)
      setMessages(response.data.messages || [])
      setCanChat(response.data.can_chat)
    } catch (error) {
      // Silent fail for polling
    }
  }

  const loadQuickMessages = async () => {
    try {
      const response = await chatAPI.getQuickMessages()
      setQuickMessages(response.data)
    } catch (error) {
      console.error('Failed to load quick messages:', error)
    }
  }

  const handleSendMessage = async (e) => {
    e?.preventDefault()
    if (!newMessage.trim() || sending || !canChat) return

    setSending(true)
    try {
      const response = await chatAPI.sendMessage(jobId, newMessage.trim())
      setMessages(prev => [...prev, response.data])
      setNewMessage('')
      inputRef.current?.focus()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleQuickMessage = async (quickMsg) => {
    if (sending || !canChat) return

    setSending(true)
    try {
      const content = `${quickMsg.emoji} ${quickMsg.text}`
      const response = await chatAPI.sendMessage(jobId, content, true)
      setMessages(prev => [...prev, response.data])
      setShowQuickMessages(false)
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleCall = async () => {
    setCalling(true)
    try {
      const response = await chatAPI.getMaskedPhone(jobId)
      const { masked_number, other_party_name, note } = response.data
      
      // Show call confirmation
      const confirmed = window.confirm(
        `Call ${other_party_name}?\n\n` +
        `Number: ${masked_number}\n\n` +
        `${note}`
      )
      
      if (confirmed) {
        // Initiate phone call
        window.location.href = `tel:${masked_number}`
        
        // Add system message about the call
        await chatAPI.sendMessage(jobId, `📞 Phone call initiated`, true)
        loadMessages()
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Cannot make call right now')
    } finally {
      setCalling(false)
    }
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  }

  const myType = isCustomer ? 'customer' : 'courier'

  if (minimized) {
    return (
      <div 
        onClick={onToggleMinimize}
        className="fixed bottom-4 right-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-3 rounded-full shadow-lg cursor-pointer hover:shadow-xl transition-all flex items-center gap-2 z-50"
      >
        <MessageCircle className="w-5 h-5" />
        <span className="font-medium">Chat</span>
        {chatInfo?.unread_count > 0 && (
          <span className="bg-white text-amber-600 text-xs font-bold px-2 py-0.5 rounded-full">
            {chatInfo.unread_count}
          </span>
        )}
        <ChevronUp className="w-4 h-4" />
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50 max-h-[500px]">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-3 rounded-t-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            {chatInfo?.other_party_avatar ? (
              <img 
                src={chatInfo.other_party_avatar} 
                alt="" 
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <User className="w-5 h-5" />
            )}
          </div>
          <div>
            <p className="font-semibold text-sm">{chatInfo?.other_party_name || 'Loading...'}</p>
            <p className="text-xs text-white/80">
              {canChat ? 'Online' : 'Chat unavailable'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {canChat && chatInfo?.can_call && (
            <button
              onClick={handleCall}
              disabled={calling}
              className="p-2 hover:bg-white/20 rounded-full transition"
              title="Call (masked number)"
            >
              {calling ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Phone className="w-5 h-5" />
              )}
            </button>
          )}
          <button
            onClick={onToggleMinimize}
            className="p-2 hover:bg-white/20 rounded-full transition"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[250px] max-h-[300px] bg-gray-50">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <MessageCircle className="w-12 h-12 mb-2" />
            <p className="text-sm">No messages yet</p>
            <p className="text-xs">Send a message to start the conversation</p>
          </div>
        ) : (
          <>
            {messages.map((msg) => {
              const isMe = msg.sender_type === myType
              const isSystem = msg.sender_type === 'system'

              if (isSystem) {
                return (
                  <div key={msg.id} className="flex justify-center">
                    <span className="text-xs text-gray-400 bg-gray-200 px-3 py-1 rounded-full">
                      {msg.content}
                    </span>
                  </div>
                )
              }

              return (
                <div
                  key={msg.id}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                      isMe
                        ? 'bg-amber-500 text-white rounded-br-md'
                        : 'bg-white text-gray-800 rounded-bl-md shadow-sm'
                    }`}
                  >
                    <p className="text-sm break-words">{msg.content}</p>
                    <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : ''}`}>
                      <span className={`text-xs ${isMe ? 'text-white/70' : 'text-gray-400'}`}>
                        {msg.time_ago || formatTime(msg.created_at)}
                      </span>
                      {isMe && (
                        msg.is_read ? (
                          <CheckCheck className="w-3 h-3 text-white/70" />
                        ) : (
                          <Check className="w-3 h-3 text-white/70" />
                        )
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Quick Messages */}
      {showQuickMessages && canChat && (
        <div className="border-t bg-white px-3 py-2 max-h-32 overflow-y-auto">
          <div className="flex flex-wrap gap-2">
            {quickMessages.map((qm) => (
              <button
                key={qm.id}
                onClick={() => handleQuickMessage(qm)}
                disabled={sending}
                className="px-3 py-1.5 bg-gray-100 hover:bg-amber-100 text-gray-700 text-xs rounded-full transition whitespace-nowrap"
              >
                {qm.emoji} {qm.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t p-3 bg-white rounded-b-2xl">
        {canChat ? (
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowQuickMessages(!showQuickMessages)}
              className={`p-2 rounded-full transition ${
                showQuickMessages ? 'bg-amber-100 text-amber-600' : 'hover:bg-gray-100 text-gray-400'
              }`}
              title="Quick messages"
            >
              <Smile className="w-5 h-5" />
            </button>
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="p-2 bg-amber-500 text-white rounded-full hover:bg-amber-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </form>
        ) : (
          <div className="text-center text-gray-400 text-sm py-2">
            <Clock className="w-4 h-4 inline-block mr-1" />
            Chat available during active delivery
          </div>
        )}
      </div>
    </div>
  )
}
