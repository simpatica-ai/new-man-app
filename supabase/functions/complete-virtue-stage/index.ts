// supabase/functions/complete-virtue-stage/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const { virtue_id, stage_number } = await req.json();
    if (!virtue_id || !stage_number) {
      return new Response(JSON.stringify({ error: 'Virtue ID and stage number are required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Upsert the progress. This will create a new row if one doesn't exist,
    // or update the existing one. The database trigger you mentioned will handle
    // setting it to 'in_progress' when a memo is saved. This function sets it to 'completed'.
    const { data, error } = await supabaseClient
      .from('user_virtue_stage_progress')
      .upsert({
        user_id: user.id,
        virtue_id: virtue_id,
        stage_number: stage_number,
        status: 'completed'
      }, {
        onConflict: 'user_id, virtue_id, stage_number'
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
