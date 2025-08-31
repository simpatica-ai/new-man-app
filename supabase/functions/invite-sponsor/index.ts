import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not authenticated' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { sponsor_email } = await req.json()
    if (!sponsor_email) {
      return new Response(JSON.stringify({ error: 'Sponsor email is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (user.email === sponsor_email) {
      return new Response(JSON.stringify({ error: 'You cannot invite yourself as a sponsor.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { data: sponsorProfile, error: sponsorError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('email', sponsor_email)
      .single()

    if (sponsorError || !sponsorProfile) {
      return new Response(JSON.stringify({ error: 'The invited user does not exist. Please ask them to sign up first.' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // --- CORRECTED VALIDATION LOGIC ---
    // This now correctly checks if the practitioner already has any pending or active connection.
    const { data: existingConnection, error: connectionError } = await supabase
      .from('sponsor_connections')
      .select('id')
      .eq('practitioner_user_id', user.id)
      .in('status', ['pending', 'active'])
      .maybeSingle()

    if (connectionError) throw connectionError
    if (existingConnection) {
        return new Response(JSON.stringify({ error: 'You already have a pending or active invitation.' }), { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    
    const { error: insertError } = await supabase
      .from('sponsor_connections')
      .insert({
        practitioner_user_id: user.id,
        sponsor_user_id: sponsorProfile.id,
        status: 'pending'
      })

    if (insertError) throw insertError

    if (sponsorProfile.role !== 'sponsor') {
        await supabase.from('profiles').update({ role: 'sponsor' }).eq('id', sponsorProfile.id)
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})