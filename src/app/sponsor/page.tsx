// src/app/sponsor/page.tsx

'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

type Connection = {
  id: number
  status: string
  sponsor_email?: string 
}

export default function SponsorPage() {
  const [connection, setConnection] = useState<Connection | null>(null)
  const [loading, setLoading] = useState(true)
  const [sponsorEmail, setSponsorEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchConnection = useCallback(async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('sponsor_connections')
        .select('*')
        .eq('practitioner_user_id', user.id)
        .maybeSingle()

      if (error) throw error
      if (data) {
        setConnection(data)
      }
    } catch (error) {
      if (error instanceof Error) alert(error.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConnection()
  }, [fetchConnection])

  // UPDATED FUNCTION
  const handleInviteSponsor = async () => {
    if (!sponsorEmail.trim()) {
      alert('Please enter a valid email address for your sponsor.')
      return
    }
    try {
      setIsSubmitting(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('You must be logged in to invite a sponsor.')

      // This securely calls our Edge Function
      const { data, error } = await supabase.functions.invoke('invite-sponsor', {
        body: { 
          practitioner_user_id: user.id,
          sponsor_email: sponsorEmail 
        },
      })

      if (error) throw error

      alert(data.message)
      // Refresh the connection status to show the new 'pending' state
      fetchConnection()

    } catch (error) {
      if (error instanceof Error) alert(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) return <div className="p-4">Loading connection status...</div>

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Link href="/" className="text-sm text-blue-600 hover:underline mb-4 block">
        &larr; Back to Dashboard
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>Sponsor Connection</CardTitle>
          <CardDescription>Manage your connection with your sponsor.</CardDescription>
        </CardHeader>
        <CardContent>
          {connection ? (
            <div>
              <p>Your connection status is: <span className="font-semibold capitalize">{connection.status}</span></p>
            </div>
          ) : (
            <div className="space-y-4">
              <p>You are not currently connected with a sponsor. Enter your sponsor&apos;s email address below to invite them.</p>
              <Input
                type="email"
                placeholder="sponsor@example.com"
                value={sponsorEmail}
                onChange={(e) => setSponsorEmail(e.target.value)}
              />
              <Button onClick={handleInviteSponsor} disabled={isSubmitting}>
                {isSubmitting ? 'Sending Invite...' : 'Invite Sponsor'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}