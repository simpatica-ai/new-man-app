'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Session } from '@supabase/supabase-js'
import { Button } from './ui/button'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'

type Virtue = {
  id: number;
  name: string;
  description: string;
};

type Connection = {
    id: number;
    status: 'pending' | 'active';
    practitioner: {
        full_name: string | null;
        id: string;
    }
}

export default function Dashboard({ session }: { session: Session }) {
  const [loading, setLoading] = useState(true)
  const [virtues, setVirtues] = useState<Virtue[]>([])
  const [invitations, setInvitations] = useState<Connection[]>([])
  const [activeSponsorships, setActiveSponsorships] = useState<Connection[]>([])

  const getDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const virtuesPromise = supabase.from('virtues').select(`id, name, description`).order('id')

      const connectionsPromise = supabase
        .from('sponsor_connections')
        .select(`id, status, practitioner:profiles!inner (id, full_name)`)
        .eq('sponsor_user_id', user.id)
      
      const [virtuesResult, connectionsResult] = await Promise.all([virtuesPromise, connectionsPromise])

      if (virtuesResult.error) throw virtuesResult.error
      setVirtues(virtuesResult.data || [])
      
      if (connectionsResult.error) throw connectionsResult.error
      if (connectionsResult.data) {
          setInvitations(connectionsResult.data.filter(c => c.status === 'pending'));
          setActiveSponsorships(connectionsResult.data.filter(c => c.status === 'active'));
      }

    } catch (error) {
      if (error instanceof Error) alert(error.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    getDashboardData()
  }, [getDashboardData])
  
  const handleAcceptInvite = async (connectionId: number) => {
      try {
          const { error } = await supabase
            .from('sponsor_connections')
            .update({ status: 'active' })
            .eq('id', connectionId)
        
          if (error) throw error
          alert('Connection accepted!')
          getDashboardData()
      } catch (error) {
          if (error instanceof Error) alert(error.message)
      }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const SponsorDashboard = () => (
    <Card>
        <CardHeader>
            <CardTitle>Sponsor Hub</CardTitle>
            {/* THIS LINE IS THE FIX */}
            <CardDescription>Review invitations and access your practitioners&apos; journals.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            {invitations.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2 text-blue-800">Pending Invitations</h3>
                  <ul className="space-y-2">
                      {invitations.map(invite => (
                          <li key={invite.id} className="flex justify-between items-center p-2 border rounded-md bg-white">
                              <span>Invitation from: <strong>{invite.practitioner?.full_name || 'A new practitioner'}</strong></span>
                              <Button size="sm" onClick={() => handleAcceptInvite(invite.id)}>Accept</Button>
                          </li>
                      ))}
                  </ul>
                </div>
            )}
             {activeSponsorships.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Actively Sponsoring</h3>
                  <ul className="space-y-2">
                      {activeSponsorships.map(conn => (
                          <li key={conn.id} className="flex justify-between items-center p-2 border rounded-md bg-white">
                              <span><strong>{conn.practitioner?.full_name || 'Practitioner'}</strong></span>
                              <Link href={`/sponsor/journal/${conn.practitioner.id}`}>
                                <Button size="sm" variant="outline">View Journal</Button>
                              </Link>
                          </li>
                      ))}
                  </ul>
                </div>
            )}
        </CardContent>
    </Card>
  );

  const PractitionerDashboard = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Choose a Virtue to Practice</h2>
      {loading && virtues.length === 0 ? (
        <p>Loading virtues...</p>
      ) : (
        <ul className="space-y-3">
          {virtues.map((virtue) => (
            <li key={virtue.id}>
              <Link 
                href={`/virtue/${virtue.id}`} 
                className="block p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              >
                <h3 className="font-bold text-lg text-brand-header">{virtue.name}</h3>
                <p className="text-brand-text">{virtue.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-gray-600">Signed in as: {session.user.email}</p>
        </div>
        <div className="flex items-center space-x-2">
          {activeSponsorships.length === 0 && (
            <Link href="/sponsor"><Button variant="outline">Manage Sponsor</Button></Link>
          )}
          <Button onClick={handleSignOut} variant="outline">Sign Out</Button>
        </div>
      </div>
      
      {loading ? (
        <p>Loading dashboard...</p>
      ) : activeSponsorships.length > 0 || invitations.length > 0 ? (
        <SponsorDashboard />
      ) : (
        <PractitionerDashboard />
      )}
    </div>
  )
}