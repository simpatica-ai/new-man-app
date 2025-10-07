import { createClient } from "npm:@supabase/supabase-js@2.35.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response('Method Not Allowed', { 
        status: 405, 
        headers: corsHeaders 
      });
    }

    const body = await req.json();
    const { user_id } = body;
    
    if (!user_id) {
      return new Response(JSON.stringify({ error: 'user_id required' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const svc = createClient(supabaseUrl, supabaseServiceRole, { auth: { persistSession: false } });
    
    console.log('Checking user status for:', user_id);

    // Check if user exists in auth.users
    const { data: authUser, error: authError } = await svc.auth.admin.getUserById(user_id);
    
    // Check if profile exists
    const { data: profile, error: profileError } = await svc
      .from('profiles')
      .select('*')
      .eq('id', user_id)
      .single();

    // Check related tables
    const { data: journalEntries } = await svc
      .from('journal_entries')
      .select('id')
      .eq('user_id', user_id);

    const { data: sponsorRelationships } = await svc
      .from('sponsor_relationships')
      .select('id')
      .or(`sponsor_id.eq.${user_id},practitioner_id.eq.${user_id}`);

    const { data: userProgress } = await svc
      .from('user_virtue_progress')
      .select('id')
      .eq('user_id', user_id);

    const status = {
      user_id,
      auth_user_exists: !authError && authUser?.user,
      auth_user_data: authUser?.user ? {
        id: authUser.user.id,
        email: authUser.user.email,
        created_at: authUser.user.created_at
      } : null,
      profile_exists: !profileError && profile,
      profile_data: profile,
      related_data: {
        journal_entries_count: journalEntries?.length || 0,
        sponsor_relationships_count: sponsorRelationships?.length || 0,
        user_progress_count: userProgress?.length || 0
      }
    };

    return new Response(JSON.stringify(status), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});