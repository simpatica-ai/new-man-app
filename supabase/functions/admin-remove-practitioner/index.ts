import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// This function handles the permanent deletion of a practitioner.
Deno.serve(async (req) => {
  // This is needed for CORS preflight requests.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the service role key to perform admin actions.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the authorization header to identify the calling user.
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error("Missing Authorization header");

    // Get the user from the token to verify they are an admin.
    const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) throw new Error("User not found");

    // Fetch the user's profile to check their role.
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;
    
    // Security Check: Ensure the user has the 'admin' role.
    if (profile?.role !== 'admin') {
      throw new Error('Unauthorized: User is not an admin.');
    }

    // Get the ID of the practitioner to be deleted from the request body.
    const { practitioner_id } = await req.json();
    if (!practitioner_id) throw new Error("Missing practitioner_id in request body");

    // Use the admin client to delete the user from the auth system.
    // Cascading deletes in the database will handle removing all their related data.
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(practitioner_id);

    if (deleteError) throw deleteError;

    // Return a success response.
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    // Handle any errors.
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
