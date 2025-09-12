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
      .single()

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

      // Update sponsor role if needed
      if (sponsorProfile.role !== 'sponsor') {
        await supabase
          .from('profiles')
          .update({ role: 'sponsor' })
          .eq('id', sponsorProfile.id)
      }

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

      // Send invitation email
      const siteUrl = Deno.env.get('SITE_URL') || 
        (Deno.env.get('VERCEL_URL') ? `https://${Deno.env.get('VERCEL_URL')}` : 'http://localhost:3000')
      const inviteUrl = `${siteUrl}/sponsor/accept-invitation?token=${relationship.invitation_token}`
      
      const emailHtml = `
        <h2>You've been invited to be a sponsor!</h2>
        <p>${practitionerName} has invited you to be their sponsor on our virtue development platform.</p>
        <p>As a sponsor, you'll be able to guide and support their journey of personal growth.</p>
        <p><a href="${inviteUrl}" style="background-color: #d97706; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Accept Invitation</a></p>
        <p>If the button doesn't work, copy and paste this link: ${inviteUrl}</p>
      `

      const { error: emailError } = await supabase.auth.admin.inviteUserByEmail(sponsor_email, {
        data: {
          invitation_type: 'sponsor',
          practitioner_name: practitionerName,
          invitation_token: relationship.invitation_token
        },
        redirectTo: inviteUrl
      })

      if (emailError) {
        console.error('Email error:', emailError)
        // Don't fail the whole operation if email fails
      }

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Invitation email sent to unregistered sponsor.' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }
  } catch (error) {
    console.error('Function error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
