import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Get user
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      throw new Error('Unauthorized')
    }

    const { temperature = 0.2, customPrompt, philosophicalTradition = 'General', promptName = '', numExamples = 10 } = await req.json()

    // Use Vertex AI API directly
    const projectId = Deno.env.get('GOOGLE_CLOUD_PROJECT_ID') || 'new-man-app'
    const location = 'us-central1'
    
    const prompt = customPrompt || `You are a Socratic virtue guide. Generate training data pairs where input_text contains a character defect scenario and output_text provides Socratic questioning to guide toward virtue.

Format: {"input_text": "scenario", "output_text": "socratic_response"}

Generate 10 diverse training pairs:`

    // When real Vertex AI is enabled, this will call the API with your prompt
    // For now, generate mock Aristotelian responses to your 10 scenarios
    const aristotelianPairs = [
      { input_text: "I always put off important tasks until the last minute. How can I stop being such a procrastinator?", output_text: "What do you think happens to your character when you repeatedly choose the easier path over the necessary one? Aristotle spoke of virtue as habit - what small action could you take today to begin forming the habit of timely action?" },
      { input_text: "I get angry very easily, and it often leads me to say things I regret. How can I control my temper?", output_text: "In that moment before anger takes hold, what do you notice in your body and mind? Aristotle taught that courage lies between cowardice and recklessness - what would the mean between suppressing all feeling and explosive anger look like for you?" },
      { input_text: "I find it hard to be honest when I know the truth will upset someone. Is it always better to tell the truth?", output_text: "What do you think happens to relationships when truth is consistently avoided? How might you find the mean between brutal honesty and deceptive kindness - what Aristotle might call truthful speech?" },
      { input_text: "I worry constantly about what others think of me, to the point where it stops me from pursuing my own goals. What should I do?", output_text: "What do you think drives this need for others' approval? Aristotle spoke of the great-souled person who acts from their own sense of what is noble - what would it feel like to act from your own understanding of what is right?" },
      { input_text: "I tend to be overly critical of myself, never feeling good enough. How can I overcome this?", output_text: "What purpose do you think this self-criticism serves? Aristotle taught that virtue lies in the mean - what would lie between harsh self-judgment and blind self-acceptance?" },
      { input_text: "I often find myself being too generous, giving away more than I can afford, and then I regret it. Is generosity a bad thing?", output_text: "What do you think true generosity looks like? Aristotle taught that even virtues can become vices when taken to extremes - what would generous giving look like when balanced with prudent self-care?" },
      { input_text: "I shy away from any kind of public speaking or leadership role, even when I know I have valuable contributions to make. How can I be more assertive?", output_text: "What do you fear might happen if you shared your valuable insights? How might you find the mean between hiding your light and dominating others - what Aristotle might call proper pride in one's contributions?" },
      { input_text: "I struggle with self-discipline, especially when it comes to my diet and exercise. How can I stick to my commitments?", output_text: "What do you think happens to your character each time you break a commitment to yourself? Aristotle taught that we become what we repeatedly do - what small, consistent action could you take to begin building the habit of self-discipline?" },
      { input_text: "I tend to brag about my accomplishments, even when it feels a bit exaggerated. How can I be more humble?", output_text: "What do you think drives the need to embellish your achievements? How might you find the mean between hiding your accomplishments and boasting about them - what would truthful acknowledgment of your work look like?" },
      { input_text: "I'm always rushing through life, constantly feeling impatient and unable to appreciate the present moment. How can I slow down?", output_text: "What do you think you're rushing toward, and what might you be missing in the hurry? Aristotle spoke of contemplation as the highest human activity - what would it feel like to be fully present to this moment?" }
    ]
    
    const mockPairs = aristotelianPairs.slice(0, numExamples)
    
    // Save to database
    const { data: savedData, error } = await supabaseClient
      .from('virtue_training_data')
      .insert(
        mockPairs.map(pair => ({
          input_text: pair.input_text,
          output_text: pair.output_text,
          prompt_used: customPrompt || prompt,
          prompt_name: promptName,
          philosophical_tradition: philosophicalTradition,
          created_by: user.id
        }))
      )
      .select()
    
    if (error) {
      console.error('Database error:', error)
      throw new Error(`Database error: ${error.message}`)
    }
    
    const fileName = `virtue-training-${Date.now()}.jsonl`

    return new Response(JSON.stringify({
      success: true,
      fileName,
      samplesGenerated: mockPairs.length,
      preview: mockPairs.map(p => JSON.stringify(p)),
      savedToDatabase: savedData?.length || 0,
      note: 'Mock data - Google Cloud auth needed'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

async function getAccessToken(): Promise<string> {
  // For now, return a placeholder - this needs proper service account setup
  throw new Error('Google Cloud authentication not configured for Edge Functions')
}

async function saveToGCS(fileName: string, content: string): Promise<void> {
  const bucketName = 'virtue-ai-training-data'
  const accessToken = await getAccessToken()
  
  await fetch(
    `https://storage.googleapis.com/upload/storage/v1/b/${bucketName}/o?uploadType=media&name=${fileName}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/octet-stream',
      },
      body: content
    }
  )
}