import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, password, fullName } = await req.json()

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

    // Create user WITHOUT email confirmation (since Supabase confirmation is disabled)
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: { full_name: fullName }
    })

    if (error) throw error

    // Generate confirmation link
    const { data: tokenData, error: tokenError } = await supabase.auth.admin.generateLink({
      type: 'signup',
      email: email
    })

    if (tokenError) throw tokenError

    // If there's a pending invitation, activate it AFTER email confirmation
    if (invitation && data.user) {
      await supabase
        .from('sponsor_relationships')
        .update({
          sponsor_id: data.user.id,
          status: 'pending_confirmation'
        })
        .eq('id', invitation.id)
    }

    // Send styled confirmation email
    const siteUrl = Deno.env.get('SITE_URL') || 'http://localhost:3000'
    await fetch(`${siteUrl}/api/send-confirmation-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        confirmationUrl: tokenData.properties.action_link
      })
    })

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})
