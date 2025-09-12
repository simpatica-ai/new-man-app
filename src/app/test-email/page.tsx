'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestEmail() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const testEmail = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/send-sponsor-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sponsorEmail: email,
          practitionerName: 'Test User',
          invitationLink: 'http://localhost:3000/sponsor/accept-invitation?token=test'
        })
      })

      const data = await response.json() as { error?: string }
      
      if (response.ok) {
        setResult('✅ Email sent successfully!')
      } else {
        setResult(`❌ Error: ${data.error || 'Unknown error'}`)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setResult(`❌ Network error: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-amber-100 p-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Test Email Sending</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="email"
            placeholder="Test email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button 
            onClick={testEmail} 
            disabled={loading || !email}
            className="w-full"
          >
            {loading ? 'Sending...' : 'Send Test Email'}
          </Button>
          {result && (
            <div className="p-3 rounded bg-stone-100 text-sm">
              {result}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
