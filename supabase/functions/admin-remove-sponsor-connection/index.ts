import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// This function handles disconnecting a sponsor from a practitioner.
Deno.serve(async (req) => {
  // This is needed for CORS preflight requests.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the service role key to bypass RLS.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the authorization header from the request.
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error("Missing Authorization header");

    // Get the user from the token to verify their role.
    const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) throw new Error("User not found");

    // Fetch the user's profile to check their role.
    const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profileError) throw profileError;
    
    // Security Check: Only allow users with the 'admin' role to proceed.
    if (profile?.role !== 'admin') {
      throw new Error('Unauthorized: User is not an admin.');
    }

    // Get the connection ID to update from the request body.
    const { connection_id } = await req.json();
    if (!connection_id) throw new Error("Missing connection_id in request body");

    // Update the status of the connection to 'inactive'.
    const { error: updateError } = await supabaseAdmin
      .from('sponsor_connections')
      .update({ status: 'inactive' })
      .eq('id', connection_id);

    if (updateError) throw updateError;

    // Return a success response.
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    // Handle any errors that occur during the process.
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
