import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const email = searchParams.get('email')

    if (!token || !email) {
      return NextResponse.redirect(new URL('/auth/signup?error=invalid_link', request.url))
    }

    // Use service role to confirm the user
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Verify token and get user
    const { data: { user }, error } = await supabase.auth.admin.getUserById(token)
    if (error || !user || user.email !== email) {
      return NextResponse.redirect(new URL('/auth/signup?error=invalid_link', request.url))
    }

    // Confirm the user's email by setting email_confirmed_at
    const { error: confirmError } = await supabase.auth.admin.updateUserById(
      user.id,
      { 
        email_confirmed_at: new Date().toISOString()
      }
    )

    if (confirmError) throw confirmError

    // Create a session for the user
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email!,
      options: {
        redirectTo: `${request.nextUrl.origin}/` // Use current origin (localhost)
      }
    })

    if (sessionError) throw sessionError

    // Redirect to the magic link which will sign them in and redirect to localhost
    return NextResponse.redirect(sessionData.properties.action_link)

  } catch (error) {
    console.error('Email confirmation error:', error)
    return NextResponse.redirect(new URL('/auth/signup?error=confirmation_failed', request.url))
  }
}
