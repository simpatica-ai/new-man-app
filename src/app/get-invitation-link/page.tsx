'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Copy } from 'lucide-react'

export default function GetInvitationLink() {
  const [invitationLink, setInvitationLink] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getLink = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('sponsor_relationships')
        .select('invitation_token')
        .eq('practitioner_id', user.id)
        .eq('status', 'email_sent')
        .single()

      if (data?.invitation_token) {
        const baseUrl = process.env.NODE_ENV === 'production' 
          ? 'https://new-man-app.simpatica.ai' 
          : window.location.origin
        const link = `${baseUrl}/sponsor/accept-invitation?token=${data.invitation_token}`
        setInvitationLink(link)
      }
      setLoading(false)
    }

    getLink()
  }, [])

  const copyLink = () => {
    if (invitationLink) {
      navigator.clipboard.writeText(invitationLink).then(() => {
        alert('Link copied to clipboard!')
      }).catch(() => {
        alert('Failed to copy link')
      })
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-amber-100 p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Your Sponsor Invitation Link</CardTitle>
        </CardHeader>
        <CardContent>
          {invitationLink ? (
            <div className="space-y-4">
              <div className="p-4 bg-stone-50 rounded border break-all">
                {invitationLink}
              </div>
              <Button onClick={copyLink} className="flex items-center gap-2">
                <Copy className="h-4 w-4" />
                Copy Link
              </Button>
              <p className="text-sm text-stone-600">
                Share this link with your sponsor via email, text, or any other method.
              </p>
            </div>
          ) : (
            <p>No pending invitation found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
