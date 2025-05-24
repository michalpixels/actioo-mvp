'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Camera, User, MapPin, Trophy, Instagram, Mail, Save, X, Check, Loader2, AlertCircle } from 'lucide-react'

const SPORT_TYPES = [
  { value: 'skateboarding', label: '🛹 Skateboarding', color: '#ef4444' },
  { value: 'surfing', label: '🏄 Surfing', color: '#3b82f6' },
  { value: 'mountain_biking', label: '🚵 Mountain Biking', color: '#22c55e' },
  { value: 'snowboarding', label: '🏂 Snowboarding', color: '#8b5cf6' },
  { value: 'bmx', label: '🚴 BMX', color: '#f59e0b' },
  { value: 'rock_climbing', label: '🧗 Rock Climbing', color: '#6b7280' },
  { value: 'parkour', label: '🤸 Parkour', color: '#f97316' },
  { value: 'wakeboarding', label: '🏄‍♂️ Wakeboarding', color: '#06b6d4' },
  { value: 'kitesurfing', label: '🪁 Kitesurfing', color: '#8b5cf6' }
]

const SKILL_LEVELS = [
  { value: 'beginner', label: '🟢 Beginner', description: 'Just getting started' },
  { value: 'intermediate', label: '🟡 Intermediate', description: 'Building skills and confidence' },
  { value: 'advanced', label: '🔴 Advanced', description: 'Experienced and skilled' }
]

// Define field requirements and validation rules
const FIELD_RULES = {
  // Required fields - cannot be null or empty
  name: { required: true, minLength: 1, maxLength: 100 },
  skill_level: { required: true, allowedValues: ['beginner', 'intermediate', 'advanced'] },
  
  // Optional fields - can be null or empty
  sport: { required: false, allowedValues: SPORT_TYPES.map(s => s.value) },
  location: { required: false, maxLength: 100 },
  bio: { required: false, maxLength: 150 },
  instagram_handle: { required: false, maxLength: 50 },
  profile_photo_url: { required: false },
  
  // Settings objects - have defaults, never null
  privacy_settings: { required: true, isObject: true },
  email_preferences: { required: true, isObject: true }
}

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
}

interface ProfileEditFormProps {
  initialData: ProfileData
}

interface ValidationError {
  field: string
  message: string
}

// Helper function to validate a single field
function validateField(field: string, value: any): ValidationError | null {
  const rules = FIELD_RULES[field as keyof typeof FIELD_RULES]
  if (!rules) return null

  // Check required fields
  if (rules.required) {
    if (value === null || value === undefined || value === '') {
      return { field, message: `${field} is required` }
    }
  }

  // String validations
  if (typeof value === 'string') {
    if (rules.minLength && value.length < rules.minLength) {
      return { field, message: `${field} must be at least ${rules.minLength} characters` }
    }
    if (rules.maxLength && value.length > rules.maxLength) {
      return { field, message: `${field} must be less than ${rules.maxLength} characters` }
    }
  }

  // Allowed values validation
  if (rules.allowedValues && value && !rules.allowedValues.includes(value)) {
    return { field, message: `Invalid value for ${field}` }
  }

  return null
}

// Helper function to prepare field value for database
function prepareFieldValue(field: string, value: any): any {
  const rules = FIELD_RULES[field as keyof typeof FIELD_RULES]
  if (!rules) return value

  // For optional string fields, convert empty strings to null
  if (!rules.required && typeof value === 'string') {
    const trimmedValue = value.trim()
    return trimmedValue === '' ? null : trimmedValue
  }

  // For required string fields, keep as string (never null)
  if (rules.required && typeof value === 'string') {
    return value.trim()
  }

  // For objects and other types, return as-is
  return value
}

// Helper function to ensure we always have proper default values
function getDefaultFormData(initialData: ProfileData) {
  return {
    name: initialData.name || '',
    email: initialData.email || '',
    sport: initialData.sport || '',
    skill_level: initialData.skill_level || 'beginner',
    location: initialData.location || '',
    bio: initialData.bio || '',
    instagram_handle: initialData.instagram_handle || '',
    profile_photo_url: initialData.profile_photo_url || '',
    privacy_settings: {
      profile_public: initialData.privacy_settings?.profile_public ?? true,
      show_email: initialData.privacy_settings?.show_email ?? false
    },
    email_preferences: {
      spot_notifications: initialData.email_preferences?.spot_notifications ?? true,
      session_invites: initialData.email_preferences?.session_invites ?? true,
      community_updates: initialData.email_preferences?.community_updates ?? true
    }
  }
}

