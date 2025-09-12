'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UserPlus } from 'lucide-react'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const searchParams = useSearchParams()
  const router = useRouter()
  const invitationToken = searchParams.get('invitation_token')
  const prefilledEmail = searchParams.get('email')

  useEffect(() => {
    if (prefilledEmail) {
      setEmail(prefilledEmail)
    }
  }, [prefilledEmail])

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: invitationToken ? 'sponsor' : 'practitioner'
          }
        }
      })

      if (error) throw error

      if (data.user && invitationToken) {
        // Accept the sponsor invitation
        const { error: updateError } = await supabase
          .from('sponsor_relationships')
          .update({
            sponsor_id: data.user.id,
            status: 'active'
          })
          .eq('invitation_token', invitationToken)

        if (updateError) {
          console.error('Error accepting invitation:', updateError)
        }

        router.push('/sponsor/dashboard')
      } else {
        router.push('/')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-amber-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <UserPlus className="h-12 w-12 text-amber-600 mx-auto mb-4" />
          <CardTitle className="text-stone-800">
            {invitationToken ? 'Join as Sponsor' : 'Create Account'}
          </CardTitle>
          <CardDescription>
            {invitationToken 
              ? 'Complete your sponsor registration' 
              : 'Start your virtue development journey'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="bg-white border-stone-300 focus:border-amber-500"
              />
            </div>
            <div>
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={!!prefilledEmail}
                className="bg-white border-stone-300 focus:border-amber-500"
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white border-stone-300 focus:border-amber-500"
              />
            </div>
            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-600 to-stone-600 hover:from-amber-700 hover:to-stone-700"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
