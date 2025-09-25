'use client'

import { useUserActivity } from '@/hooks/useUserActivity'

export default function ActivityTracker() {
  useUserActivity()
  return null // This component only tracks activity, renders nothing
}
