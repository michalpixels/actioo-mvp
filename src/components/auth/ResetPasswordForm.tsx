'use client'
import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react'

function ResetPasswordFormContent() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('error')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [mounted, setMounted] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Check for error in URL parameters
  useEffect(() => {
    if (!mounted) return
    
    const error = searchParams.get('error')
    const error_description = searchParams.get('error_description')
    
    if (error) {
      setMessage(error_description || 'Invalid or expired reset link. Please request a new one.')
      setMessageType('error')
    }
  }, [searchParams, mounted])

  const validatePassword = (pwd: string) => {
    if (pwd.length < 8) return 'Password must be at least 8 characters long'
    if (!/(?=.*[a-z])/.test(pwd)) return 'Password must contain at least one lowercase letter'
    if (!/(?=.*[A-Z])/.test(pwd)) return 'Password must contain at least one uppercase letter'
    if (!/(?=.*\d)/.test(pwd)) return 'Password must contain at least one number'
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    // Validate passwords match
    if (password !== confirmPassword) {
      setMessage('Passwords do not match')
      setMessageType('error')
      setLoading(false)
      return
    }

    // Validate password strength
    const passwordError = validatePassword(password)
    if (passwordError) {
      setMessage(passwordError)
      setMessageType('error')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        throw error
      }

      setMessage('Password updated successfully! Redirecting...')
      setMessageType('success')
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/')
      }, 2000)

    } catch (error: any) {
      setMessage(error.message || 'An error occurred. Please try again.')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="bg-white py-8 px-6 shadow-lg rounded-lg border border-gray-200">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  const passwordStrength = {
    length: password.length >= 8,
    lowercase: /(?=.*[a-z])/.test(password),
    uppercase: /(?=.*[A-Z])/.test(password),
    number: /(?=.*\d)/.test(password)
  }

  const isFormValid = password.length > 0 && 
                     confirmPassword.length > 0 && 
                     password === confirmPassword &&
                     Object.values(passwordStrength).every(Boolean)

  return (
    <div className="bg-white py-8 px-6 shadow-lg rounded-lg border border-gray-200">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* New Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            New Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your new password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-gray-400" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400" />
              )}
            </button>
          </div>
          
          {/* Password strength indicator */}
          {password && (
            <div className="mt-2 space-y-1">
              <div className="text-xs text-gray-600">Password requirements:</div>
              <div className="grid grid-cols-2 gap-1 text-xs">
                <div className={`flex items-center ${passwordStrength.length ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-2 h-2 rounded-full mr-1 ${passwordStrength.length ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  8+ characters
                </div>
                <div className={`flex items-center ${passwordStrength.lowercase ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-2 h-2 rounded-full mr-1 ${passwordStrength.lowercase ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  Lowercase
                </div>
                <div className={`flex items-center ${passwordStrength.uppercase ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-2 h-2 rounded-full mr-1 ${passwordStrength.uppercase ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  Uppercase
                </div>
                <div className={`flex items-center ${passwordStrength.number ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-2 h-2 rounded-full mr-1 ${passwordStrength.number ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  Number
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
            Confirm New Password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Confirm your new password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4 text-gray-400" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400" />
              )}
            </button>
          </div>
          
          {/* Password match indicator */}
          {confirmPassword && (
            <div className="mt-1 text-xs">
              {password === confirmPassword ? (
                <div className="text-green-600 flex items-center">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Passwords match
                </div>
              ) : (
                <div className="text-red-600 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Passwords do not match
                </div>
              )}
            </div>
          )}
        </div>

        {message && (
          <div className={`p-3 rounded-md text-sm flex items-start space-x-2 ${
            messageType === 'success' 
              ? 'bg-green-100 text-green-700 border border-green-200'
              : 'bg-red-100 text-red-700 border border-red-200'
          }`}>
            {messageType === 'success' ? (
              <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            )}
            <span>{message}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !isFormValid}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Updating password...
            </div>
          ) : (
            'Update password'
          )}
        </button>
      </form>
    </div>
  )
}

export default function ResetPasswordForm() {
  return (
    <Suspense fallback={
      <div className="bg-white py-8 px-6 shadow-lg rounded-lg border border-gray-200">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    }>
      <ResetPasswordFormContent />
    </Suspense>
  )
}