import { initializeApp } from 'firebase/app'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: "AIzaSyCTWnfHBuJLr2BmYiLKL8QFI7YmUFXZRAg",
  authDomain: "yanzi-parcels.firebaseapp.com",
  projectId: "yanzi-parcels",
  storageBucket: "yanzi-parcels.appspot.com",
  messagingSenderId: "734651121642",
  appId: "1:734651121642:web:bf8d151edbc32868647c93",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
let messaging = null

// Initialize messaging only in browser environment with service worker support
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    messaging = getMessaging(app)
  } catch (error) {
    console.log('Firebase messaging not supported:', error)
  }
}

// Request permission and get FCM token
export const requestNotificationPermission = async () => {
  if (!messaging) {
    console.log('Messaging not initialized')
    return null
  }

  try {
    const permission = await Notification.requestPermission()
    
    if (permission === 'granted') {
      try {
        // Register service worker first
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
        
        const token = await getToken(messaging, {
          vapidKey: 'BHhB_X2v5KJl7GQqhBaFhBNnpGBhXJC8qTrfaJVH5N3b0qL5X7dqP3xNfH3N5QqKxJ5L3qM8nH5pN3xJ5B5L3qM',
          serviceWorkerRegistration: registration
        })
        
        console.log('FCM Token:', token)
        return token
      } catch (tokenError) {
        // FCM token errors are common in development, fail silently
        console.log('FCM token registration failed (this is normal in development):', tokenError.message)
        return null
      }
    } else {
      console.log('Notification permission denied')
      return null
    }
  } catch (error) {
    console.log('Notification permission error:', error.message)
    return null
  }
}

// Listen for foreground messages
export const onForegroundMessage = (callback) => {
  if (!messaging) return () => {}
  
  return onMessage(messaging, (payload) => {
    console.log('Foreground message received:', payload)
    callback(payload)
  })
}

export { app, messaging }
