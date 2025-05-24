// src/app/(auth)/reset-password/page.tsx - FIXED VERSION
import ResetPasswordForm from '@/components/auth/ResetPasswordForm'
import Link from 'next/link'

// Make this page dynamic to avoid static generation issues
export const dynamic = 'force-dynamic'

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="text-3xl font-bold text-blue-600 hover:text-blue-700">
            Actioo
          </Link>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Reset your password
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your new password below.
          </p>
        </div>

        {/* Form */}
        <ResetPasswordForm />

        {/* Back to login */}
        <div className="text-center">
          <Link 
            href="/" 
            className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline"
          >
            ← Back to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}