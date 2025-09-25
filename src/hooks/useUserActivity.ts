'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export function useUserActivity() {
  const pathname = usePathname()

  const updateActivity = async (currentPage: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase
        .from('user_activity_sessions')
        .upsert({
          user_id: user.id,
          last_seen: new Date().toISOString(),
          current_page: currentPage
        }, { 
          onConflict: 'user_id' 
        })
    } catch (error) {
      console.error('Error updating user activity:', error)
    }
  }

  useEffect(() => {
    // Update activity when page changes
    updateActivity(pathname)

    // Update activity every 2 minutes while user is active
    const interval = setInterval(() => {
      updateActivity(pathname)
    }, 120000) // 2 minutes

    // Update activity on page visibility change
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        updateActivity(pathname)
      }
    }

    // Update activity on user interaction
    const handleUserInteraction = () => {
      updateActivity(pathname)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    document.addEventListener('click', handleUserInteraction)
    document.addEventListener('keydown', handleUserInteraction)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      document.removeEventListener('click', handleUserInteraction)
      document.removeEventListener('keydown', handleUserInteraction)
    }
  }, [pathname])
}
