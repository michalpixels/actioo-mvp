'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, X, User, MapPin } from 'lucide-react'

export default function SuccessMessage() {
  const [show, setShow] = useState(false)
  const [message, setMessage] = useState('')
  const [icon, setIcon] = useState<React.ReactNode>(null)
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
      setIcon(<MapPin className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />)
      setShow(true)
    } else if (success === 'profile-updated') {
      setMessage('🎉 Your athlete profile has been updated!')
      setIcon(<User className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />)
      setShow(true)
    }
    
    if (success) {
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => setShow(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [searchParams, mounted])

  // Don't render anything until mounted (prevents hydration mismatch)
  if (!mounted || !show) return null

  const getSubMessage = () => {
    const success = searchParams.get('success')
    if (success === 'spot-created') {
      return 'Other athletes can now discover this epic spot!'
    } else if (success === 'profile-updated') {
      return 'Your profile helps you connect better with the community!'
    }
    return ''
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <div className="bg-green-100 border border-green-200 rounded-lg p-4 shadow-lg animate-slide-in">
        <div className="flex items-start space-x-3">
          {icon || <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />}
          <div className="flex-1">
            <p className="text-sm font-medium text-green-800">{message}</p>
            {getSubMessage() && (
              <p className="text-xs text-green-600 mt-1">
                {getSubMessage()}
              </p>
            )}
          </div>
          <button
            onClick={() => setShow(false)}
            className="text-green-400 hover:text-green-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}