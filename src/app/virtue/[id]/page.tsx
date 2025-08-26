// src/app/virtue/[id]/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'

type Prompt = { id: number; prompt_text: string; prompt_type: string; };
type Stage = { id: number; stage_number: number; title: string; stage_prompts: Prompt[]; };
type Virtue = { id: number; name: string; description: string; story_of_virtue: string; author_reflection: string; virtue_stages: Stage[]; };

export default function VirtueDetailPage() {
  const [virtue, setVirtue] = useState<Virtue | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const params = useParams()
  const router = useRouter()
  const id = params.id

  useEffect(() => {
    if (!id) return

    const fetchVirtueDetails = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('virtues')
          .select(`*, virtue_stages (*, stage_prompts (*))`)
          .eq('id', id)
          .single()

        if (error) throw error
        if (data) {
          data.virtue_stages.sort((a, b) => a.stage_number - b.stage_number);
          data.virtue_stages.forEach(stage => {
            stage.stage_prompts.sort((a, b) => a.id - b.id);
          });
          setVirtue(data)
        }
      } catch (error) {
        console.error('Error fetching virtue details:', error)
        alert('Failed to fetch virtue details.')
      } finally {
        setLoading(false)
      }
    }

    fetchVirtueDetails()
  }, [id])

  const handleSelectVirtue = async () => {
    try {
      setIsSubmitting(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('You must be logged in to select a virtue.')

      // CORRECTED UPSERT COMMAND
      const { error } = await supabase
        .from('user_active_virtue')
        .upsert(
          { user_id: user.id, virtue_id: id },
          { onConflict: 'user_id' } // Tells Supabase which column to check for conflicts
        )

      if (error) throw error

      alert(`You are now practicing "${virtue?.name}". Let's start journaling!`)
      router.push('/journal')
    } catch (error) {
        if (error instanceof Error) {
            alert(error.message)
        }
    } finally {
        setIsSubmitting(false)
    }
  }

  if (loading) return <div className="p-4">Loading virtue...</div>
  if (!virtue) return <div className="p-4">Virtue not found.</div>

  return (
    <div className="container mx-auto p-4 max-w-3xl">
       <Button variant="outline" onClick={() => router.back()} className="mb-4">
        &larr; Back to Dashboard
      </Button>
      
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2 text-brand-header">{virtue.name}</h1>
        <p className="text-lg text-brand-text mb-4">{virtue.description}</p>
        <Button onClick={handleSelectVirtue} disabled={isSubmitting}>
          {isSubmitting ? 'Selecting...' : 'Select this Virtue to Practice'}
        </Button>
      </div>
      
      {virtue.virtue_stages.map(stage => (
        <div key={stage.id} className="mb-8 p-4 border rounded-lg">
          <h2 className="text-2xl font-semibold mb-3">{stage.title}</h2>
          <ul className="list-disc pl-5 space-y-2">
            {stage.stage_prompts.map(prompt => (
              <li key={prompt.id} className="text-brand-text">
                {prompt.prompt_text}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}