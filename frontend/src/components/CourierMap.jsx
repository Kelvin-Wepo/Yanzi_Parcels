import { useState, useEffect, useRef, useCallback } from 'react'
import { Loader } from '@googlemaps/js-api-loader'
import { MapPin, Navigation, RefreshCw } from 'lucide-react'

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

// Custom marker icons as SVG data URLs
const createMarkerIcon = (color, label) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="50" viewBox="0 0 40 50">
      <path d="M20 0C9 0 0 9 0 20c0 11 20 30 20 30s20-19 20-30C40 9 31 0 20 0z" fill="${color}"/>
      <circle cx="20" cy="18" r="8" fill="white"/>
      <text x="20" y="22" text-anchor="middle" fill="${color}" font-size="12" font-weight="bold">${label}</text>
    </svg>
  `
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

// Motorcycle icon for courier
const courierIcon = `data:image/svg+xml,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50">
    <circle cx="25" cy="25" r="24" fill="#F97316" stroke="white" stroke-width="2"/>
    <path d="M15 30c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5-2 4.5-4.5 4.5-4.5-2-4.5-4.5zm16 0c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5-2 4.5-4.5 4.5-4.5-2-4.5-4.5z" fill="white"/>
    <rect x="20" y="22" width="10" height="8" rx="2" fill="white"/>
    <rect x="22" y="18" width="6" height="5" rx="1" fill="white"/>
    <circle cx="25" cy="16" r="3" fill="white"/>
  </svg>
`)}`

