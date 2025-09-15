import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    console.log('Confirmation endpoint called with URL:', request.url)
    
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const email = searchParams.get('email')

    console.log('Token:', token)
    console.log('Email:', email)

    if (!token || !email) {
      console.log('Missing token or email')
      return NextResponse.redirect(new URL('/auth/signup?error=invalid_link', request.url))
    }

    // Use service role to confirm the user
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    console.log('Getting user by ID:', token)
    // Verify token and get user
    const { data: { user }, error } = await supabase.auth.admin.getUserById(token)
    console.log('User lookup result:', { user: user?.email, error })
    
    if (error || !user || user.email !== email) {
      console.log('User verification failed:', { error, userEmail: user?.email, expectedEmail: email })
      return NextResponse.redirect(new URL('/auth/signup?error=invalid_link', request.url))
    }

    console.log('Confirming user email...')
    // Confirm the user's email by setting email_confirmed_at
    const { error: confirmError } = await supabase.auth.admin.updateUserById(
      user.id,
      { 
        email_confirmed_at: new Date().toISOString()
      }
    )

    console.log('Confirmation result:', { confirmError })
    if (confirmError) throw confirmError

    console.log('Generating magic link...')
    // Create a session for the user
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email!,
      options: {
        redirectTo: `${request.nextUrl.origin}/` // Use current origin
      }
    })

    console.log('Magic link result:', { sessionData: !!sessionData, sessionError })
    if (sessionError) throw sessionError

    console.log('Redirecting to magic link:', sessionData.properties.action_link)
    // Redirect to the magic link which will sign them in and redirect
    return NextResponse.redirect(sessionData.properties.action_link)

  } catch (error) {
    console.error('Email confirmation error:', error)
    return NextResponse.redirect(new URL('/auth/signup?error=confirmation_failed', request.url))
  }
}
