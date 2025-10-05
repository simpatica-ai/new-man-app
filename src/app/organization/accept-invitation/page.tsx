'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { getInvitationByToken, acceptInvitation, getInvitationStatus } from '@/lib/invitationService'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Building2, User, Mail } from 'lucide-react'
import type { InvitationWithOrganization } from '@/lib/invitationService'

function AcceptInvitationContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  
  const [loading, setLoading] = useState(false)
  const [invitation, setInvitation] = useState<InvitationWithOrganization | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isExistingUser, setIsExistingUser] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: ''
  })

  useEffect(() => {
    document.title = "Accept Organization Invitation - A New Man App";
    
    if (!token) {
      setError('Invalid invitation link')
      return
    }

    const fetchInvitation = async () => {
      try {
        const status = await getInvitationStatus(token!)
        
        if (status.status === 'invalid') {
          setError('Invalid invitation link')
          return
        }
        
        if (status.status === 'expired') {
          setError('This invitation has expired. Please request a new invitation.')
          return
        }
        
        if (status.status === 'accepted') {
          setError('This invitation has already been accepted.')
          return
        }
        
        if (status.status === 'valid' && status.invitation) {
          setInvitation(status.invitation)
          setFormData(prev => ({ ...prev, email: status.invitation!.email }))
        } else {
          setError('Unable to load invitation details')
        }
      } catch (err) {
        console.error('Error fetching invitation:', err)
        setError('Failed to load invitation details')
      }
    }

    fetchInvitation()
  }, [token])

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      let userId: string | undefined

      if (isExistingUser) {
        // Sign in existing user
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        })

        if (signInError) {
          throw new Error('Invalid email or password')
        }

        userId = signInData?.user?.id
      } else {
        // Create new user
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: { 
              full_name: formData.fullName,
              organization_invitation_token: token!
            }
          }
        })

        if (signUpError) {
          throw signUpError
        }

        userId = signUpData?.user?.id

        // For new users, we need to wait for email confirmation
        if (!signUpData?.user?.email_confirmed_at) {
          // Store invitation token for later processing
          localStorage.setItem('pending_invitation_token', token!)
          setSuccess(true)
          return
        }
      }

      if (!userId) {
        throw new Error('Failed to authenticate user')
      }

      // Accept the invitation
      await acceptInvitation(token!, userId)
      setSuccess(true)
    } catch (error) {
      console.error('Error accepting invitation:', error)
      setError(error instanceof Error ? error.message : 'Failed to accept invitation')
    } finally {
      setLoading(false)
    }
  }

  const toggleUserType = () => {
    setIsExistingUser(!isExistingUser)
    setError(null)
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-amber-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-700">Invalid Invitation</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-stone-600 mb-4">{error}</p>
            <Button 
              onClick={() => router.push('/')}
              variant="outline"
            >
              Go to Home
            </Button>
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
            <CardTitle className="text-green-700">
              {isExistingUser ? 'Welcome to Your Organization!' : 'Check Your Email!'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {isExistingUser ? (
              <>
                <p className="text-stone-600">
                  You have successfully joined <strong>{invitation?.organization.name}</strong>.
                </p>
                <p className="text-stone-600">
                  Your roles: {invitation?.roles.map(role => (
                    <Badge key={role} variant="secondary" className="ml-1">
                      {role}
                    </Badge>
                  ))}
                </p>
                <Button 
                  onClick={() => router.push('/dashboard')}
                  className="w-full"
                  style={{ backgroundColor: invitation?.organization.primary_color }}
                >
                  Go to Dashboard
                </Button>
              </>
            ) : (
              <>
                <p className="text-stone-600">
                  We've sent a confirmation email to <strong>{formData.email}</strong>.
                </p>
                <p className="text-stone-600">
                  Please check your email and click the confirmation link to complete your registration 
                  and join <strong>{invitation?.organization.name}</strong>.
                </p>
                <Button 
                  onClick={() => router.push('/')}
                  variant="outline"
                  className="w-full"
                >
                  Go to Home
                </Button>
              </>
            )}
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
          {invitation.organization.logo_url && (
            <img 
              src={invitation.organization.logo_url} 
              alt={invitation.organization.name}
              className="h-16 w-16 mx-auto mb-4 rounded-lg object-cover"
            />
          )}
          <CardTitle className="text-2xl text-stone-800">
            Join {invitation.organization.name}
          </CardTitle>
          <p className="text-stone-600 mt-2">
            <strong>{invitation.inviter.full_name}</strong> has invited you to join their organization 
            on A New Man.
          </p>
        </CardHeader>
        <CardContent>
          {/* Invitation Details */}
          <div className="mb-6 p-4 bg-stone-50 rounded-lg border-l-4" 
               style={{ borderLeftColor: invitation.organization.primary_color }}>
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-4 w-4 text-stone-600" />
              <span className="font-medium text-stone-800">{invitation.organization.name}</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-stone-600" />
              <span className="text-stone-600">Invited by {invitation.inviter.full_name}</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <Mail className="h-4 w-4 text-stone-600" />
              <span className="text-stone-600">{invitation.email}</span>
            </div>
            <div className="mt-3">
              <span className="text-sm text-stone-600">Your roles:</span>
              <div className="mt-1">
                {invitation.roles.map(role => (
                  <Badge 
                    key={role} 
                    variant="secondary" 
                    className="mr-1 mb-1"
                    style={{ backgroundColor: invitation.organization.primary_color + '20' }}
                  >
                    {role}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* User Type Toggle */}
          <div className="mb-4 text-center">
            <p className="text-sm text-stone-600 mb-2">
              {isExistingUser ? 'Already have an account?' : 'New to A New Man?'}
            </p>
            <Button 
              type="button"
              variant="link" 
              onClick={toggleUserType}
              className="text-sm"
              style={{ color: invitation.organization.primary_color }}
            >
              {isExistingUser ? 'Create a new account instead' : 'Sign in to existing account'}
            </Button>
          </div>

          <form onSubmit={handleAccept} className="space-y-4">
            {!isExistingUser && (
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
            )}
            
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
              <Label htmlFor="password">
                {isExistingUser ? 'Password' : 'Create Password'}
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder={isExistingUser ? 'Enter your password' : 'Create a secure password'}
                required
                minLength={6}
              />
            </div>
            
            {error && (
              <p className="text-red-600 text-sm">{error}</p>
            )}
            
            <Button 
              type="submit" 
              className="w-full"
              style={{ backgroundColor: invitation.organization.primary_color }}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Accept Invitation'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-xs text-stone-500">
              By accepting this invitation, you agree to join {invitation.organization.name} 
              and follow their organizational guidelines.
            </p>
          </div>
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