'use client'

import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Mail, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

export default function EmailConfirmationRequired() {
  const handleResendEmail = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email!
      })

      if (error) throw error
      alert('Confirmation email sent! Please check your inbox.')
    } catch (error) {
      console.error('Error resending email:', error)
      alert('Error sending email. Please try again.')
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/auth/signup'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
            <Mail className="h-6 w-6 text-amber-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            Please Confirm Your Email
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Email confirmation required</p>
              <p>We've sent a confirmation email to your inbox. Please click the link in the email to verify your account and access the platform.</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <Button onClick={handleResendEmail} className="w-full" variant="outline">
              Resend Confirmation Email
            </Button>
            <Button onClick={handleSignOut} className="w-full" variant="ghost">
              Sign Out & Try Again
            </Button>
          </div>
          
          <div className="text-xs text-gray-500 text-center">
            <p>Check your spam folder if you don't see the email.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
