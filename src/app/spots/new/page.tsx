// src/app/spots/new/page.tsx - SECURE VERSION
import { createServerSupabaseClient } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import AddSpotForm from '@/components/AddSpotForm'

async function getAuthenticatedUser() {
  const supabase = await createServerSupabaseClient()
  
  try {
    // Use secure getUser() method
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (!error && user) {
      return user
    }
  } catch (error) {
    console.log('User not authenticated')
  }
  
  return null
}

export default async function NewSpotPage() {
  // Use secure authentication check
  const user = await getAuthenticatedUser()

  if (!user) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <a href="/" className="text-2xl font-bold text-blue-600">Actioo</a>
              <span className="text-gray-400">•</span>
              <h1 className="text-xl font-semibold text-gray-900">Add New Spot</h1>
            </div>
            
            <a
              href="/"
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              ← Back to Dashboard
            </a>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Discover a New Spot 🤘
              </h2>
              <p className="text-gray-600">
                Share an epic location with the Actioo community. Your spot will help others discover amazing places to ride, skate, surf, and more!
              </p>
            </div>

            <AddSpotForm />
          </div>
        </div>
      </div>
    </div>
  )
}