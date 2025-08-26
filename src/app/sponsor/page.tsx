// src/app/sponsor/page.tsx

'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

type Connection = {
  id: number
  status: string
  // We'll need to join to get sponsor details later
  sponsor_email?: string // This will come from a join in the future
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

      // For now, we just fetch the direct connection
      // Later, we can join to get the sponsor's name/email
      const { data, error } = await supabase
        .from('sponsor_connections')
        .select('*')
        .eq('practitioner_user_id', user.id)
        .maybeSingle() // A user might have one or zero connections

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

  const handleInviteSponsor = async () => {
    if (!sponsorEmail.trim()) {
      alert('Please enter a valid email address for your sponsor.')
      return
    }
    try {
      setIsSubmitting(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('You must be logged in to invite a sponsor.')

      // This is a placeholder for a more robust invitation system
      // For the MVP, we will directly invite a user by creating a pending connection
      // A full implementation would use an Edge Function to send an email
      alert(`In a full app, an email invite would be sent to ${sponsorEmail}. For now, we will simulate this by creating a pending connection if the user exists.`)
      
      // We will add the logic to create the connection in the next step
      // For now, this UI is the focus.

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
              {/* In the future, we'll show the sponsor's name here */}
            </div>
          ) : (
            <div className="space-y-4">
              <p>You are not currently connected with a sponsor. Enter your sponsor's email address below to invite them.</p>
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