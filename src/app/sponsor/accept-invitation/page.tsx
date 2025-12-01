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
  const [invitation, setInvitation] = useState<{
    id: string;
    sponsor_email: string | null;
    practitioner_id: string | null;
    profiles: {
      full_name: string | null;
    } | null;
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isExistingUser, setIsExistingUser] = useState(false)
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
      const { data, error } = await supabase
        .from('sponsor_relationships')
        .select(`
          id,
          sponsor_email,
          practitioner_id,
          profiles!sponsor_relationships_practitioner_id_fkey(full_name)
        `)
        .eq('invitation_token', token || '')
        .eq('status', 'email_sent')
        .single()

      if (error || !data) {
        setError('Invalid or expired invitation')
        return
      }

      setInvitation(data)
      setFormData(prev => ({ ...prev, email: data.sponsor_email || '' }))
      
      // Check if user is already logged in
      const { data: { user } } = await supabase.auth.getUser()
      if (user && data.sponsor_email) {
        if (user.email === data.sponsor_email) {
          // User is logged in with correct email - they can accept directly
          setIsExistingUser(true)
        } else {
          // User is logged in with wrong email
          setError(`You're logged in as ${user.email}, but this invitation is for ${data.sponsor_email}. Please log out and try again.`)
        }
      }
    }

    fetchInvitation()
  }, [token])

  const handleAccept = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      let userId: string | undefined

      // If user is already logged in, use their ID
      if (isExistingUser) {
        const { data: { user } } = await supabase.auth.getUser()
        userId = user?.id
      } else {
        // Try to sign in with existing credentials
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        })

        userId = signInData?.user?.id

        // If sign in failed, try to create new user
        if (!userId && signInError) {
          const { data: newUser, error: signUpError } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: {
              data: { full_name: formData.fullName }
            }
          })

          if (signUpError) {
            // Check if error is because user already exists
            if (signUpError.message.includes('already registered') || signUpError.message.includes('already exists')) {
              throw new Error('An account with this email already exists. Please log in first, then click the invitation link again.')
            }
            throw signUpError
          }
          userId = newUser?.user?.id
        }
      }

      if (!userId) throw new Error('Failed to authenticate user')

      // Update the invitation
      const { error: updateError } = await supabase
        .from('sponsor_relationships')
        .update({
          sponsor_id: userId,
          status: 'active'
        })
        .eq('invitation_token', token || '')

      if (updateError) throw updateError

      setSuccess(true)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to accept invitation')
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
          {isExistingUser ? (
            <div className="space-y-4">
              <p className="text-stone-600 text-sm bg-green-50 p-3 rounded border border-green-200">
                ✓ You&apos;re logged in as <strong>{formData.email}</strong>
              </p>
              <p className="text-stone-600 text-sm">
                Click below to accept the sponsorship invitation.
              </p>
              <Button 
                onClick={() => handleAccept()}
                className="w-full bg-amber-600 hover:bg-amber-700"
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Accept Invitation'}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleAccept} className="space-y-4">
              <p className="text-stone-600 text-sm bg-blue-50 p-3 rounded border border-blue-200">
                If you already have an account, please <a href={`/auth/signin?redirect=/sponsor/accept-invitation?token=${token}`} className="text-blue-600 underline">log in first</a>, then return to this invitation link.
              </p>
              <p className="text-stone-600 text-sm font-medium">
                Or create a new account below:
              </p>
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
                <p className="text-xs text-stone-500 mt-1">
                  Create a new password for your account
                </p>
              </div>
              {error && (
                <p className="text-red-600 text-sm">{error}</p>
              )}
              <Button 
                type="submit" 
                className="w-full bg-amber-600 hover:bg-amber-700"
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Create Account & Accept Invitation'}
              </Button>
            </form>
          )}
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
