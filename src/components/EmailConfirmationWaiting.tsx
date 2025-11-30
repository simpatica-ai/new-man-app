'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Mail, CheckCircle, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

interface EmailConfirmationWaitingProps {
  email: string
}

export default function EmailConfirmationWaiting({ email }: EmailConfirmationWaitingProps) {
  const [isChecking, setIsChecking] = useState(false)

  useEffect(() => {
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at) {
        // Email confirmed! Redirect to dashboard
        window.location.href = '/'
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleResendEmail = async () => {
    try {
      setIsChecking(true)
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      })

      if (error) throw error
      alert('Confirmation email sent! Please check your inbox.')
    } catch (error) {
      console.error('Error resending email:', error)
      alert('Error sending email. Please try again.')
    } finally {
      setIsChecking(false)
    }
  }

  const handleCheckStatus = async () => {
    try {
      setIsChecking(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user?.email_confirmed_at) {
        window.location.href = '/'
      } else {
        alert('Email not yet confirmed. Please check your inbox and click the confirmation link.')
      }
    } catch (error) {
      console.error('Error checking status:', error)
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Mail className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            Check Your Email
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              We&apos;ve sent a confirmation email to:
            </p>
            <p className="font-medium text-gray-900">{email}</p>
          </div>

          <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
            <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Almost there!</p>
              <p>Click the confirmation link in your email to access your dashboard. This page will automatically redirect once confirmed.</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <Button 
              onClick={handleCheckStatus} 
              className="w-full" 
              disabled={isChecking}
            >
              {isChecking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                'I&apos;ve Confirmed - Check Status'
              )}
            </Button>
            
            <Button 
              onClick={handleResendEmail} 
              className="w-full" 
              variant="outline"
              disabled={isChecking}
            >
              Resend Confirmation Email
            </Button>
          </div>
          
          <div className="text-xs text-gray-500 text-center space-y-1">
            <p>Check your spam folder if you don&apos;t see the email.</p>
            <p>The confirmation link will expire in 24 hours.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
