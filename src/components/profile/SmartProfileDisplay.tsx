'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { User, MapPin, Instagram, Calendar, Trophy } from 'lucide-react'

interface ProfileData {
  id: string
  name: string
  email: string
  sport: string | null
  skill_level: string
  location: string | null
  bio: string | null
  profile_photo_url: string | null
  instagram_handle: string | null
  privacy_settings: any
  email_preferences: any
  spots_discovered: number
  sessions_attended: number
  created_at: string
}

interface SmartProfileDisplayProps {
  initialProfile: ProfileData
  userSpotsCount: number
}

export default function SmartProfileDisplay({ initialProfile, userSpotsCount }: SmartProfileDisplayProps) {
  const [profile, setProfile] = useState<ProfileData>(initialProfile)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const supabase = createClient()

  // ✅ FIX: Prevent hydration mismatch by only rendering client-specific content after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  // ✅ SMART REFRESH: Check for profile update flag and refresh only profile data
  useEffect(() => {
    const checkForProfileUpdates = async () => {
      const refreshFlag = sessionStorage.getItem('refreshProfileOnly')
      const lastUpdated = sessionStorage.getItem('profileLastUpdated')
      
      if (refreshFlag === 'true') {
        console.log('🔄 Refreshing profile data only (not entire dashboard)')
        setLoading(true)
        
        try {
          const { data: updatedProfile, error } = await supabase
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
            .eq('id', initialProfile.id)
            .single()

          if (!error && updatedProfile) {
            setProfile(updatedProfile)
            console.log('✅ Profile data refreshed:', updatedProfile.name)
          }
        } catch (error) {
          console.error('Error refreshing profile:', error)
        } finally {
          setLoading(false)
        }
        
        // Clear the flags
        sessionStorage.removeItem('refreshProfileOnly')
        sessionStorage.removeItem('profileLastUpdated')
      }
    }

    // Check on component mount
    checkForProfileUpdates()

    // Also check when page becomes visible (browser back button)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setTimeout(checkForProfileUpdates, 100)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [supabase, initialProfile.id])

  // Calculate profile completion
  const getProfileCompletion = () => {
    const fields = [
      profile.name,
      profile.sport,
      profile.skill_level,
      profile.location,
      profile.bio,
      profile.profile_photo_url
    ]
    
    const completedFields = fields.filter(field => field && field.toString().trim() !== '').length
    return Math.round((completedFields / fields.length) * 100)
  }

  // ✅ HELPER: Format date consistently for server/client
  const formatMemberSince = (dateString: string) => {
    if (!mounted) {
      // Return a consistent format during SSR
      const date = new Date(dateString)
      const year = date.getFullYear()
      const month = date.toLocaleString('en-US', { month: 'long' })
      return `${month} ${year}`
    }
    
    // Client-side can use full date formatting
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    })
  }

  const profileCompletion = getProfileCompletion()

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Loading overlay for smooth updates */}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg z-10">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      )}
      
      <div className="relative">
        {/* Profile Photo */}
        <div className="text-center mb-6">
          {profile.profile_photo_url ? (
            <img 
              src={profile.profile_photo_url} 
              alt={profile.name}
              className="w-20 h-20 rounded-full object-cover mx-auto border-4 border-white shadow-lg"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 mx-auto flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
          )}
        </div>

        {/* Profile Info */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">{profile.name}</h3>
          {profile.location && (
            <p className="text-gray-600 text-sm mt-1 flex items-center justify-center">
              <MapPin className="w-3 h-3 mr-1" />
              {profile.location}
            </p>
          )}
          <p className="text-gray-500 text-xs mt-2">
            Member since {formatMemberSince(profile.created_at)}
          </p>
        </div>

        {/* Bio */}
        {profile.bio && (
          <div className="mb-6 p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-700">{profile.bio}</p>
          </div>
        )}

        {/* Sport & Skill */}
        {profile.sport && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Primary Sport:</span>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-2 mb-2">
              <span className="text-sm text-blue-800 font-medium">
                {profile.sport.charAt(0).toUpperCase() + profile.sport.slice(1).replace('_', ' ')}
              </span>
            </div>
            <div className="flex items-center">
              <Trophy className="w-3 h-3 text-yellow-500 mr-1" />
              <span className="text-xs text-gray-600">
                {profile.skill_level.charAt(0).toUpperCase() + profile.skill_level.slice(1)}
              </span>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-md">
            <div className="text-lg font-bold text-gray-900">{userSpotsCount}</div>
            <div className="text-xs text-gray-600">Spots</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-md">
            <div className="text-lg font-bold text-gray-900">{profile.sessions_attended || 0}</div>
            <div className="text-xs text-gray-600">Sessions</div>
          </div>
        </div>

        {/* Profile Completion */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Profile Completion</span>
            <span className="text-sm text-gray-600">{profileCompletion}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${profileCompletion}%` }}
            ></div>
          </div>
          {profileCompletion < 100 && (
            <p className="text-xs text-gray-500 mt-2">
              Complete your profile to connect with more athletes!
            </p>
          )}
        </div>

        {/* Social Links */}
        {profile.instagram_handle && (
          <div className="mb-6">
            <a 
              href={`https://instagram.com/${profile.instagram_handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 px-4 rounded-md hover:from-purple-600 hover:to-pink-600 transition-colors text-sm"
            >
              <Instagram className="w-4 h-4 mr-2" />
              @{profile.instagram_handle}
            </a>
          </div>
        )}

        {/* Edit Profile Button */}
        <a
          href="/profile/edit"
          className="block w-full bg-blue-600 text-white text-center py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          Edit Profile
        </a>
      </div>
    </div>
  )
}