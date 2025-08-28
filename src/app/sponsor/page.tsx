// src/app/sponsor/page.tsx -- FINAL VERSION

'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

type ConnectionDetails = {
  id: number;
  status: string;
  sponsor_name: string | null;
}

export default function SponsorPage() {
  const [connection, setConnection] = useState<ConnectionDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [sponsorEmail, setSponsorEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchConnection = useCallback(async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .rpc('get_practitioner_connection_details', {
          practitioner_id_param: user.id,
        })

      if (error) throw error;
      
      if (data && data.length > 0) {
        setConnection(data[0]);
      } else {
        setConnection(null);
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
      
      const { data, error } = await supabase.functions.invoke('invite-sponsor', {
        body: { email: sponsorEmail },
      })

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      // This is the updated, more informative success message
      alert('Invitation sent successfully! The sponsor must now log in to their own account to accept the request.');
      fetchConnection()

    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("Sponsor user not found")) {
          alert("Your requested sponsor is not a user. Please invite them to sign up first.");
        } else {
          alert(error.message);
        }
      }
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
              <p>Your sponsor is: <strong>{connection.sponsor_name || 'Sponsor'}</strong></p>
              <p>Status: <span className="font-semibold capitalize">{connection.status}</span></p>
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