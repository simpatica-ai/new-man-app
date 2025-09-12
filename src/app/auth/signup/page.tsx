'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle } from 'lucide-react'

function SignupContent() {
  const searchParams = useSearchParams()
  const prefilledEmail = searchParams.get('email')
  
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: ''
  })

  useEffect(() => {
    document.title = "New Man App: Sign Up";
    
    if (prefilledEmail) {
      setFormData(prev => ({ ...prev, email: prefilledEmail }))
    }
  }, [prefilledEmail])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Check if there's a pending sponsor invitation for this email
      const { data: invitation } = await (supabase as any)
        .from('sponsor_relationships')
        .select('id, invitation_token')
        .eq('sponsor_email', formData.email)
        .eq('status', 'email_sent')
        .maybeSingle()

      // Sign up the user
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: { full_name: formData.fullName }
        }
      })

      if (signUpError) throw signUpError

      // If there's a pending invitation, activate it
      if (invitation && data.user) {
        await (supabase as any)
          .from('sponsor_relationships')
          .update({
            sponsor_id: data.user.id,
            status: 'active'
          })
          .eq('id', invitation.id)
      }

      setSuccess(true)
    } catch (error: any) {
      setError(error.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-amber-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-green-700">Account Created!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-stone-600">
              Check your email for a confirmation link to complete your registration.
            </p>
            <Button 
              onClick={() => window.location.href = '/'}
              className="w-full bg-amber-600 hover:bg-amber-700"
            >
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-amber-100 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-stone-800">Create Your Account</CardTitle>
          <p className="text-stone-600 mt-2">
            Join the journey of virtue development
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
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
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function SignupPage() {
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
      <SignupContent />
    </Suspense>
  )
}
