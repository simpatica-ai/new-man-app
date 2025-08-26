// src/components/Dashboard.tsx

'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Session } from '@supabase/supabase-js'
import { Button } from './ui/button'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

type Virtue = {
  id: number;
  name: string;
  description: string;
};

// A new type for sponsor invitations, joining with the profiles table
type Invitation = {
    id: number; // This is the connection ID
    status: string;
    profiles: {
        full_name: string | null;
        id: string; // This is the practitioner's user ID
    } | null
}

export default function Dashboard({ session }: { session: Session }) {
  const [loading, setLoading] = useState(true)
  const [virtues, setVirtues] = useState<Virtue[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])

  // This function gets all the necessary data for the dashboard
  const getDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch virtues for the practitioner view
      const virtuesPromise = supabase.from('virtues').select(`id, name, description`).order('id')

      // Fetch any pending invitations where the current user is the sponsor
      // We join with the 'profiles' table to get the practitioner's name
      const invitesPromise = supabase
        .from('sponsor_connections')
        .select(`
            id, 
            status,
            profiles ( id, full_name )
        `)
        .eq('sponsor_user_id', user.id)
        .eq('status', 'pending')
      
      // Run both queries in parallel for performance
      const [virtuesResult, invitesResult] = await Promise.all([virtuesPromise, invitesPromise])

      if (virtuesResult.error) throw virtuesResult.error
      setVirtues(virtuesResult.data || [])
      
      if (invitesResult.error) throw invitesResult.error
      setInvitations(invitesResult.data || [])

    } catch (error) {
      if (error instanceof Error) alert(error.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    getDashboardData()
  }, [getDashboardData])
  
  // This function updates the connection status to 'active'
  const handleAcceptInvite = async (connectionId: number) => {
      try {
          const { error } = await supabase
            .from('sponsor_connections')
            .update({ status: 'active' })
            .eq('id', connectionId)
        
          if (error) throw error
          alert('Connection accepted! You can now view this user\'s journal.')
          // Refresh the dashboard to remove the pending invitation
          getDashboardData()
      } catch (error) {
          if (error instanceof Error) alert(error.message)
      }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-gray-600">Signed in as: {session.user.email}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Link href="/sponsor"><Button variant="outline">Manage Sponsor</Button></Link>
          <Button onClick={handleSignOut} variant="outline">Sign Out</Button>
        </div>
      </div>
      
      {/* SPONSOR HUB - Only shows if there are invitations */}
      {