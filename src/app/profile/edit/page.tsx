// src/app/profile/edit/page.tsx
import { createServerSupabaseClient } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import ProfileEditForm from '@/components/profile/ProfileEditForm'
import Link from 'next/link'

// Make this page dynamic to avoid static generation issues
export const dynamic = 'force-dynamic'

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

export default async function ProfileEditPage() {
  const supabase = await createServerSupabaseClient()
  
  // Get current session
  const user = await getAuthenticatedUser()

  if (!user) {
    redirect('/')
  }

  // Get current profile data
  const { data: profile, error } = await supabase
    .from('profiles')
    .select(`
      *,
      bio,
      profile_photo_url,
      instagram_handle,
      privacy_settings,
      email_preferences,
      achievements,
      spots_discovered
    `)
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('Error fetching profile:', error)
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-2xl font-bold text-blue-600">Actioo</Link>
              <span className="text-gray-400">•</span>
              <h1 className="text-xl font-semibold text-gray-900">Edit Profile</h1>
            </div>
            
            <Link
              href="/"
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Your Athlete Profile 🏃‍♂️
            </h2>
            <p className="text-gray-600">
              Complete your profile to connect with your local action sports community
            </p>
          </div>

          {/* Profile Edit Form */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <ProfileEditForm initialData={profile} />
          </div>
        </div>
      </div>
    </div>
  )
}