import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  console.log('Custom signup function called!')
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, password, fullName, siteUrl } = await req.json()
    console.log('Signup request for:', email, 'Site URL:', siteUrl)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Check for pending sponsor invitation
    const { data: invitation } = await supabase
      .from('sponsor_relationships')
      .select('id, invitation_token')
      .eq('sponsor_email', email)
      .eq('status', 'email_sent')
      .maybeSingle()

    // Create user WITHOUT confirming email (they need to click our custom link)
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // Explicitly unconfirmed
      user_metadata: { full_name: fullName }
    })

    if (error) throw error

    console.log('User created with email_confirmed_at:', data.user?.email_confirmed_at)

    // Generate our custom confirmation link using the user ID as token
    const finalSiteUrl = siteUrl || Deno.env.get('SITE_URL') || 'http://localhost:3000'
    console.log('Using site URL:', finalSiteUrl)
    const confirmationUrl = `${finalSiteUrl}/api/confirm-email?token=${data.user.id}&email=${encodeURIComponent(email)}`

    // If there's a pending invitation, mark it for activation after confirmation
    if (invitation && data.user) {
      await supabase
        .from('sponsor_relationships')
        .update({
          sponsor_id: data.user.id,
          status: 'pending_confirmation'
        })
        .eq('id', invitation.id)
    }

    // Send confirmation email using the same Gmail method as sponsor emails
    try {
      // Use production URL since Supabase function runs in cloud, not localhost
      const emailApiUrl = finalSiteUrl.includes('localhost') 
        ? 'https://new-man-app.vercel.app/api/send-confirmation-email'
        : `${finalSiteUrl}/api/send-confirmation-email`
      
      console.log('Calling email API at:', emailApiUrl)
      
      const emailResponse = await fetch(emailApiUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'User-Agent': 'Supabase-Function'
        },
        body: JSON.stringify({
          email,
          confirmationUrl
        })
      })
      
      console.log('Email API response status:', emailResponse.status)
      
      if (emailResponse.ok) {
        console.log('Confirmation email sent successfully to:', email)
      } else {
        const errorText = await emailResponse.text()
        console.error('Email API error:', errorText)
        console.log('Confirmation URL for manual testing:', confirmationUrl)
      }
    } catch (emailError) {
      console.error('Email sending error:', emailError)
      console.log('Confirmation URL for manual testing:', confirmationUrl)
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: 'User created successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})
