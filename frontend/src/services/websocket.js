// WebSocket service for real-time job updates

class WebSocketService {
  constructor() {
    this.socket = null
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.listeners = new Map()
  }

  connect(jobId) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.disconnect()
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host.includes('localhost') 
      ? 'localhost:8000' 
      : window.location.host
    
    const url = `${protocol}//${host}/ws/jobs/${jobId}/`
    
    console.log('Connecting to WebSocket:', url)
    
    this.socket = new WebSocket(url)

    this.socket.onopen = () => {
      console.log('WebSocket connected')
      this.reconnectAttempts = 0
    }

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('WebSocket message:', data)
        
        // Notify all listeners
        this.listeners.forEach((callback) => {
          callback(data)
        })
      } catch (error) {
        console.error('WebSocket message parse error:', error)
      }
    }

    this.socket.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason)
      
      // Attempt reconnect
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++
        console.log(`Reconnecting... attempt ${this.reconnectAttempts}`)
        setTimeout(() => this.connect(jobId), 2000 * this.reconnectAttempts)
      }
    }

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error)
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close()
      this.socket = null
    }
    this.listeners.clear()
  }

  send(data) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data))
    }
  }

  // Send courier location update
  sendLocationUpdate(lat, lng) {
    this.send({
      job: {
        courier_lat: lat,
        courier_lng: lng
      }
    })
  }

  // Subscribe to updates
  subscribe(id, callback) {
    this.listeners.set(id, callback)
    return () => this.listeners.delete(id)
  }
}

export const wsService = new WebSocketService()
export default wsService
