import { createBrowserClient, createServerClient } from '@supabase/ssr'

// Client-side Supabase client
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Server-side Supabase client (only call this in server components)
export async function createServerSupabaseClient() {
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          name: string
          sport: string | null
          skill_level: 'beginner' | 'intermediate' | 'advanced'
          location: string | null
          profile_photo: string | null
          spots_discovered: number
          sessions_attended: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          sport?: string | null
          skill_level?: 'beginner' | 'intermediate' | 'advanced'
          location?: string | null
          profile_photo?: string | null
          spots_discovered?: number
          sessions_attended?: number
        }
        Update: {
          name?: string
          sport?: string | null
          skill_level?: 'beginner' | 'intermediate' | 'advanced'
          location?: string | null
          profile_photo?: string | null
          spots_discovered?: number
          sessions_attended?: number
        }
      }
      spots: {
        Row: {
          id: string
          name: string
          description: string | null
          latitude: number
          longitude: number
          sport_type: 'skateboarding' | 'surfing' | 'mountain_biking' | 'snowboarding' | 'bmx' | 'rock_climbing'
          difficulty: 'beginner' | 'intermediate' | 'advanced'
          rating: number
          rating_count: number
          created_by: string
          verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          name: string
          description?: string | null
          latitude: number
          longitude: number
          sport_type: 'skateboarding' | 'surfing' | 'mountain_biking' | 'snowboarding' | 'bmx' | 'rock_climbing'
          difficulty?: 'beginner' | 'intermediate' | 'advanced'
          created_by: string
        }
        Update: {
          name?: string
          description?: string | null
          difficulty?: 'beginner' | 'intermediate' | 'advanced'
        }
      }
    }
  }
}