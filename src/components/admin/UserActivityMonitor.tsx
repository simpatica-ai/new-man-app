'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

interface UserActivity {
  user_id: string
  last_seen: string
  is_online: boolean
  current_page: string | null
}

interface UserActivityMonitorProps {
  onActivityUpdate: (activities: UserActivity[]) => void
}

export default function UserActivityMonitor({ onActivityUpdate }: UserActivityMonitorProps) {
  const fetchUserActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('user_activity_sessions')
        .select('user_id, last_seen, current_page')
        .order('last_seen', { ascending: false })

      if (error) throw error

      const activities: UserActivity[] = data?.map(item => ({
        user_id: item.user_id,
        last_seen: item.last_seen,
        current_page: item.current_page,
        is_online: new Date(item.last_seen) > new Date(Date.now() - 5 * 60 * 1000) // Online if active within 5 minutes
      })) || []

      onActivityUpdate(activities)
    } catch (error) {
      console.error('Error fetching user activities:', error)
    }
  }

  useEffect(() => {
    fetchUserActivities()
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchUserActivities, 30000)
    
    return () => clearInterval(interval)
  }, [])

  return null // This component only fetches data, renders nothing
}
