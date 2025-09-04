// supabase/functions/update-journal-entry/index.ts

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
    // 1. Create a Supabase client with the user's auth token
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // 2. Authenticate the user
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    // 3. Get the entry ID and new text from the request body
    const { entry_id, entry_text } = await req.json();
    if (!entry_id || entry_text === undefined) {
      return new Response(JSON.stringify({ error: 'Entry ID and text are required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // 4. Update the entry in the database, matching on both ID and user_id for security
    const { data, error } = await supabaseClient
      .from('journal_entries')
      .update({ entry_text: entry_text })
      .eq('id', entry_id)
      .eq('user_id', user.id) // Ensures users can only edit their own entries
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // PostgREST error for "Not a single row"
         return new Response(JSON.stringify({ error: 'Entry not found or you do not have permission to edit it.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        });
      }
      throw error;
    }

    // 5. Return the updated entry
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

