// src/app/page.tsx - UPDATED with Smart Profile Display
import { createServerSupabaseClient } from '@/lib/supabase'
import Auth from '@/components/Auth'
import MapComponent from '@/components/MapComponent'
import SuccessMessage from '@/components/SuccessMessage'
import SmartProfileDisplay from '@/components/profile/SmartProfileDisplay' // ✅ CHANGED
import SignOutButton from '@/components/SignOutButton'
import { Users, MapPin, Calendar, TrendingUp } from 'lucide-react'

async function getAuthenticatedSession() {
  const supabase = await createServerSupabaseClient()
  
  try {
    // Try getUser() first (secure method)
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (!error && user) {
      // Return a session-like object for compatibility
      return { session: { user } }
    }
  } catch (error) {
    // If getUser() fails, user is not authenticated
    console.log('User not authenticated')
  }
  
  return { session: null }
}

export default async function Home() {
  const supabase = await createServerSupabaseClient()
  
  // Use secure authentication method
  const { session } = await getAuthenticatedSession()
  
  // If not logged in, show auth page
  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Welcome to <span className="text-blue-600">Actioo</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Connect with local action sports enthusiasts, discover epic spots, and join sessions in your area.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <MapPin className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Discover Spots</h3>
                <p className="text-gray-600 text-sm">Find the best skateparks, surf breaks, mountain bike trails, and more in your area.</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <Users className="w-8 h-8 text-green-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect Locally</h3>
                <p className="text-gray-600 text-sm">Meet fellow athletes at your skill level and build your local crew.</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <Calendar className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Join Sessions</h3>
                <p className="text-gray-600 text-sm">Organize meetups and never ride, skate, or surf alone again.</p>
              </div>
            </div>
          </div>
          
          <Auth />
        </div>
      </div>
    )
  }

  // Get user data and spots using secure session - ENHANCED with new profile fields
  const [
    { data: profile },
    { data: spots },
    { data: allUsers }
  ] = await Promise.all([
    supabase
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
      .eq('id', session.user.id)
      .single(),
    
    supabase
      .from('spots')
      .select('*')
      .order('created_at', { ascending: false }),
    
    supabase
      .from('profiles')
      .select('id')
  ])

  // Calculate counts from actual data
  const totalSpots = spots?.length || 0
  const totalUsers = allUsers?.length || 0
  const userSpots = spots?.filter(spot => spot.created_by === session.user.id) || []
  const userSpotsCount = userSpots.length

  return (
    <div className="min-h-screen bg-gray-50">
      <SuccessMessage />
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-blue-600">Actioo</h1>
              <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600">
                <span>•</span>
                <span>Action Sports Community</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm text-gray-600">Welcome back,</p>
                <p className="font-semibold text-gray-900">{profile?.name} 🤘</p>
              </div>
              
              {/* Profile Photo in Header */}
              {profile?.profile_photo_url && (
                <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-blue-200">
                  <img 
                    src={profile.profile_photo_url} 
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <SignOutButton />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Banner for new users or incomplete profiles */}
        {(!profile?.sport || !profile?.location) && (
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold mb-2">Complete Your Athlete Profile!</h2>
                <p className="text-blue-100">
                  Tell the community about your sport, location, and experience to connect with fellow athletes.
                </p>
              </div>
              <a
                href="/profile/edit"
                className="bg-white text-blue-600 px-6 py-2 rounded-md font-medium hover:bg-blue-50 transition-colors"
              >
                Complete Profile
              </a>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Your Spots</p>
                <p className="text-2xl font-bold text-blue-600">{userSpotsCount}</p>
              </div>
              <MapPin className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sessions</p>
                <p className="text-2xl font-bold text-green-600">{profile?.sessions_attended || 0}</p>
              </div>
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Community</p>
                <p className="text-2xl font-bold text-purple-600">{totalUsers}</p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Spots</p>
                <p className="text-2xl font-bold text-orange-600">{totalSpots}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Map Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Discover Spots</h2>
                  <p className="text-gray-600 text-sm">Explore action sports locations in your area</p>
                </div>
                <a
                  href="/spots/new"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Add Spot
                </a>
              </div>
              
              {spots && spots.length > 0 ? (
                <MapComponent 
                  spots={spots} 
                  className="w-full h-80"
                />
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                  <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No spots discovered yet!</h3>
                  <p className="text-gray-600 mb-4">Be the first to add an epic spot to the community.</p>
                  <a
                    href="/spots/new"
                    className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors font-medium"
                  >
                    Add Your First Spot
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Enhanced Profile Card */}
            {profile && (
              <SmartProfileDisplay 
                initialProfile={profile} 
                userSpotsCount={userSpotsCount}
              />
            )}

            {/* Recent Spots */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Your Recent Spots</h3>
              {userSpots && userSpots.length > 0 ? (
                <div className="space-y-3">
                  {userSpots.slice(0, 5).map((spot) => (
                    <div key={spot.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-md transition-colors">
                      <div 
                        className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                        style={{ backgroundColor: getSportColor(spot.sport_type) }}
                      ></div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">{spot.name}</h4>
                        <p className="text-sm text-gray-600 capitalize">
                          {spot.sport_type.replace('_', ' ')} • {spot.difficulty}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">You haven't added any spots yet</p>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <a
                  href="/spots/new"
                  className="block w-full bg-blue-600 text-white text-center py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Add New Spot
                </a>
                <a
                  href="/profile/edit"
                  className="block w-full bg-gray-600 text-white text-center py-2 px-4 rounded-md hover:bg-gray-700 transition-colors text-sm font-medium"
                >
                  Edit Profile
                </a>
                <button
                  disabled
                  className="block w-full bg-gray-300 text-gray-500 text-center py-2 px-4 rounded-md text-sm font-medium cursor-not-allowed"
                >
                  Create Session (Coming Soon)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function getSportColor(sportType: string): string {
  const colors: { [key: string]: string } = {
    skateboarding: '#ef4444',
    surfing: '#3b82f6',
    mountain_biking: '#22c55e',
    snowboarding: '#8b5cf6',
    bmx: '#f59e0b',
    rock_climbing: '#6b7280'
  }
  return colors[sportType] || '#6b7280'
}