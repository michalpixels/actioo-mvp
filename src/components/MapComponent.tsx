'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

interface Spot {
  id: string
  name: string
  latitude: number
  longitude: number
  sport_type: string
  difficulty: string
  rating: number
  description?: string | null
}

interface MapComponentProps {
  spots: Spot[]
  onSpotClick?: (spot: Spot) => void
  onMapClick?: (lng: number, lat: number) => void
  className?: string
}

export default function MapComponent({ spots, onSpotClick, onMapClick, className = "w-full h-96" }: MapComponentProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markers = useRef<mapboxgl.Marker[]>([])
  const [mounted, setMounted] = useState(false)
  
  // ✅ FIXED: Use state instead of ref so React can track changes
  const [mapInitialized, setMapInitialized] = useState(false)
  const initializingMap = useRef(false)

  // Prevent hydration mismatch - only run on client
  useEffect(() => {
    setMounted(true)
  }, [])

  // ✅ MEMOIZE: Map click handler to prevent unnecessary re-renders
  const handleMapClick = useCallback((e: mapboxgl.MapMouseEvent) => {
    if (onMapClick) {
      onMapClick(e.lngLat.lng, e.lngLat.lat)
    }
  }, [onMapClick])

  // ✅ IMPROVED: Map initialization with better guards
  useEffect(() => {
    // Guard against multiple conditions
    if (!mounted || !mapContainer.current || mapInitialized || initializingMap.current) {
      return
    }

    console.log('🗺️ Initializing Mapbox map (should only see this once)')
    initializingMap.current = true

    // Set token and create map
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [-98.5795, 39.8283], // Center of US
      zoom: 4
    })

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

    // Add click handler for adding new spots
    map.current.on('click', handleMapClick)

    // Mark as initialized when map loads
    map.current.on('load', () => {
      console.log('✅ Mapbox map loaded successfully')
      setMapInitialized(true) // ✅ FIXED: Use setState instead of ref
      initializingMap.current = false
    })

    // Try to get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude
          const lng = position.coords.longitude
          map.current?.flyTo({ center: [lng, lat], zoom: 12 })
        },
        () => {
          // Geolocation failed, stay at default location
        }
      )
    }

    return () => {
      console.log('🧹 Cleaning up Mapbox map')
      // ✅ IMPROVED: Comprehensive cleanup
      if (map.current) {
        map.current.off('click', handleMapClick)
        markers.current.forEach(marker => marker.remove())
        markers.current = []
        map.current.remove()
        map.current = null
      }
      setMapInitialized(false) // ✅ FIXED: Reset state instead of ref
      initializingMap.current = false
    }
  }, [mounted, handleMapClick]) // ✅ FIXED: Only depend on mounted and memoized click handler

  // ✅ IMPROVED: Add spots to map with better guards
  useEffect(() => {
    if (!mounted || !map.current || !mapInitialized) {
      return
    }

    console.log('📍 Adding spots to map:', spots.length)

    // Clear existing markers
    markers.current.forEach(marker => marker.remove())
    markers.current = []

    // Add markers for each spot
    spots.forEach(spot => {
      const markerElement = document.createElement('div')
      markerElement.className = 'marker'
      markerElement.style.width = '30px'
      markerElement.style.height = '30px'
      markerElement.style.borderRadius = '50%'
      markerElement.style.backgroundColor = getSportColor(spot.sport_type)
      markerElement.style.border = '3px solid white'
      markerElement.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)'
      markerElement.style.cursor = 'pointer'

      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat([spot.longitude, spot.latitude])
        .setPopup(new mapboxgl.Popup({ 
          offset: [0, 0], // ✅ CENTERED: No offset to center popup on pin
          maxWidth: '380px', // ✅ WIDER: Increased from 280px to 380px
          closeButton: true,
          closeOnClick: false // ✅ Only close with X button for better UX
        }).setHTML(`
          <style>
            /* ✅ BIGGER CLOSE BUTTON */
            .mapboxgl-popup-close-button {
              font-size: 20px !important;
              width: 30px !important;
              height: 30px !important;
              line-height: 30px !important;
              border-radius: 50% !important;
              background: rgba(0, 0, 0, 0.1) !important;
              color: #374151 !important;
              font-weight: bold !important;
            }
            .mapboxgl-popup-close-button:hover {
              background: rgba(239, 68, 68, 0.1) !important;
              color: #dc2626 !important;
            }
            /* ✅ WIDER & SHORTER POPUP */
            .mapboxgl-popup-content {
              border-radius: 12px !important;
              box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15) !important;
              border: 2px solid #e5e7eb !important;
              max-height: 280px !important; /* Limit height to make it wider than tall */
            }
            .mapboxgl-popup-tip {
              display: none !important; /* Hide the tip/arrow for cleaner centered look */
            }
          </style>
          <div class="p-4 max-h-64 overflow-y-auto">
            <h3 class="font-bold text-lg mb-3 text-gray-900 pr-6">${spot.name}</h3>
            
            <!-- ✅ WIDER: Action buttons section -->
            <div class="mb-3 grid grid-cols-2 gap-2">
              <button 
                onclick="navigator.clipboard.writeText('${spot.latitude.toFixed(6)}, ${spot.longitude.toFixed(6)}'); this.innerHTML='✅ Copied!'; setTimeout(() => this.innerHTML='📋 Copy', 2000)"
                class="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded text-sm font-medium transition-colors"
                title="Copy coordinates to clipboard"
              >
                📋 Copy
              </button>
              <button 
                onclick="window.open('https://www.google.com/maps/dir/?api=1&destination=${spot.latitude.toFixed(6)},${spot.longitude.toFixed(6)}', '_blank')"
                class="bg-green-100 hover:bg-green-200 text-green-700 px-3 py-2 rounded text-sm font-medium transition-colors"
                title="Navigate with Google Maps"
              >
                🗺️ Navigate
              </button>
            </div>
            
            <!-- ✅ Coordinates display -->
            <div class="mb-3 p-2 bg-gray-50 rounded text-xs">
              <div class="flex items-center justify-between">
                <span class="font-medium text-gray-700">📍 Coordinates:</span>
                <span class="font-mono text-gray-600 select-all">
                  ${spot.latitude.toFixed(6)}, ${spot.longitude.toFixed(6)}
                </span>
              </div>
            </div>
            
            <!-- ✅ WIDER: Sport info in horizontal layout -->
            <div class="grid grid-cols-3 gap-3 text-sm mb-3">
              <div class="flex items-center">
                <span class="inline-block w-3 h-3 rounded-full mr-2" style="background-color: ${getSportColor(spot.sport_type)}"></span>
                <span class="text-gray-700 font-medium">${formatSportType(spot.sport_type)}</span>
              </div>
              <div class="text-center">
                <span class="text-gray-600">Difficulty:</span>
                <span class="text-gray-900 font-medium">${capitalizeFirst(spot.difficulty)}</span>
              </div>
              <div class="text-center">
                <span class="text-gray-600">Rating:</span>
                <span class="text-gray-900 font-medium">${spot.rating}/5 ⭐</span>
              </div>
            </div>
            
            ${spot.description ? `<div class="mt-3 p-2 bg-blue-50 rounded"><p class="text-sm text-gray-700 italic">"${spot.description}"</p></div>` : ''}
            
            ${onSpotClick ? '<div class="mt-3 pt-2 border-t border-gray-200"><p class="text-xs text-blue-600 cursor-pointer hover:text-blue-800">📍 Click marker for more details</p></div>' : ''}
          </div>
        `))
        .addTo(map.current!)

      // Add click handler for spot details
      if (onSpotClick) {
        markerElement.addEventListener('click', (e) => {
          e.stopPropagation()
          onSpotClick(spot)
        })
      }

      markers.current.push(marker)
    })

    // Fit map to show all spots if any exist
    if (spots.length > 0) {
      const bounds = new mapboxgl.LngLatBounds()
      spots.forEach(spot => {
        bounds.extend([spot.longitude, spot.latitude])
      })
      map.current.fitBounds(bounds, { 
        padding: 50,
        maxZoom: 15
      })
    }
  }, [mounted, spots, onSpotClick, mapInitialized]) // ✅ FIXED: Use state instead of ref

  // Show loading state until mounted (prevents hydration mismatch)
  if (!mounted) {
    return (
      <div className={`${className} rounded-lg overflow-hidden shadow-md border border-gray-200 bg-gray-100 flex items-center justify-center`}>
        <div className="text-gray-500">Loading map...</div>
      </div>
    )
  }

  return (
    <div className={`${className} rounded-lg overflow-hidden shadow-md border border-gray-200`}>
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  )
}

function getSportColor(sportType: string): string {
  const colors: { [key: string]: string } = {
    skateboarding: '#ef4444',      // red
    surfing: '#3b82f6',            // blue  
    mountain_biking: '#22c55e',    // green
    snowboarding: '#8b5cf6',       // purple
    bmx: '#f59e0b',                // amber
    rock_climbing: '#6b7280'       // gray
  }
  return colors[sportType] || '#6b7280'
}

function formatSportType(sportType: string): string {
  return sportType.replace('_', ' ').split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}