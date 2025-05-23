'use client'
import { useEffect, useRef, useState } from 'react'
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

  // Prevent hydration mismatch - only run on client
  useEffect(() => {
    setMounted(true)
  }, [])

  // Initialize map only after component is mounted
  useEffect(() => {
    if (!mounted || !mapContainer.current) return

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
    if (onMapClick) {
      map.current.on('click', (e) => {
        onMapClick(e.lngLat.lng, e.lngLat.lat)
      })
    }

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
      // Cleanup
      markers.current.forEach(marker => marker.remove())
      map.current?.remove()
    }
  }, [mounted, onMapClick])

  // Add spots to map
  useEffect(() => {
    if (!mounted || !map.current) return

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
        .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div class="p-3 min-w-[200px]">
            <h3 class="font-bold text-lg mb-2 text-gray-900">${spot.name}</h3>
            <div class="space-y-1 text-sm">
              <p class="text-gray-600">
                <span class="inline-block w-2 h-2 rounded-full mr-2" style="background-color: ${getSportColor(spot.sport_type)}"></span>
                ${formatSportType(spot.sport_type)}
              </p>
              <p class="text-gray-600">
                <span class="font-medium">Difficulty:</span> ${capitalizeFirst(spot.difficulty)}
              </p>
              <p class="text-gray-600">
                <span class="font-medium">Rating:</span> ${spot.rating}/5 ⭐
              </p>
              ${spot.description ? `<p class="text-gray-700 mt-2 italic">"${spot.description}"</p>` : ''}
            </div>
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
  }, [mounted, spots, onSpotClick])

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