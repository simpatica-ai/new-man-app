'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UserPlus, AlertCircle } from 'lucide-react'

export default function AcceptInvitationPage() {
  const [loading, setLoading] = useState(true)
  const [invitation, setInvitation] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [accepting, setAccepting] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const fetchInvitation = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('sponsor_relationships')
        .select(`
          id,
          sponsor_email,
          status,
          practitioner_id,
          profiles!sponsor_relationships_practitioner_id_fkey(full_name, email)
        `)
        .eq('invitation_token', token)
        .eq('status', 'email_sent')
        .single()

      if (error || !data) {
        setError('Invitation not found or already accepted')
        return
      }

      setInvitation(data)
    } catch (err) {
      setError('Failed to load invitation')
      console.error('Fetch invitation error:', err)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link')
      setLoading(false)
      return
    }

    fetchInvitation()
  }, [token, fetchInvitation])

  const acceptInvitation = async () => {
    if (!invitation) return

    try {
      setAccepting(true)
      
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        // Redirect to sign up with invitation context
        const signUpUrl = `/auth/signup?invitation_token=${token}&email=${invitation.sponsor_email}`
        router.push(signUpUrl)
        return
      }

      // User is authenticated, accept the invitation
      const { error: updateError } = await supabase
        .from('sponsor_relationships')
        .update({
          sponsor_id: user.id,
          status: 'active'
        })
        .eq('invitation_token', token)

      if (updateError) throw updateError

      // Update user role to sponsor
      await supabase
        .from('profiles')
        .update({ role: 'sponsor' })
        .eq('id', user.id)

      router.push('/sponsor/dashboard')
    } catch (err) {
      setError('Failed to accept invitation')
      console.error('Accept invitation error:', err)
    } finally {
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-amber-100 flex items-center justify-center">
        <div className="animate-pulse text-stone-600">Loading invitation...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-amber-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-700">Invalid Invitation</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-amber-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <UserPlus className="h-12 w-12 text-amber-600 mx-auto mb-4" />
          <CardTitle className="text-stone-800">Sponsor Invitation</CardTitle>
          <CardDescription>
            You've been invited to sponsor {invitation?.profiles?.full_name || invitation?.profiles?.email}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <p className="text-sm text-amber-800">
              As a sponsor, you'll guide and support their virtue development journey.
            </p>
          </div>
          <Button 
            onClick={acceptInvitation}
            disabled={accepting}
            className="w-full bg-gradient-to-r from-amber-600 to-stone-600 hover:from-amber-700 hover:to-stone-700"
          >
            {accepting ? 'Accepting...' : 'Accept Invitation'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