export default function CourierMap({ 
  pickup, 
  delivery, 
  courier, 
  jobStatus,
  onRefresh,
  autoRefresh = true,
  refreshInterval = 10000 // 10 seconds
}) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef({})
  const directionsRendererRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(new Date())

  // Initialize Google Maps
  useEffect(() => {
    const initMap = async () => {
      try {
        const loader = new Loader({
          apiKey: GOOGLE_MAPS_API_KEY,
          version: 'weekly',
          libraries: ['places', 'geometry']
        })

        const google = await loader.load()
        
        // Calculate center point
        let center = { lat: -1.2921, lng: 36.8219 } // Default to Nairobi
        
        if (pickup?.lat && pickup?.lng) {
          center = { lat: pickup.lat, lng: pickup.lng }
        }

        // Create map
        const map = new google.maps.Map(mapRef.current, {
          center,
          zoom: 13,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ],
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        })

        mapInstanceRef.current = map

        // Initialize directions renderer
        directionsRendererRef.current = new google.maps.DirectionsRenderer({
          map,
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: '#10B981',
            strokeWeight: 4,
            strokeOpacity: 0.8
          }
        })

        setLoading(false)
        updateMarkers()
      } catch (err) {
        console.error('Error loading Google Maps:', err)
        setError('Failed to load map')
        setLoading(false)
      }
    }

    initMap()

    return () => {
      // Cleanup markers
      Object.values(markersRef.current).forEach(marker => marker?.setMap(null))
    }
  }, [])

  // Update markers when locations change
  const updateMarkers = useCallback(async () => {
    if (!mapInstanceRef.current) return

    const google = window.google
    const map = mapInstanceRef.current

    // Clear existing markers
    Object.values(markersRef.current).forEach(marker => marker?.setMap(null))
    markersRef.current = {}

    const bounds = new google.maps.LatLngBounds()

    // Add pickup marker
    if (pickup?.lat && pickup?.lng && pickup.lat !== 0 && pickup.lng !== 0) {
      const pickupMarker = new google.maps.Marker({
        position: { lat: pickup.lat, lng: pickup.lng },
        map,
        icon: {
          url: createMarkerIcon('#22C55E', 'P'),
          scaledSize: new google.maps.Size(40, 50),
          anchor: new google.maps.Point(20, 50)
        },
        title: 'Pickup Location',
        zIndex: 1
      })
      
      const pickupInfo = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; max-width: 200px;">
            <strong style="color: #22C55E;">📦 Pickup</strong>
            <p style="margin: 4px 0 0; font-size: 12px; color: #666;">${pickup.address || 'Pickup location'}</p>
          </div>
        `
      })
      
      pickupMarker.addListener('click', () => {
        pickupInfo.open(map, pickupMarker)
      })
      
      markersRef.current.pickup = pickupMarker
      bounds.extend(pickupMarker.getPosition())
    }

    // Add delivery marker
    if (delivery?.lat && delivery?.lng && delivery.lat !== 0 && delivery.lng !== 0) {
      const deliveryMarker = new google.maps.Marker({
        position: { lat: delivery.lat, lng: delivery.lng },
        map,
        icon: {
          url: createMarkerIcon('#EF4444', 'D'),
          scaledSize: new google.maps.Size(40, 50),
          anchor: new google.maps.Point(20, 50)
        },
        title: 'Delivery Location',
        zIndex: 1
      })
      
      const deliveryInfo = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; max-width: 200px;">
            <strong style="color: #EF4444;">🏠 Delivery</strong>
            <p style="margin: 4px 0 0; font-size: 12px; color: #666;">${delivery.address || 'Delivery location'}</p>
          </div>
        `
      })
      
      deliveryMarker.addListener('click', () => {
        deliveryInfo.open(map, deliveryMarker)
      })
      
      markersRef.current.delivery = deliveryMarker
      bounds.extend(deliveryMarker.getPosition())
    }

    // Add courier marker (if assigned and has valid location)
    if (courier?.lat && courier?.lng && courier.lat !== 0 && courier.lng !== 0) {
      const courierMarker = new google.maps.Marker({
        position: { lat: courier.lat, lng: courier.lng },
        map,
        icon: {
          url: courierIcon,
          scaledSize: new google.maps.Size(50, 50),
          anchor: new google.maps.Point(25, 25)
        },
        title: `Courier: ${courier.name}`,
        zIndex: 2,
        animation: google.maps.Animation.BOUNCE
      })
      
      // Stop bouncing after 2 seconds
      setTimeout(() => {
        courierMarker.setAnimation(null)
      }, 2000)
      
      const courierInfo = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; max-width: 200px;">
            <strong style="color: #F97316;">🏍️ Courier</strong>
            <p style="margin: 4px 0 0; font-size: 14px; font-weight: 500;">${courier.name}</p>
            <p style="margin: 2px 0 0; font-size: 11px; color: #666;">
              ${jobStatus === 'picking' ? 'Heading to pickup' : 'Delivering your parcel'}
            </p>
          </div>
        `
      })
      
      courierMarker.addListener('click', () => {
        courierInfo.open(map, courierMarker)
      })
      
      markersRef.current.courier = courierMarker
      bounds.extend(courierMarker.getPosition())
    }

    // Draw route
    if (pickup?.lat && delivery?.lat && directionsRendererRef.current) {
      try {
        const directionsService = new google.maps.DirectionsService()
        
        // Determine waypoints based on status
        let origin, destination
        
        if (courier?.lat && courier?.lng && courier.lat !== 0 && courier.lng !== 0) {
          if (jobStatus === 'picking') {
            // Courier going to pickup
            origin = { lat: courier.lat, lng: courier.lng }
            destination = { lat: pickup.lat, lng: pickup.lng }
          } else {
            // Courier delivering
            origin = { lat: courier.lat, lng: courier.lng }
            destination = { lat: delivery.lat, lng: delivery.lng }
          }
        } else {
          // No courier yet, show pickup to delivery route
          origin = { lat: pickup.lat, lng: pickup.lng }
          destination = { lat: delivery.lat, lng: delivery.lng }
        }
        
        const result = await directionsService.route({
          origin,
          destination,
          travelMode: google.maps.TravelMode.DRIVING,
        })
        
        directionsRendererRef.current.setDirections(result)
      } catch (err) {
        console.log('Could not calculate route:', err)
      }
    }

    // Fit bounds if we have markers
    if (Object.keys(markersRef.current).length > 0) {
      map.fitBounds(bounds, { padding: 60 })
      
      // Don't zoom in too much for single marker
      const listener = google.maps.event.addListener(map, 'idle', () => {
        if (map.getZoom() > 16) {
          map.setZoom(16)
        }
        google.maps.event.removeListener(listener)
      })
    }

    setLastUpdated(new Date())
  }, [pickup, delivery, courier, jobStatus])

  // Update markers when data changes
  useEffect(() => {
    if (!loading && mapInstanceRef.current) {
      updateMarkers()
    }
  }, [pickup, delivery, courier, jobStatus, loading, updateMarkers])

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !onRefresh) return
    
    // Only auto-refresh for active jobs
    if (!['picking', 'delivering'].includes(jobStatus)) return

    const interval = setInterval(() => {
      onRefresh()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, onRefresh, jobStatus, refreshInterval])

  const handleManualRefresh = () => {
    if (onRefresh) {
      onRefresh()
    }
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-xl p-6 text-center">
        <MapPin className="w-12 h-12 text-red-400 mx-auto mb-2" />
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Navigation className="w-5 h-5 text-orange-500" />
          <h3 className="font-semibold text-gray-700">Live Tracking</h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">
            Updated {lastUpdated.toLocaleTimeString()}
          </span>
          {['picking', 'delivering'].includes(jobStatus) && (
            <button
              onClick={handleManualRefresh}
              className="p-1.5 hover:bg-gray-100 rounded-full transition"
              title="Refresh location"
            >
              <RefreshCw className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {/* Map Container */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
          </div>
        )}
        <div ref={mapRef} className="w-full h-64 md:h-80" />
      </div>

      {/* Legend */}
      <div className="px-4 py-3 bg-gray-50 border-t">
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            <span className="text-gray-600">Pickup</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            <span className="text-gray-600">Delivery</span>
          </div>
          {courier && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-orange-500"></span>
              <span className="text-gray-600">Courier ({courier.name})</span>
            </div>
          )}
        </div>
        
        {/* Status Message */}
        {courier && (
          <p className="text-center text-sm text-gray-500 mt-2">
            {jobStatus === 'picking' && '🏍️ Courier is heading to pickup location'}
            {jobStatus === 'delivering' && '📦 Courier is delivering your parcel'}
          </p>
        )}
        
        {!courier && jobStatus === 'processing' && (
          <p className="text-center text-sm text-gray-500 mt-2">
            ⏳ Waiting for a courier to accept your job
          </p>
        )}
      </div>
    </div>
  )
}
