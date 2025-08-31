'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Auth from '@/components/Auth'
import Dashboard from '@/components/Dashboard'

export default function Home() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkSession() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Session fetch error:', error.message)
          await supabase.auth.signOut()
          return
        }
        setSession(session)
      } catch (error) {
        console.error('Auth error:', error instanceof Error ? error.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    checkSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (!session) {
        console.log('User signed out, redirecting to login if needed')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return <div className="p-4 text-center">Loading...</div>
  }

  return (
    <div>
      {!session ? (
        <Auth />
      ) : (
        <Dashboard key={session.user.id} session={session} />
      )}
    </div>
  )
}