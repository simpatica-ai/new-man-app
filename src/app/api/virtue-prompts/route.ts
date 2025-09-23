import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { action, user_id, virtue_id, stage_number, prompt_text, user_response, prompt_id } = await request.json();

    switch (action) {
      case 'save_prompt':
        const { data: savedPrompt, error: saveError } = await supabase
          .from('virtue_prompts')
          .insert({
            user_id,
            virtue_id,
            stage_number,
            prompt_text
          })
          .select()
          .single();

        if (saveError) throw saveError;
        return NextResponse.json({ success: true, prompt: savedPrompt });

      case 'update_response':
        const { error: updateError } = await supabase
          .from('virtue_prompts')
          .update({ user_response })
          .eq('id', prompt_id);

        if (updateError) throw updateError;
        return NextResponse.json({ success: true });

      case 'get_previous':
        const { data: previousPrompts, error: fetchError } = await supabase
          .from('virtue_prompts')
          .select('id, prompt_text, user_response, created_at')
          .eq('user_id', user_id)
          .eq('virtue_id', virtue_id)
          .eq('stage_number', stage_number)
          .order('created_at', { ascending: true });

        if (fetchError) throw fetchError;
        return NextResponse.json({ success: true, prompts: previousPrompts });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Virtue prompts API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