export default function ProfileEditForm({ initialData }: ProfileEditFormProps) {
  const [uploading, setUploading] = useState(false)
  const [imageKey, setImageKey] = useState(0) // ✅ Stable initial value
  
  // Auto-save states
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  
  // Validation states
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  
  // Separate state for photo upload messages (near the photo)
  const [photoMessage, setPhotoMessage] = useState('')
  const [photoMessageType, setPhotoMessageType] = useState<'success' | 'error'>('success')
  
  // Initialize form data with proper defaults
  const [formData, setFormData] = useState(() => getDefaultFormData(initialData))

  const fileInputRef = useRef<HTMLInputElement>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout>()
  const supabase = createClient()
  const router = useRouter()

  // Clear validation error for a specific field
  const clearValidationError = (field: string) => {
    setValidationErrors(prev => prev.filter(error => error.field !== field))
  }

  // Add validation error for a specific field
  const addValidationError = (error: ValidationError) => {
    setValidationErrors(prev => {
      // Remove existing error for this field, then add new one
      const filtered = prev.filter(e => e.field !== error.field)
      return [...filtered, error]
    })
  }

  // Debounced auto-save function with validation
  const debouncedSave = useCallback(async (dataToSave: any, fieldName: string) => {
    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Set a new timeout for saving
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        setSaving(true)
        setSaveStatus('saving')
        
        // Validate the field being saved
        const fieldValue = dataToSave[fieldName]
        const validationError = validateField(fieldName, fieldValue)
        
        if (validationError) {
          console.log('Validation failed for field:', fieldName, validationError.message)
          addValidationError(validationError)
          setSaveStatus('error')
          setSaving(false)
          return
        }

        // Clear any existing validation error for this field
        clearValidationError(fieldName)
        
        console.log('Auto-saving:', fieldName, dataToSave)
        
        const { error } = await supabase
          .from('profiles')
          .update({
            ...dataToSave,
            updated_at: new Date().toISOString()
          })
          .eq('id', initialData.id)

        if (error) {
          console.error('Auto-save error:', error)
          addValidationError({ field: fieldName, message: `Failed to save ${fieldName}` })
          setSaveStatus('error')
          return
        }

        setLastSaved(new Date())
        setSaveStatus('saved')
        
        // Show saved status for 2 seconds, then return to idle
        setTimeout(() => {
          setSaveStatus('idle')
        }, 2000)

      } catch (error) {
        console.error('Auto-save failed:', error)
        addValidationError({ field: fieldName, message: `Failed to save ${fieldName}` })
        setSaveStatus('error')
      } finally {
        setSaving(false)
      }
    }, 1000) // Wait 1 second after user stops typing
  }, [supabase, initialData.id])

  // Auto-save helper for immediate saves (toggles, selections) with validation
  const autoSaveImmediate = useCallback(async (dataToSave: any, fieldName: string) => {
    try {
      setSaving(true)
      setSaveStatus('saving')
      
      // Validate the field being saved
      const fieldValue = dataToSave[fieldName]
      const validationError = validateField(fieldName, fieldValue)
      
      if (validationError) {
        console.log('Validation failed for field:', fieldName, validationError.message)
        addValidationError(validationError)
        setSaveStatus('error')
        setSaving(false)
        return
      }

      // Clear any existing validation error for this field
      clearValidationError(fieldName)
      
      console.log('Auto-saving immediately:', fieldName, dataToSave)
      
      const { error } = await supabase
        .from('profiles')
        .update({
          ...dataToSave,
          updated_at: new Date().toISOString()
        })
        .eq('id', initialData.id)

      if (error) {
        console.error('Auto-save error:', error)
        addValidationError({ field: fieldName, message: `Failed to save ${fieldName}` })
        setSaveStatus('error')
        return
      }

      setLastSaved(new Date())
      setSaveStatus('saved')
      
      setTimeout(() => {
        setSaveStatus('idle')
      }, 2000)

    } catch (error) {
      console.error('Auto-save failed:', error)
      addValidationError({ field: fieldName, message: `Failed to save ${fieldName}` })
      setSaveStatus('error')
    } finally {
      setSaving(false)
    }
  }, [supabase, initialData.id])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear validation error when user starts typing
    clearValidationError(field)
  }

  // Auto-save on text field blur (with validation)
  const handleTextFieldBlur = (field: string, value: string) => {
    const preparedValue = prepareFieldValue(field, value)
    
    // Only save if the value actually changed from the initial data
    const initialValue = initialData[field as keyof ProfileData]
    const initialPrepared = prepareFieldValue(field, initialValue || '')
    
    if (preparedValue !== initialPrepared) {
      debouncedSave({ [field]: preparedValue }, field)
    }
  }

  // Auto-save sport selection immediately (sport is optional, can be null)
  const handleSportChange = (sportValue: string) => {
    handleInputChange('sport', sportValue)
    const preparedValue = prepareFieldValue('sport', sportValue)
    autoSaveImmediate({ sport: preparedValue }, 'sport')
  }

  // Auto-save skill level immediately (skill_level is required, cannot be null)
  const handleSkillLevelChange = (skillValue: string) => {
    handleInputChange('skill_level', skillValue)
    const preparedValue = prepareFieldValue('skill_level', skillValue)
    autoSaveImmediate({ skill_level: preparedValue }, 'skill_level')
  }

  const handlePrivacyChange = (field: string, value: boolean) => {
    const newPrivacySettings = {
      ...formData.privacy_settings,
      [field]: value
    }
    
    setFormData(prev => ({
      ...prev,
      privacy_settings: newPrivacySettings
    }))
    
    // Auto-save privacy settings immediately
    autoSaveImmediate({ privacy_settings: newPrivacySettings }, 'privacy_settings')
  }

  const handleEmailPrefChange = (field: string, value: boolean) => {
    const newEmailPreferences = {
      ...formData.email_preferences,
      [field]: value
    }
    
    setFormData(prev => ({
      ...prev,
      email_preferences: newEmailPreferences
    }))
    
    // Auto-save email preferences immediately
    autoSaveImmediate({ email_preferences: newEmailPreferences }, 'email_preferences')
  }

  const uploadProfilePhoto = async (file: File) => {
    try {
      setUploading(true)
      setPhotoMessage('')
      
      const fileExt = file.name.split('.').pop()
      const timestamp = Date.now()
      const fileName = `${initialData.id}/profile-${timestamp}.${fileExt}`
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, file, { 
          upsert: true,
          contentType: file.type
        })

      if (error) {
        throw error
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName)

      const cacheBustedUrl = `${publicUrl}?t=${timestamp}`
      
      // Auto-save photo to database immediately
      await autoSaveImmediate({ profile_photo_url: cacheBustedUrl }, 'profile_photo_url')
      
      // Update form data and force image re-render
      setFormData(prev => ({ ...prev, profile_photo_url: cacheBustedUrl }))
      setImageKey(timestamp) // ✅ Only update imageKey when we actually upload
      
      setPhotoMessage('✅ Profile photo updated!')
      setPhotoMessageType('success')
      
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
      setTimeout(() => {
        setPhotoMessage('')
      }, 3000)
      
    } catch (error: any) {
      console.error('Error uploading photo:', error)
      setPhotoMessage(error.message || 'Error uploading photo')
      setPhotoMessageType('error')
    } finally {
      setUploading(false)
    }
  }

  const handlePhotoClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhotoMessage('')
      
      if (file.size > 2 * 1024 * 1024) {
        setPhotoMessage('File size must be less than 2MB')
        setPhotoMessageType('error')
        return
      }
      
      if (!file.type.startsWith('image/')) {
        setPhotoMessage('Please select an image file')
        setPhotoMessageType('error')
        return
      }
      
      uploadProfilePhoto(file)
    }
  }

  const bioCharCount = formData.bio.length
  const bioMaxLength = 150

  const displayImageUrl = formData.profile_photo_url ? 
    (imageKey > 0 ? 
      formData.profile_photo_url.split('?')[0] + `?t=${imageKey}` : 
      formData.profile_photo_url
    ) : null

  // Get validation error for a specific field
  const getFieldError = (field: string): string | null => {
    const error = validationErrors.find(e => e.field === field)
    return error ? error.message : null
  }

  // Check if form has any validation errors
  const hasValidationErrors = validationErrors.length > 0

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  // ✅ SMART SOLUTION: Set flag for profile refresh without full page reload
  useEffect(() => {
    const handlePopState = () => {
      // Only set flag if user made changes and uses browser back button
      if (lastSaved) {
        sessionStorage.setItem('refreshProfileOnly', 'true')
        sessionStorage.setItem('profileLastUpdated', lastSaved.toISOString())
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [lastSaved, router])

  return (
    <div className="space-y-8">
      {/* Auto-save Status Bar */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-medium text-gray-900">Your Athlete Profile</h3>
            <span className="text-sm text-gray-500">• Auto-saves as you edit</span>
          </div>
          
          <div className="flex items-center space-x-2">
            {saveStatus === 'saving' && (
              <div className="flex items-center text-blue-600 text-sm">
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                Saving...
              </div>
            )}
            
            {saveStatus === 'saved' && (
              <div className="flex items-center text-green-600 text-sm">
                <Check className="w-4 h-4 mr-1" />
                Changes saved
              </div>
            )}
            
            {saveStatus === 'error' && (
              <div className="flex items-center text-red-600 text-sm">
                <X className="w-4 h-4 mr-1" />
                Save failed
              </div>
            )}
            
            {saveStatus === 'idle' && lastSaved && (
              <div className="text-gray-500 text-sm">
                Last saved: {lastSaved.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>

        {/* Validation Errors Summary */}
        {hasValidationErrors && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-red-800">Please fix the following errors:</h4>
                <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error.message}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      <form className="space-y-8">
        {/* Profile Photo Section */}
        <div className="text-center">
          <div className="relative inline-block">
            <div 
              onClick={handlePhotoClick}
              className="relative w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg cursor-pointer hover:shadow-xl transition-all group"
            >
              {displayImageUrl ? (
                <img 
                  key={imageKey}
                  src={displayImageUrl} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                  onError={() => {
                    setFormData(prev => ({ ...prev, profile_photo_url: '' }))
                    setPhotoMessage('Failed to load image')
                    setPhotoMessageType('error')
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500">
                  <User className="w-12 h-12 text-white" />
                </div>
              )}
              
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center">
                <Camera className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              
              {uploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                </div>
              )}
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
          
          <p className="text-sm text-gray-500 mt-2">
            Click to upload a profile photo (max 2MB)
          </p>
          
          {photoMessage && (
            <div className={`mt-3 p-2 rounded-md text-sm text-center max-w-xs mx-auto ${
              photoMessageType === 'success' 
                ? 'bg-green-100 text-green-700 border border-green-200'
                : 'bg-red-100 text-red-700 border border-red-200'
            }`}>
              {photoMessage}
            </div>
          )}
        </div>

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-1" />
              Full Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              onBlur={(e) => handleTextFieldBlur('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                getFieldError('name') ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Your full name"
              required
            />
            {getFieldError('name') && (
              <p className="mt-1 text-sm text-red-600">{getFieldError('name')}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="w-4 h-4 inline mr-1" />
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 cursor-not-allowed"
              placeholder="Email cannot be changed"
            />
            <p className="text-xs text-gray-500 mt-1">
              To change your email, contact support
            </p>
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MapPin className="w-4 h-4 inline mr-1" />
            Location
          </label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => handleInputChange('location', e.target.value)}
            onBlur={(e) => handleTextFieldBlur('location', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              getFieldError('location') ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="e.g., Los Angeles, CA or London, UK"
          />
          {getFieldError('location') ? (
            <p className="mt-1 text-sm text-red-600">{getFieldError('location')}</p>
          ) : (
            <p className="text-xs text-gray-500 mt-1">
              Help others find local training partners
            </p>
          )}
        </div>

        {/* Primary Sport */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            <Trophy className="w-4 h-4 inline mr-1" />
            Primary Sport
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {SPORT_TYPES.map((sport) => (
              <label
                key={sport.value}
                className={`flex items-center p-3 border rounded-md cursor-pointer transition-all ${
                  formData.sport === sport.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input
                  type="radio"
                  name="sport"
                  value={sport.value}
                  checked={formData.sport === sport.value}
                  onChange={(e) => handleSportChange(e.target.value)}
                  className="sr-only"
                />
                <span className="text-sm font-medium">{sport.label}</span>
              </label>
            ))}
          </div>
          {getFieldError('sport') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError('sport')}</p>
          )}
        </div>

        {/* Skill Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Skill Level *
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {SKILL_LEVELS.map((level) => (
              <label
                key={level.value}
                className={`flex flex-col p-4 border rounded-md cursor-pointer transition-all ${
                  formData.skill_level === level.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input
                  type="radio"
                  name="skill_level"
                  value={level.value}
                  checked={formData.skill_level === level.value}
                  onChange={(e) => handleSkillLevelChange(e.target.value)}
                  className="sr-only"
                />
                <span className="font-medium text-sm">{level.label}</span>
                <span className="text-xs text-gray-600 mt-1">{level.description}</span>
              </label>
            ))}
          </div>
          {getFieldError('skill_level') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError('skill_level')}</p>
          )}
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bio
          </label>
          <textarea
            value={formData.bio}
            onChange={(e) => handleInputChange('bio', e.target.value)}
            onBlur={(e) => handleTextFieldBlur('bio', e.target.value)}
            rows={3}
            maxLength={bioMaxLength}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              getFieldError('bio') ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="Tell the community about yourself, your achievements, or what drives you..."
          />
          <div className="flex justify-between items-center mt-1">
            {getFieldError('bio') ? (
              <p className="text-sm text-red-600">{getFieldError('bio')}</p>
            ) : (
              <p className="text-xs text-gray-500">
                Share your story with the community
              </p>
            )}
            <p className={`text-xs ${bioCharCount > bioMaxLength ? 'text-red-500' : 'text-gray-500'}`}>
              {bioCharCount}/{bioMaxLength}
            </p>
          </div>
        </div>

        {/* Social Media */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Instagram className="w-4 h-4 inline mr-1" />
            Instagram Handle
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">@</span>
            <input
              type="text"
              value={formData.instagram_handle}
              onChange={(e) => handleInputChange('instagram_handle', e.target.value.replace('@', ''))}
              onBlur={(e) => handleTextFieldBlur('instagram_handle', e.target.value.replace('@', ''))}
              className={`w-full pl-8 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                getFieldError('instagram_handle') ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="your_username"
            />
          </div>
          {getFieldError('instagram_handle') ? (
            <p className="mt-1 text-sm text-red-600">{getFieldError('instagram_handle')}</p>
          ) : (
            <p className="text-xs text-gray-500 mt-1">
              Optional: Share your Instagram to connect with the community
            </p>
          )}
        </div>

        {/* Privacy Settings */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Privacy Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Public Profile</label>
                <p className="text-xs text-gray-500">Allow others to see your profile</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.privacy_settings.profile_public}
                  onChange={(e) => handlePrivacyChange('profile_public', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Show Email</label>
                <p className="text-xs text-gray-500">Display email on your public profile</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.privacy_settings.show_email}
                  onChange={(e) => handlePrivacyChange('show_email', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Email Preferences */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Email Preferences</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Spot Notifications</label>
                <p className="text-xs text-gray-500">Get notified when new spots are added nearby</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.email_preferences.spot_notifications}
                  onChange={(e) => handleEmailPrefChange('spot_notifications', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Session Invites</label>
                <p className="text-xs text-gray-500">Receive invitations to local sessions</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.email_preferences.session_invites}
                  onChange={(e) => handleEmailPrefChange('session_invites', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Community Updates</label>
                <p className="text-xs text-gray-500">News and updates from Actioo</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.email_preferences.community_updates}
                  onChange={(e) => handleEmailPrefChange('community_updates', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
          <button
            type="button"
            onClick={() => {
              // ✅ CLEAN: Just navigate back - no refresh needed
              router.push('/')
            }}
            className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-md hover:bg-gray-700 transition-colors font-medium flex items-center justify-center"
          >
            ← Back to Dashboard
          </button>
        </div>
      </form>
    </div>
  )
}