'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import mapboxgl from 'mapbox-gl'

const SPORT_TYPES = [
  { value: 'skateboarding', label: '🛹 Skateboarding', color: '#ef4444' },
  { value: 'surfing', label: '🏄 Surfing', color: '#3b82f6' },
  { value: 'mountain_biking', label: '🚵 Mountain Biking', color: '#22c55e' },
  { value: 'snowboarding', label: '🏂 Snowboarding', color: '#8b5cf6' },
  { value: 'bmx', label: '🚴 BMX', color: '#f59e0b' },
  { value: 'rock_climbing', label: '🧗 Rock Climbing', color: '#6b7280' }
]

const DIFFICULTY_LEVELS = [
  { value: 'beginner', label: '🟢 Beginner' },
  { value: 'intermediate', label: '🟡 Intermediate' },
  { value: 'advanced', label: '🔴 Advanced' }
]

export default function AddSpotForm() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [mounted, setMounted] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sport_type: '',
    difficulty: 'beginner',
    latitude: 0,
    longitude: 0
  })

  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const marker = useRef<mapboxgl.Marker | null>(null)
  
  const supabase = createClient()
  const router = useRouter()

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Initialize map after component mounts
  useEffect(() => {
    if (!mounted || !mapContainer.current) return

    try {
      console.log('Initializing map for AddSpotForm...')
      console.log('Token exists:', !!process.env.NEXT_PUBLIC_MAPBOX_TOKEN)

      // Set token
      mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [-98.5795, 39.8283], // Center of US
        zoom: 4
      })

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

      map.current.on('load', () => {
        console.log('Map loaded in AddSpotForm!')
        setMapLoaded(true)
      })

      map.current.on('error', (e) => {
        console.error('Map error in AddSpotForm:', e)
        setMessage('Map failed to load. Please check your internet connection.')
      })

      // Add click handler to place marker
      map.current.on('click', (e) => {
        const lat = e.lngLat.lat
        const lng = e.lngLat.lng

        console.log('Map clicked at:', lat, lng)

        // Remove existing marker
        if (marker.current) {
          marker.current.remove()
        }

        // Add new marker
        marker.current = new mapboxgl.Marker({ color: '#3b82f6' })
          .setLngLat([lng, lat])
          .addTo(map.current!)

        // Update form data
        setFormData(prev => ({
          ...prev,
          latitude: lat,
          longitude: lng
        }))
      })

      // Try to get user's location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude
            const lng = position.coords.longitude
            console.log('User location:', lat, lng)
            map.current?.flyTo({ center: [lng, lat], zoom: 12 })
          },
          (error) => {
            console.log('Geolocation failed:', error)
            // Stay at default location
          }
        )
      }

      return () => {
        console.log('Cleaning up map...')
        if (marker.current) marker.current.remove()
        if (map.current) map.current.remove()
      }
    } catch (error) {
      console.error('Map initialization error:', error)
      setMessage('Failed to initialize map. Please refresh the page.')
    }
  }, [mounted])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.latitude || !formData.longitude) {
      setMessage('Please click on the map to select a location')
      return
    }

    if (!formData.name.trim() || !formData.sport_type) {
      setMessage('Please fill in all required fields')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      // Get the current session to get access token
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('You must be logged in to add a spot')
      }

      console.log('Submitting spot data:', formData)

      const response = await fetch('/api/spots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}: Failed to create spot`)
      }

      console.log('Spot created successfully:', result)

      // Success! Redirect to dashboard
      router.push('/?success=spot-created')
    } catch (error: any) {
      console.error('Submit error:', error)
      setMessage(error.message || 'Failed to create spot')
    } finally {
      setLoading(false)
    }
  }

  // Don't render until mounted to prevent hydration issues
  if (!mounted) {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Spot Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Spot Name *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g., Venice Beach Skate Park, Mavericks Surf Break"
          required
        />
      </div>

      {/* Sport Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Sport Type *
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SPORT_TYPES.map((sport) => (
            <label
              key={sport.value}
              className={`flex items-center p-3 border rounded-md cursor-pointer transition-all ${
                formData.sport_type === sport.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input
                type="radio"
                name="sport_type"
                value={sport.value}
                checked={formData.sport_type === sport.value}
                onChange={(e) => setFormData(prev => ({ ...prev, sport_type: e.target.value }))}
                className="sr-only"
              />
              <span className="text-lg mr-2">{sport.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Difficulty Level */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Difficulty Level
        </label>
        <div className="flex space-x-4">
          {DIFFICULTY_LEVELS.map((level) => (
            <label
              key={level.value}
              className={`flex items-center p-3 border rounded-md cursor-pointer transition-all ${
                formData.difficulty === level.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input
                type="radio"
                name="difficulty"
                value={level.value}
                checked={formData.difficulty === level.value}
                onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value }))}
                className="sr-only"
              />
              <span className="text-sm font-medium">{level.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Tell us what makes this spot special! Any tips, rules, or insider knowledge?"
        />
      </div>

      {/* Location Map */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Location * 
          <span className="text-gray-500 text-xs ml-2">
            (Click on the map to select - {mapLoaded ? '✅ Map ready' : '⏳ Loading map...'})
          </span>
        </label>
        <div className="border border-gray-300 rounded-md overflow-hidden">
          <div 
            ref={mapContainer} 
            className="w-full h-64"
            style={{ minHeight: '250px' }}
          />
        </div>
        {formData.latitude && formData.longitude && (
          <p className="text-xs text-gray-600 mt-1">
            Selected: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
          </p>
        )}
      </div>

      {/* Error/Success Message */}
      {message && (
        <div className={`p-3 rounded-md text-sm ${
          message.includes('success') || message.includes('created')
            ? 'bg-green-100 text-green-700 border border-green-200'
            : 'bg-red-100 text-red-700 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end space-x-4">
        <a
          href="/"
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </a>
        <button
          type="submit"
          disabled={loading || !mapLoaded}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {loading ? 'Adding Spot...' : 'Add Spot'}
        </button>
      </div>

      {/* Debug Info */}
      <div className="text-xs text-gray-500 mt-4">
        Debug: Map loaded: {mapLoaded ? 'Yes' : 'No'} | 
        Token: {process.env.NEXT_PUBLIC_MAPBOX_TOKEN ? 'Present' : 'Missing'} |
        Location: {formData.latitude ? 'Selected' : 'Not selected'}
      </div>
    </form>
  )
}