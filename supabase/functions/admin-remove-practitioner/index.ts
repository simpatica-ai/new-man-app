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
    const url = new URL(req.url);
    if (req.method !== 'POST') {
      return new Response('Method Not Allowed', { 
        status: 405, 
        headers: corsHeaders 
      });
    }

    const body = await req.json();
    const { user_id, confirm } = body;

    if (!confirm) {
      return new Response(JSON.stringify({ error: 'confirmation required' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (!user_id) {
      return new Response(JSON.stringify({ error: 'user_id required' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const svc = createClient(supabaseUrl, supabaseServiceRole, { auth: { persistSession: false } });
    
    console.log('Testing user deletion for:', user_id);

    // Use the safe deletion function first to clean up all data
    const { data: cleanupResult, error: cleanupError } = await svc.rpc('safe_delete_user_and_data', { 
      target_user_id: user_id 
    });
    
    if (cleanupError) {
      console.error('Error during safe cleanup:', cleanupError);
      return new Response(JSON.stringify({ error: cleanupError.message }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Safe cleanup completed:', cleanupResult);

    // Delete auth user (this should now work cleanly)
    const { error: delErr } = await svc.auth.admin.deleteUser(user_id);
    if (delErr) {
      console.error('Error deleting auth user:', delErr);
      return new Response(JSON.stringify({ error: delErr.message }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true }), { 
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