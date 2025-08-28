// supabase/functions/invite-sponsor/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// The corsHeaders constant is now placed directly in this file
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper to decode the user's ID from the auth token
function decodeJwt(token: string): { sub?: string } | null {
  try {
    const payload = token.split(".")[1];
    const decoded = atob(payload.replace(/_/g, "/").replace(/-/g, "+"));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Authenticate the user making the request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }
    const token = authHeader.replace("Bearer ", "").trim();
    const decoded = decodeJwt(token);
    const practitionerUserId = decoded?.sub;
    if (!practitionerUserId) {
      return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }

    // 2. Get the sponsor's email from the request body
    const { email } = await req.json();
    if (!email) {
      return new Response(JSON.stringify({ error: "'email' is required" }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }

    // 3. Create an admin client to securely interact with the database
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 4. Find the sponsor user by their email in the 'profiles' table
    const { data: sponsor, error: sponsorErr } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single();

    if (sponsorErr || !sponsor) {
      return new Response(JSON.stringify({ error: "Sponsor user not found for the given email" }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }
    
    // 5. Check if a connection already exists
    const { data: existingConnection, error: checkError } = await supabaseAdmin
      .from('sponsor_connections')
      .select('id, status')
      .eq('practitioner_user_id', practitionerUserId)
      .eq('sponsor_user_id', sponsor.id)
      .maybeSingle()

    if (checkError) throw checkError;

    if (existingConnection) {
        return new Response(JSON.stringify({ error: `You already have a connection with this sponsor (Status: ${existingConnection.status}).` }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }

    // 6. Insert the new connection
    const { data: newConnection, error: insertErr } = await supabaseAdmin
      .from("sponsor_connections")
      .insert({
        practitioner_user_id: practitionerUserId,
        sponsor_user_id: sponsor.id,
        status: "pending",
      })
      .select()
      .single();

    if (insertErr) {
      return new Response(JSON.stringify({ error: insertErr.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }

    return new Response(JSON.stringify({ newConnection }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
})