// src/app/journal/page.tsx

'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

// Define our data types
type JournalEntry = {
  id: number
  created_at: string
  entry_text: string
  entry_type: 'morning_intention' | 'evening_reflection'
}
type Prompt = { id: number; prompt_text: string; prompt_type: string }
type ActiveVirtueInfo = {
  virtue_id: number
  virtue_name: string
  stage_number: number
  stage_title: string
  prompts: Prompt[]
}

export default function JournalPage() {
  const [activeVirtue, setActiveVirtue] = useState<ActiveVirtueInfo | null>(null)
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [morningEntry, setMorningEntry] = useState('')
  const [eveningEntry, setEveningEntry] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const getActiveVirtueInfo = async () => {
      try {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/')
          return
        }

        const { data, error } = await supabase.rpc('get_user_active_virtue_details', { user_id_param: user.id })
        if (error) throw error

        if (data && data.length > 0) {
          setActiveVirtue(data[0])
          // Once we have the active virtue, fetch its entries
          const { data: entryData, error: entryError } = await supabase
            .from('user_journal_entries')
            .select('*')
            .eq('user_id', user.id)
            .eq('virtue_id', data[0].virtue_id)
            .order('created_at', { ascending: false })
          
          if (entryError) throw entryError
          setEntries(entryData || [])
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }
    getActiveVirtueInfo()
  }, [router])

  const handleSubmitEntry = async (entryText: string, entryType: 'morning_intention' | 'evening_reflection') => {
    if (!entryText.trim()) {
        alert('Please write something in your journal entry.')
        return
    }
    try {
        setIsSubmitting(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || !activeVirtue) return

        const { data: newEntry, error } = await supabase.from('user_journal_entries').insert({
            user_id: user.id,
            virtue_id: activeVirtue.virtue_id,
            entry_text: entryText,
            entry_type: entryType
        }).select().single()

        if (error) throw error
        
        // Add the new entry to the top of the list for an instant update
        if (newEntry) {
          setEntries([newEntry, ...entries])
        }

        if (entryType === 'morning_intention') setMorningEntry('')
        if (entryType === 'evening_reflection') setEveningEntry('')

    } catch (error) {
        if (error instanceof Error) {
            alert(`Error saving entry: ${error.message}`)
        }
    } finally {
        setIsSubmitting(false)
    }
  }

  if (loading) {
    return <div className="p-4">Loading your journal...</div>
  }

  if (!activeVirtue) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <h1 className="text-2xl font-bold mb-4">No Active Virtue Selected</h1>
        <p className="mb-4">Please go to the dashboard to choose a virtue to practice.</p>
        <Link href="/">
          <Button>Go to Dashboard</Button>
        </Link>
      </div>
    )
  }
  
  const morningPrompts = activeVirtue.prompts.filter(p => p.prompt_type === 'morning_intention');
  const eveningPrompts = activeVirtue.prompts.filter(p => p.prompt_type === 'evening_reflection');

  const morningEntries = entries.filter(e => e.entry_type === 'morning_intention');
  const eveningEntries = entries.filter(e => e.entry_type === 'evening_reflection');

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-brand-header">{activeVirtue.virtue_name}</h1>
        <p className="text-lg text-brand-text">{activeVirtue.stage_title}</p>
         <Link href="/" className="text-sm text-blue-600 hover:underline">
            &larr; Back to Dashboard
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Morning Section */}
        <section>
          <Card>
            <CardHeader><CardTitle>Morning Intention</CardTitle></CardHeader>
            <CardContent>
              {morningPrompts.map(p => <p key={p.id} className="mb-4 text-brand-text italic">{p.prompt_text}</p>)}
              <Textarea placeholder="Write your morning intention..." value={morningEntry} onChange={(e) => setMorningEntry(e.target.value)} />
              <Button className="mt-4" onClick={() => handleSubmitEntry(morningEntry, 'morning_intention')} disabled={isSubmitting}>Save Morning Entry</Button>
            </CardContent>
          </Card>
          <div className="mt-6">
            <h3 className="font-semibold text-lg mb-2">My Morning Intentions</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {morningEntries.length > 0 ? morningEntries.map(entry => (
                <div key={entry.id} className="p-3 border rounded-md bg-gray-50">
                  <p className="text-sm text-gray-500">{new Date(entry.created_at).toLocaleDateString()}</p>
                  <p className="text-brand-text">{entry.entry_text}</p>
                </div>
              )) : <p className="text-gray-500">No morning entries yet.</p>}
            </div>
          </div>
        </section>

        {/* Evening Section */}
        <section>
          <Card>
            <CardHeader><CardTitle>Evening Reflection</CardTitle></CardHeader>
            <CardContent>
              {eveningPrompts.map(p => <p key={p.id} className="mb-4 text-brand-text italic">{p.prompt_text}</p>)}
              <Textarea placeholder="Write your evening reflection..." value={eveningEntry} onChange={(e) => setEveningEntry(e.target.value)} />
              <Button className="mt-4" onClick={() => handleSubmitEntry(eveningEntry, 'evening_reflection')} disabled={isSubmitting}>Save Evening Entry</Button>
            </CardContent>
          </Card>
           <div className="mt-6">
            <h3 className="font-semibold text-lg mb-2">My Evening Reflections</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {eveningEntries.length > 0 ? eveningEntries.map(entry => (
                <div key={entry.id} className="p-3 border rounded-md bg-gray-50">
                  <p className="text-sm text-gray-500">{new Date(entry.created_at).toLocaleDateString()}</p>
                  <p className="text-brand-text">{entry.entry_text}</p>
                </div>
              )) : <p className="text-gray-500">No evening entries yet.</p>}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}