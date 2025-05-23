'use client'
import { useEffect, useRef, useState } from 'react'

export default function TestMap() {
  const [mounted, setMounted] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const mapContainer = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
    console.log('Token:', process.env.NEXT_PUBLIC_MAPBOX_TOKEN)
    
    // FIXED: Better way to handle mapbox import
    const loadMap = async () => {
      try {
        // Import both default and named exports
        const mapboxModule = await import('mapbox-gl')
        const mapboxgl = mapboxModule.default
        
        console.log('Mapbox object:', mapboxgl)
        console.log('Has Map?', !!mapboxgl.Map)
        console.log('Current accessToken:', mapboxgl.accessToken)
        
        if (!mapContainer.current) {
          setError('Map container not found')
          return
        }
        
        // Set the access token BEFORE creating map
        mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!
        console.log('Token set successfully')
        
        const map = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v11',
          center: [-74.006, 40.7128],
          zoom: 9
        })
        
        map.on('load', () => {
          console.log('🎉 Map loaded successfully!')
          setSuccess('Map loaded successfully!')
        })
        
        map.on('error', (e) => {
          console.error('Map load error:', e)
          setError(`Map load error: ${e.error?.message}`)
        })
        
      } catch (err: any) {
        console.error('Import/init error:', err)
        setError(`Import error: ${err.message}`)
      }
    }
    
    if (mounted) {
      loadMap()
    }
  }, [mounted])

  if (!mounted) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Map Debug Test v2</h1>
      
      <div className="mb-4 space-y-2">
        <p>✅ Component mounted: Yes</p>
        <p>✅ Token exists: {process.env.NEXT_PUBLIC_MAPBOX_TOKEN ? 'Yes' : 'No'}</p>
        {success && <p className="text-green-600">✅ {success}</p>}
        {error && <p className="text-red-600">❌ {error}</p>}
      </div>
      
      <div 
        ref={mapContainer} 
        className="w-full h-96 border-2 border-gray-300 bg-gray-100"
      />
      
      <div className="mt-4 text-sm text-gray-600">
        <p>Open browser console (F12) for detailed logs</p>
        <p>If you see a map above, success! 🎉</p>
      </div>
    </div>
  )
}