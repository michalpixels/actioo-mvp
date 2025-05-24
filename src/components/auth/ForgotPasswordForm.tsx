'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { CheckCircle, Mail, AlertCircle } from 'lucide-react'

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('error')
  const [emailSent, setEmailSent] = useState(false)
  
  // ✅ ADD: State to prevent rapid "try again" clicks
  const [canTryAgain, setCanTryAgain] = useState(true)

  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        throw error
      }

      setEmailSent(true)
      setMessage('Check your email for the password reset link!')
      setMessageType('success')
      
      // ✅ ADD: Prevent rapid "try again" for 30 seconds
      setCanTryAgain(false)
      setTimeout(() => {
        setCanTryAgain(true)
      }, 30000) // 30 seconds
      
    } catch (error: any) {
      setMessage(error.message || 'An error occurred. Please try again.')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  // ✅ MODIFY: Handle try again with timing check
  const handleTryAgain = () => {
    if (!canTryAgain) {
      setMessage('Please wait 30 seconds before requesting another reset link.')
      setMessageType('error')
      return
    }
    
    setEmailSent(false)
    setEmail('')
    setMessage('')
    setCanTryAgain(true) // Reset for new attempt
  }

  if (emailSent) {
    return (
      <div className="bg-white py-8 px-6 shadow-lg rounded-lg border border-gray-200">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Email sent!
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            We've sent a password reset link to <strong>{email}</strong>
          </p>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex items-start">
                <Mail className="h-5 w-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">Check your inbox</p>
                  <p>Click the link in the email to reset your password. The link will expire in 1 hour.</p>
                </div>
              </div>
            </div>
            
            {/* ✅ MODIFY: Try again button with timing protection */}
            <button
              onClick={handleTryAgain}
              disabled={!canTryAgain}
              className={`text-sm font-medium hover:underline ${
                !canTryAgain 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-blue-600 hover:text-blue-700'
              }`}
            >
              {!canTryAgain 
                ? "Please wait 30 seconds..." 
                : "Didn't receive it? Try again"
              }
            </button>
            
            {/* ✅ ADD: Show message if user tries too soon */}
            {message && messageType === 'error' && (
              <div className="mt-2 p-2 rounded-md text-xs bg-yellow-100 text-yellow-700 border border-yellow-200">
                <AlertCircle className="h-3 w-3 inline mr-1" />
                {message}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white py-8 px-6 shadow-lg rounded-lg border border-gray-200">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="your@email.com"
          />
        </div>

        {message && !emailSent && (
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
          disabled={loading || !email.trim()}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Sending...
            </div>
          ) : (
            'Send reset link'
          )}
        </button>
      </form>
    </div>
  )
}