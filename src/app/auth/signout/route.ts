// src/app/auth/signout/route.ts - CREATE THIS FILE
import { createServerSupabaseClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Sign out the user
    await supabase.auth.signOut()
    
    // Get the origin from the request for proper redirect
    const url = new URL(request.url)
    const origin = url.origin
    
    // Redirect to homepage with proper domain
    return NextResponse.redirect(new URL('/', origin))
  } catch (error) {
    console.error('Signout error:', error)
    // Even if there's an error, redirect to homepage
    const url = new URL(request.url)
    return NextResponse.redirect(new URL('/', url.origin))
  }
}