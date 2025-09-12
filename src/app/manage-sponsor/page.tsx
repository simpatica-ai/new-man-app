'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { UserPlus, CheckCircle, Clock } from 'lucide-react'
import AppHeader from '@/components/AppHeader'

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

      // Get connection details from sponsor_relationships table
      const { data, error } = await supabase
        .from('sponsor_relationships')
        .select(`
          id,
          status,
          profiles!sponsor_relationships_sponsor_id_fkey(full_name)
        `)
        .eq('practitioner_id', user.id)
        .in('status', ['pending', 'active', 'email_sent'])
        .maybeSingle()

      if (error) throw error;
      
      if (data) {
        setConnection({
          id: data.id,
          status: data.status,
          sponsor_name: data.profiles?.full_name || 'Your Sponsor'
        });
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

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-amber-100 relative">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgb(120,113,108)_1px,_transparent_0)] bg-[length:32px_32px]"></div>
      </div>
      <div className="relative z-10">
        <AppHeader />
        <div className="p-8 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-stone-300/60 rounded-lg w-64 mx-auto"></div>
            <div className="h-4 bg-amber-200/60 rounded-lg w-48 mx-auto"></div>
          </div>
          <p className="text-stone-600 font-light mt-4">Loading connection status...</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-amber-100 relative">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgb(120,113,108)_1px,_transparent_0)] bg-[length:32px_32px]"></div>
      </div>
      
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-50/60 to-stone-100/80"></div>
      
      <div className="relative z-10">
        <AppHeader />
        <main className="container mx-auto p-4 md:p-8 max-w-2xl">
          <div className="mb-6">
            <h1 className="text-3xl font-light text-stone-800 leading-tight">
              Sponsor Connection
              <span className="block text-xl font-medium text-amber-900 mt-1">Manage Your Mentorship</span>
            </h1>
            <div className="w-24 h-0.5 bg-gradient-to-r from-amber-600 to-stone-600 mt-3"></div>
          </div>

          <Card className="bg-white/80 backdrop-blur-sm border-stone-200/60 shadow-gentle">
            <CardHeader className="flex flex-row items-center gap-4">
              <UserPlus className="h-6 w-6 text-amber-700" />
              <div>
                <CardTitle className="text-stone-800 font-medium">Your Sponsor</CardTitle>
                <CardDescription className="text-stone-600">Connect with a mentor to guide your virtue journey.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {connection ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-stone-50 rounded-lg border border-amber-200/60">
                    <div>
                      <p className="text-sm text-stone-600">Connected with:</p>
                      <p className="text-lg font-medium text-stone-800">{connection.sponsor_name || 'Your Sponsor'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {connection.status === 'active' ? (
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      ) : connection.status === 'email_sent' ? (
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                          <Clock className="h-3 w-3 mr-1" />
                          Email Sent
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                          <Clock className="h-3 w-3 mr-1" />
                          {connection.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {connection.status === 'active' && (
                    <p className="text-sm text-stone-600 bg-stone-50 p-3 rounded-lg">
                      Your sponsor can now view your virtue progress and chat with you through the virtue workspace.
                    </p>
                  )}
                  {connection.status === 'email_sent' && (
                    <p className="text-sm text-stone-600 bg-blue-50 p-3 rounded-lg">
                      An invitation email has been sent to your sponsor. They need to create an account and accept the invitation to complete the connection.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-stone-50 rounded-lg border border-stone-200">
                    <p className="text-stone-700 mb-4">You are not currently connected with a sponsor. Enter your sponsor&apos;s email address below to invite them to guide your journey.</p>
                    <div className="space-y-3">
                      <Input
                        type="email"
                        placeholder="sponsor@example.com"
                        value={sponsorEmail}
                        onChange={(e) => setSponsorEmail(e.target.value)}
                        className="bg-white border-stone-300 focus:border-amber-500"
                      />
                      <Button 
                        onClick={handleInviteSponsor} 
                        disabled={isSubmitting}
                        className="w-full bg-gradient-to-r from-amber-600 to-stone-600 hover:from-amber-700 hover:to-stone-700 text-white transition-all duration-200"
                      >
                        {isSubmitting ? 'Sending Invite...' : 'Invite Sponsor'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
