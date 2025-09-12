'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle, XCircle } from 'lucide-react'

function AcceptInvitationContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  
  const [loading, setLoading] = useState(false)
  const [invitation, setInvitation] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: ''
  })

  useEffect(() => {
    document.title = "New Man App: Accept Sponsor Invitation";
    
    if (!token) {
      setError('Invalid invitation link')
      return
    }

    const fetchInvitation = async () => {
      const { data, error } = await (supabase as any)
        .from('sponsor_relationships')
        .select(`
          id,
          sponsor_email,
          practitioner_id,
          profiles!sponsor_relationships_practitioner_id_fkey(full_name, email)
        `)
        .eq('invitation_token', token || '')
        .eq('status', 'email_sent')
        .single()

      if (error || !data) {
        setError('Invalid or expired invitation')
        return
      }

      setInvitation(data)
      setFormData(prev => ({ ...prev, email: data.sponsor_email }))
    }

    fetchInvitation()
  }, [token])

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Check if user already exists
      const { data: existingUser } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      })

      let userId = existingUser?.user?.id

      if (!userId) {
        // Create new user
        const { data: newUser, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: { full_name: formData.fullName }
          }
        })

        if (signUpError) throw signUpError
        userId = newUser?.user?.id
      }

      if (!userId) throw new Error('Failed to create or authenticate user')

      // Update the invitation
      const { error: updateError } = await (supabase as any)
        .from('sponsor_relationships')
        .update({
          sponsor_id: userId,
          status: 'active'
        })
        .eq('invitation_token', token || '')

      if (updateError) throw updateError

      setSuccess(true)
    } catch (error: any) {
      setError(error.message || 'Failed to accept invitation')
    } finally {
      setLoading(false)
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-amber-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-700">Invalid Invitation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-stone-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-amber-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-green-700">Welcome as a Sponsor!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-stone-600">
              You have successfully accepted the sponsorship invitation.
            </p>
            <p className="text-stone-600">
              You can now guide and support {invitation?.profiles?.full_name || 'your practitioner'} on their journey of virtue development.
            </p>
            <Button 
              onClick={() => window.location.href = '/sponsor/dashboard'}
              className="w-full bg-amber-600 hover:bg-amber-700"
            >
              Go to Sponsor Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-amber-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-8">
            <p>Loading invitation...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-amber-100 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-stone-800">Accept Sponsor Invitation</CardTitle>
          <p className="text-stone-600 mt-2">
            You have been invited to sponsor <strong>{invitation.profiles?.full_name}</strong> on their virtue development journey.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAccept} className="space-y-4">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                placeholder="Your full name"
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Your email address"
                required
                disabled
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Create a password"
                required
              />
            </div>
            {error && (
              <p className="text-red-600 text-sm">{error}</p>
            )}
            <Button 
              type="submit" 
              className="w-full bg-amber-600 hover:bg-amber-700"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Accept Invitation'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-amber-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-8">
            <p>Loading...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <AcceptInvitationContent />
    </Suspense>
  )
}
