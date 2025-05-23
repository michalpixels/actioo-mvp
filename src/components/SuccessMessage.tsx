'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, X } from 'lucide-react'

export default function SuccessMessage() {
  const [show, setShow] = useState(false)
  const [message, setMessage] = useState('')
  const [mounted, setMounted] = useState(false)
  const searchParams = useSearchParams()

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    
    const success = searchParams.get('success')
    
    if (success === 'spot-created') {
      setMessage('🎉 Awesome! Your spot has been added to the community!')
      setShow(true)
      
      // Auto-hide after 5 seconds
      setTimeout(() => setShow(false), 5000)
    }
  }, [searchParams, mounted])

  // Don't render anything until mounted (prevents hydration mismatch)
  if (!mounted || !show) return null

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <div className="bg-green-100 border border-green-200 rounded-lg p-4 shadow-lg">
        <div className="flex items-start space-x-3">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-800">{message}</p>
            <p className="text-xs text-green-600 mt-1">
              Other athletes can now discover this epic spot!
            </p>
          </div>
          <button
            onClick={() => setShow(false)}
            className="text-green-400 hover:text-green-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}