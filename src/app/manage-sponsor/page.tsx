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

export default function ManageSponsorPage() {
  const [connection, setConnection] = useState<ConnectionDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [sponsorEmail, setSponsorEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchConnection = useCallback(async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Calls the reliable RPC function to get connection details
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
      if (error instanceof Error) {
        alert("Failed to fetch sponsor details: " + error.message);
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConnection()
  }, [fetchConnection])

  const handleInviteSponsor = async () => {
    if (!sponsorEmail) {
      alert('Please enter your sponsor\'s email address.')
      return
    }
    try {
      setIsSubmitting(true)
      // ## FIX: Removed unused 'data' variable.
      const { error } = await supabase.functions.invoke('invite-sponsor', {
        body: { sponsor_email: sponsorEmail },
      })

      if (error) {
        // This logic correctly parses the structured error from the Edge Function
        try {
          const errorJson = JSON.parse(error.message);
          alert(`Error: ${errorJson.error}`);
        } catch {
          alert(`An unexpected error occurred: ${error.message}`);
        }
        return;
      }

      alert('Invitation sent successfully!')
      fetchConnection(); // Refresh connection status
    } catch (error) {
      if (error instanceof Error) {
        alert("A client-side error occurred: " + error.message);
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) return <div className="p-4 text-center">Loading connection status...</div>

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Link href="/" className="mb-4 inline-block">
          <Button variant="outline">&larr; Back to Dashboard</Button>
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
