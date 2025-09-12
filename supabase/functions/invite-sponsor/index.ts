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
      return new Response(JSON.stringify({ error: 'User not authenticated' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    const { sponsor_email } = await req.json()
    if (!sponsor_email) {
      return new Response(JSON.stringify({ error: 'Sponsor email is required' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    if (user.email === sponsor_email) {
      return new Response(JSON.stringify({ error: 'You cannot invite yourself as a sponsor.' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    // Check if practitioner already has a pending or active relationship
    const { data: existingRelationship } = await supabase
      .from('sponsor_relationships')
      .select('id')
      .eq('practitioner_id', user.id)
      .in('status', ['pending', 'active', 'email_sent'])
      .maybeSingle()

    if (existingRelationship) {
      return new Response(JSON.stringify({ error: 'You already have a pending or active sponsor invitation.' }), { 
        status: 409, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    // Check if sponsor is already registered
    const { data: sponsorProfile } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('email', sponsor_email)
      .maybeSingle()

    if (sponsorProfile) {
      // Sponsor is registered - create direct relationship
      const { error: insertError } = await supabase
        .from('sponsor_relationships')
        .insert({
          practitioner_id: user.id,
          sponsor_id: sponsorProfile.id,
          sponsor_email: sponsor_email,
          status: 'pending'
        })

      if (insertError) throw insertError

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Invitation sent to registered sponsor.' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    } else {
      // Sponsor is not registered - create invitation with email
      const { data: relationship, error: insertError } = await supabase
        .from('sponsor_relationships')
        .insert({
          practitioner_id: user.id,
          sponsor_email: sponsor_email,
          status: 'email_sent'
        })
        .select('invitation_token')
        .single()

      if (insertError) throw insertError

      // Get practitioner name for email
      const { data: practitionerProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

      const practitionerName = practitionerProfile?.full_name || user.email

      // Send invitation email using your API
      const siteUrl = Deno.env.get('SITE_URL') || 
        (Deno.env.get('VERCEL_URL') ? `https://${Deno.env.get('VERCEL_URL')}` : 'http://localhost:3000')
      const inviteUrl = `${siteUrl}/sponsor/accept-invitation?token=${relationship.invitation_token}`
      
      try {
        const emailResponse = await fetch(`${siteUrl}/api/send-sponsor-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sponsorEmail: sponsor_email,
            practitionerName: practitionerName,
            invitationLink: inviteUrl
          })
        })

        if (emailResponse.ok) {
          return new Response(JSON.stringify({ 
            success: true, 
            message: 'Invitation email sent successfully!' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          })
        } else {
          throw new Error('Email API failed')
        }
      } catch (emailErr) {
        console.error('Email sending failed:', emailErr)
        return new Response(JSON.stringify({ 
          success: true, 
          message: `Invitation created! Please share this link with your sponsor: ${inviteUrl}`,
          invitation_link: inviteUrl
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }
    }
  } catch (error) {
    console.error('Function error:', error)
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
