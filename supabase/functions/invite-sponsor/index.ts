import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { practitioner_user_id, sponsor_email } = await req.json()

    // Create a Supabase client with the service_role key to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Find the sponsor by their email address
    const { data: sponsor, error: findError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', sponsor_email)
      .single()

    if (findError || !sponsor) {
      throw new Error('Could not find a user with that email address.')
    }

    // 2. Create a 'pending' connection
    const { error: insertError } = await supabaseAdmin
      .from('sponsor_connections')
      .insert({
        practitioner_user_id: practitioner_user_id,
        sponsor_user_id: sponsor.id,
        status: 'pending',
      })

    if (insertError) {
      throw insertError
    }
    
    // In the future, you would add code here to send an email notification

    return new Response(JSON.stringify({ message: 'Invitation sent successfully!' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})