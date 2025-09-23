import { supabase } from './supabaseClient';

export interface VirtuePrompt {
  id: number;
  prompt_text: string;
  user_response: string | null;
  created_at: string;
}

export async function getPreviousPrompts(
  userId: string, 
  virtueId: number, 
  stageNumber: number
): Promise<VirtuePrompt[]> {
  const response = await fetch('/api/virtue-prompts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'get_previous',
      user_id: userId,
      virtue_id: virtueId,
      stage_number: stageNumber
    })
  });

  const result = await response.json();
  return result.success ? result.prompts : [];
}

export async function savePrompt(
  userId: string,
  virtueId: number,
  stageNumber: number,
  promptText: string
): Promise<number | null> {
  const response = await fetch('/api/virtue-prompts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'save_prompt',
      user_id: userId,
      virtue_id: virtueId,
      stage_number: stageNumber,
      prompt_text: promptText
    })
  });

  const result = await response.json();
  return result.success ? result.prompt.id : null;
}

export async function updatePromptResponse(
  promptId: number,
  userResponse: string
): Promise<boolean> {
  const response = await fetch('/api/virtue-prompts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'update_response',
      prompt_id: promptId,
      user_response: userResponse
    })
  });

  const result = await response.json();
  return result.success;
}

export async function generateStagePrompt(
  stageNumber: number,
  virtueData: {
    virtueName: string;
    virtueDef: string;
    characterDefectAnalysis: string;
    stage1MemoContent?: string;
    stage2MemoContent?: string;
    stage3MemoContent?: string;
    stage1Complete?: boolean;
    stage2Complete?: boolean;
  },
  previousPrompts: VirtuePrompt[]
) {
  const stageEndpoints = {
    1: 'https://us-central1-new-man-app.cloudfunctions.net/getstage1',
    2: 'https://us-central1-new-man-app.cloudfunctions.net/getstage2',
    3: 'https://us-central1-new-man-app.cloudfunctions.net/getstage3'
  };

  const endpoint = stageEndpoints[stageNumber as keyof typeof stageEndpoints];
  if (!endpoint) throw new Error('Invalid stage number');

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...virtueData,
      previousPrompts
    })
  });

  return await response.json();
}
