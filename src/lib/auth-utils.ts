// src/lib/auth-utils.ts - FIXED VERSION with better error handling
import { createServerSupabaseClient } from '@/lib/supabase'

export async function getAuthenticatedUser() {
  const supabase = await createServerSupabaseClient()
  
  try {
    // Try the secure getUser() method first
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.log('getUser() failed, trying getSession() as fallback:', error.message)
      
      // Fallback to getSession() if getUser() fails
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session?.user) {
        console.log('Both getUser() and getSession() failed')
        return null
      }
      
      return session.user
    }
    
    return user
  } catch (error) {
    console.log('Authentication check failed completely:', error)
    
    // Last resort: try getSession()
    try {
      const { data: { session } } = await supabase.auth.getSession()
      return session?.user || null
    } catch (fallbackError) {
      console.log('All auth methods failed:', fallbackError)
      return null
    }
  }
}

export async function requireAuth() {
  const user = await getAuthenticatedUser()
  
  if (!user) {
    return {
      user: null,
      redirectTo: '/'
    }
  }
  
  return {
    user,
    redirectTo: null
  }
}