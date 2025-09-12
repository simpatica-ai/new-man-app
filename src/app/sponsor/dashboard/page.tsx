'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, CheckCircle } from 'lucide-react'
import AppHeader from '@/components/AppHeader'

export default function SponsorDashboard() {
  const [relationships, setRelationships] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRelationships()
  }, [])

  const fetchRelationships = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('sponsor_relationships')
        .select(`
          id,
          status,
          created_at,
          profiles!sponsor_relationships_practitioner_id_fkey(full_name, email)
        `)
        .eq('sponsor_id', user.id)

      if (error) throw error
      setRelationships(data || [])
    } catch (err) {
      console.error('Error fetching relationships:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-amber-100">
      <AppHeader />
      <main className="container mx-auto p-4 md:p-8 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-light text-stone-800">
            Sponsor Dashboard
            <span className="block text-xl font-medium text-amber-900 mt-1">Your Mentorship Connections</span>
          </h1>
          <div className="w-24 h-0.5 bg-gradient-to-r from-amber-600 to-stone-600 mt-3"></div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-pulse text-stone-600">Loading your connections...</div>
          </div>
        ) : (
          <div className="grid gap-4">
            {relationships.length === 0 ? (
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader className="text-center">
                  <Users className="h-12 w-12 text-stone-400 mx-auto mb-4" />
                  <CardTitle className="text-stone-600">No Connections Yet</CardTitle>
                  <CardDescription>
                    You haven't been connected with any practitioners yet.
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : (
              relationships.map((relationship) => (
                <Card key={relationship.id} className="bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-stone-800">
                          {relationship.profiles?.full_name || relationship.profiles?.email}
                        </CardTitle>
                        <CardDescription>
                          Connected since {new Date(relationship.created_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <Badge className={
                        relationship.status === 'active' 
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : 'bg-amber-100 text-amber-800 border-amber-200'
                      }>
                        {relationship.status === 'active' && <CheckCircle className="h-3 w-3 mr-1" />}
                        {relationship.status}
                      </Badge>
                    </div>
                  </CardHeader>
                </Card>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  )
}
