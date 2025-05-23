'use client'
import { useEffect, useRef, useState } from 'react'

// Import mapbox normally (not dynamic)
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

export default function SimpleMapTest() {
  const [mounted, setMounted] = useState(false)
  const [status, setStatus] = useState('Initializing...')
  const mapContainer = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || !mapContainer.current) return

    try {
      setStatus('Setting up Mapbox...')
      
      // Set token
      mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''
      
      setStatus('Creating map...')
      
      const map = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [-74.006, 40.7128], // NYC
        zoom: 9
      })

      map.on('load', () => {
        setStatus('🎉 Map loaded successfully!')
        console.log('Map loaded!')
      })

      map.on('error', (e) => {
        setStatus(`❌ Map error: ${e.error?.message}`)
        console.error('Map error:', e)
      })

      // Cleanup
      return () => {
        map.remove()
      }
    } catch (error: any) {
      setStatus(`❌ Setup error: ${error.message}`)
      console.error('Setup error:', error)
    }
  }, [mounted])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Simple Map Test</h1>
      
      <div className="mb-4">
        <p className="font-medium">Status: {status}</p>
        <p className="text-sm text-gray-600">
          Token: {process.env.NEXT_PUBLIC_MAPBOX_TOKEN ? '✅ Present' : '❌ Missing'}
        </p>
      </div>
      
      <div 
        ref={mapContainer} 
        className="w-full h-96 border-2 border-blue-300 rounded"
        style={{ minHeight: '400px' }}
      />
    </div>
  )
}