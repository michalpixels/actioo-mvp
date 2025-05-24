// src/components/profile/ProfileDisplay.tsx - FIXED VERSION
import Link from 'next/link'
import { MapPin, Edit, User, Trophy, Instagram, Calendar, Star } from 'lucide-react'

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
  spots_discovered: number
  sessions_attended: number
  achievements: string[]
  created_at: string
}

interface ProfileDisplayProps {
  profile: ProfileData
  userSpotsCount: number
}

const ACHIEVEMENT_ICONS: { [key: string]: string } = {
  first_spot: '🎯',
  spot_explorer: '🗺️',
  local_legend: '⭐',
  early_adopter: '🚀',
  community_builder: '🏗️'
}

const ACHIEVEMENT_NAMES: { [key: string]: string } = {
  first_spot: 'First Spot',
  spot_explorer: 'Spot Explorer',
  local_legend: 'Local Legend',
  early_adopter: 'Early Adopter',
  community_builder: 'Community Builder'
}

function getSportColor(sport: string): string {
  const colors: { [key: string]: string } = {
    skateboarding: '#ef4444',
    surfing: '#3b82f6',
    mountain_biking: '#22c55e',
    snowboarding: '#8b5cf6',
    bmx: '#f59e0b',
    rock_climbing: '#6b7280',
    parkour: '#f97316',
    wakeboarding: '#06b6d4',
    kitesurfing: '#8b5cf6'
  }
  return colors[sport] || '#6b7280'
}

function formatSportName(sport: string): string {
  return sport.replace('_', ' ').split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
}

function getMembershipDuration(createdAt: string): string {
  const created = new Date(createdAt)
  const now = new Date()
  const diffInDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffInDays < 7) return 'New member'
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks`
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months`
  return `${Math.floor(diffInDays / 365)} years`
}

// FIXED: Profile completion calculation
function calculateProfileCompletion(profile: ProfileData): number {
  const fields = [
    { field: 'name', value: profile.name, required: true },
    { field: 'sport', value: profile.sport, required: false }, // Optional
    { field: 'location', value: profile.location, required: false }, // Optional  
    { field: 'bio', value: profile.bio, required: false }, // Optional
    { field: 'profile_photo', value: profile.profile_photo_url, required: false }, // Optional
    { field: 'skill_level', value: profile.skill_level, required: true } // Always has a value
  ]
  
  // Count core fields that are completed
  const coreFields = [
    !!profile.name?.trim(), // Name is required
    !!profile.sport, // Sport selection
    !!profile.skill_level, // Skill level (always true since it defaults)
    !!profile.location?.trim(), // Location
    !!profile.bio?.trim(), // Bio
    !!profile.profile_photo_url // Profile photo
  ]
  
  const completedCount = coreFields.filter(Boolean).length
  const totalFields = coreFields.length
  
  return Math.round((completedCount / totalFields) * 100)
}

export default function ProfileDisplay({ profile, userSpotsCount }: ProfileDisplayProps) {
  const membershipDuration = getMembershipDuration(profile.created_at)
  const achievements = profile.achievements || []
  const profileCompletion = calculateProfileCompletion(profile)

  // Debug logging (remove in production)
  console.log('Profile completion debug:', {
    name: !!profile.name?.trim(),
    sport: !!profile.sport,
    skill_level: !!profile.skill_level,
    location: !!profile.location?.trim(),
    bio: !!profile.bio?.trim(),
    photo: !!profile.profile_photo_url,
    completion: profileCompletion
  })

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-start mb-6">
        <h3 className="text-lg font-bold text-gray-900">Your Profile</h3>
        <Link
          href="/profile/edit"
          className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center"
        >
          <Edit className="w-4 h-4 mr-1" />
          Edit
        </Link>
      </div>

      {/* Profile Header */}
      <div className="flex items-center space-x-4 mb-6">
        {/* Profile Photo */}
        <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
          {profile.profile_photo_url ? (
            <img 
              src={profile.profile_photo_url} 
              alt={profile.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div 
              className="w-full h-full flex items-center justify-center text-white font-semibold text-lg"
              style={{ 
                background: profile.sport 
                  ? `linear-gradient(135deg, ${getSportColor(profile.sport)}, ${getSportColor(profile.sport)}aa)`
                  : 'linear-gradient(135deg, #6b7280, #6b7280aa)'
              }}
            >
              {profile.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Basic Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 truncate text-lg">{profile.name}</h4>
          <div className="flex items-center text-sm text-gray-600 mt-1">
            <Calendar className="w-3 h-3 mr-1" />
            Member for {membershipDuration}
          </div>
          {profile.location && (
            <div className="flex items-center text-sm text-gray-600 mt-1">
              <MapPin className="w-3 h-3 mr-1" />
              {profile.location}
            </div>
          )}
        </div>
      </div>

      {/* Bio */}
      {profile.bio && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700 italic">"{profile.bio}"</p>
        </div>
      )}

      {/* Sports & Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Primary Sport</p>
          {profile.sport ? (
            <div className="flex items-center mt-1">
              <div 
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: getSportColor(profile.sport) }}
              ></div>
              <span className="font-medium text-gray-900 text-sm">
                {formatSportName(profile.sport)}
              </span>
            </div>
          ) : (
            <span className="text-gray-500 text-sm">Not set</span>
          )}
        </div>

        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Skill Level</p>
          <span className="font-medium text-gray-900 text-sm capitalize block mt-1">
            {profile.skill_level}
          </span>
        </div>
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-blue-50 rounded-lg">
        <div className="text-center">
          <div className="text-lg font-bold text-blue-600">{userSpotsCount}</div>
          <div className="text-xs text-gray-600">Spots Added</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-green-600">{profile.sessions_attended || 0}</div>
          <div className="text-xs text-gray-600">Sessions</div>
        </div>
      </div>

      {/* Achievements */}
      {achievements.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Achievements</p>
          <div className="flex flex-wrap gap-2">
            {achievements.map((achievementId) => (
              <div
                key={achievementId}
                className="flex items-center bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full"
                title={ACHIEVEMENT_NAMES[achievementId] || achievementId}
              >
                <span className="mr-1">{ACHIEVEMENT_ICONS[achievementId] || '🏆'}</span>
                <span className="font-medium">{ACHIEVEMENT_NAMES[achievementId] || achievementId}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Social Links */}
      {profile.instagram_handle && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Social</p>
          <a
            href={`https://instagram.com/${profile.instagram_handle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm text-pink-600 hover:text-pink-700"
          >
            <Instagram className="w-4 h-4 mr-1" />
            @{profile.instagram_handle}
          </a>
        </div>
      )}

      {/* Profile Completion */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-gray-500 uppercase tracking-wide">Profile Completion</span>
          <span className="text-xs font-medium text-gray-700">
            {profileCompletion}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              profileCompletion === 100 ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${profileCompletion}%` }}
          ></div>
        </div>
        {profileCompletion < 100 ? (
          <p className="text-xs text-gray-500 mt-1">
            Add {profileCompletion < 50 ? 'more details' : 'a few more details'} to complete your profile!
          </p>
        ) : (
          <p className="text-xs text-green-600 mt-1">
            🎉 Profile complete! You're ready to connect with the community.
          </p>
        )}
      </div>
    </div>
  )
}