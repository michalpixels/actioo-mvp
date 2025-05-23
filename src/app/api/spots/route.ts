import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Create Supabase client with service role for bypassing RLS during development
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  const { data: spots, error } = await supabase
    .from('spots')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('GET spots error:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(spots)
}

export async function POST(request: NextRequest) {
  try {
    // Get the access token from the Authorization header
    const authHeader = request.headers.get('authorization')
    const accessToken = authHeader?.replace('Bearer ', '')
    
    if (!accessToken) {
      return NextResponse.json({ error: 'Missing authorization token' }, { status: 401 })
    }

    // Create a new Supabase client with the user's access token
    const authedSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      }
    )

    // Verify the user
    const { data: { user }, error: authError } = await authedSupabase.auth.getUser(accessToken)
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    const body = await request.json()
    console.log('Creating spot for user:', user.id, 'Data:', body)
    
    // Validate required fields
    const { name, sport_type, latitude, longitude, difficulty = 'beginner', description } = body
    
    if (!name || !sport_type || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Insert spot using the authenticated client
    const { data: spot, error: insertError } = await authedSupabase
      .from('spots')
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        latitude: Number(latitude),
        longitude: Number(longitude),
        sport_type,
        difficulty,
        created_by: user.id
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json(
        { error: `Database error: ${insertError.message}` },
        { status: 500 }
      )
    }

    console.log('Spot created successfully:', spot)

    // Update user's spots count - FIXED: Get current count and increment
    const { data: currentProfile } = await authedSupabase
      .from('profiles')
      .select('spots_discovered')
      .eq('id', user.id)
      .single()

    const newCount = (currentProfile?.spots_discovered || 0) + 1

    const { error: updateError } = await authedSupabase
      .from('profiles')
      .update({ 
        spots_discovered: newCount
      })
      .eq('id', user.id)

    if (updateError) {
      console.warn('Update count error (non-critical):', updateError)
    } else {
      console.log('Successfully updated user spots count to:', newCount)
    }

    return NextResponse.json(spot, { status: 201 })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: `Server error: ${error}` },
      { status: 500 }
    )
  }
}