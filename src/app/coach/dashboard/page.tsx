'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, CheckCircle, Building2, Activity, Calendar } from 'lucide-react'
import AppHeader from '@/components/AppHeader'
import { useOrganizationContext, usePermission } from '@/hooks/usePermissions'
import { getOrganizationSettings } from '@/lib/organizationService'
import { getOrganizationActivity } from '@/lib/userArchivalService'
import RoleSwitcher from '@/components/RoleSwitcher'
import type { OrganizationSettings } from '@/lib/organizationService'
import type { UserActivity } from '@/lib/userArchivalService'

export default function CoachDashboard() {
  const [relationships, setRelationships] = useState<{
    id: string;
    status: string | null;
    created_at: string | null;
    profiles: {
      full_name: string | null;
    } | null;
  }[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [organizationSettings, setOrganizationSettings] = useState<OrganizationSettings | null>(null)
  const [practitionerActivities, setPractitionerActivities] = useState<UserActivity[]>([])

  // Organization context and permissions
  const { context, loading: contextLoading } = useOrganizationContext(currentUserId)
  const { hasAccess: canViewPractitioners } = usePermission(
    currentUserId, 
    'practitioner_data', 
    'read'
  )

  useEffect(() => {
    initializeUser()
  }, [])

  useEffect(() => {
    if (currentUserId && context) {
      fetchRelationships()
      loadOrganizationData()
    }
  }, [currentUserId, context])

  const initializeUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
      }
    } catch (error) {
      console.error('Error getting user:', error)
    }
  }

  const loadOrganizationData = async () => {
    if (!context?.organizationId) return

    try {
      // Load organization settings for branding
      const settings = await getOrganizationSettings(context.organizationId)
      setOrganizationSettings(settings)

      // Load practitioner activities if user has permission
      if (canViewPractitioners) {
        const activities = await getOrganizationActivity(context.organizationId)
        setPractitionerActivities(activities)
      }
    } catch (error) {
      console.error('Error loading organization data:', error)
    }
  }

  const fetchRelationships = async () => {
    try {
      if (!currentUserId) return

      // TODO: Update to use practitioner_assignments table after migration
      // For now, use existing sponsor_relationships table
      const { data, error } = await supabase
        .from('sponsor_relationships')
        .select(`
          id,
          status,
          created_at,
          profiles!sponsor_relationships_practitioner_id_fkey(full_name)
        `)
        .eq('sponsor_id', currentUserId)

      if (error) throw error
      
      // Filter by organization context if available
      let filteredData = data || []
      if (context?.organizationId) {
        // TODO: Add organization filtering once practitioner_assignments table exists
        // For now, show all relationships
      }
      
      setRelationships(filteredData)
    } catch (err) {
      console.error('Error fetching relationships:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatLastActivity = (date: Date) => {
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    
    return date.toLocaleDateString()
  }

  // Apply organization branding if available
  const primaryColor = organizationSettings?.branding.primaryColor || '#5F4339'
  const secondaryColor = organizationSettings?.branding.secondaryColor || '#A8A29E'

  if (contextLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-amber-100">
        <AppHeader />
        <div className="container mx-auto p-4 md:p-8 max-w-6xl">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-stone-300/60 rounded-lg w-64"></div>
            <div className="h-4 bg-amber-200/60 rounded-lg w-48"></div>
          </div>
          <p className="text-stone-600 font-light mt-4">Loading coach dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-amber-100">
      <AppHeader />
      <main className="container mx-auto p-4 md:p-8 max-w-6xl">
        {/* Header with Organization Context */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-4 mb-2">
                {organizationSettings?.branding.logoUrl && (
                  <img 
                    src={organizationSettings.branding.logoUrl} 
                    alt="Organization Logo" 
                    className="h-12 w-12 object-contain"
                  />
                )}
                <div>
                  <h1 className="text-3xl font-light text-stone-800">
                    Coach Dashboard
                    <span className="block text-xl font-medium text-amber-900 mt-1">
                      {context?.organizationId ? 'Your Coaching Connections' : 'Individual Coaching'}
                    </span>
                  </h1>
                </div>
              </div>
              <div 
                className="w-24 h-0.5 bg-gradient-to-r mt-3"
                style={{ 
                  backgroundImage: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})` 
                }}
              ></div>
            </div>
            
            {/* Role Switcher for multi-role users */}
            {currentUserId && (
              <RoleSwitcher userId={currentUserId} />
            )}
          </div>

          {/* Organization Info */}
          {context?.organizationId && (
            <Card className="bg-white/80 backdrop-blur-sm border-stone-200/60 shadow-gentle mt-4">
              <CardHeader className="flex flex-row items-center gap-4 pb-3">
                <Building2 className="h-5 w-5 text-amber-700" />
                <div>
                  <CardTitle className="text-base text-stone-800">Organization Context</CardTitle>
                  <CardDescription className="text-stone-600">
                    Coaching within organizational framework
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Practitioner Connections */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-stone-200/60 shadow-gentle">
              <CardHeader className="flex flex-row items-center gap-4">
                <Users className="h-6 w-6 text-amber-700" />
                <div>
                  <CardTitle className="text-stone-800 font-medium">Your Practitioners</CardTitle>
                  <CardDescription className="text-stone-600">
                    {context?.organizationId 
                      ? 'Assigned practitioners in your organization' 
                      : 'Your individual coaching connections'
                    }
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {relationships.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-stone-400 mx-auto mb-4" />
                    <p className="text-stone-600 font-medium">No Practitioners Yet</p>
                    <p className="text-stone-500 text-sm mt-1">
                      {context?.organizationId 
                        ? 'Wait for an admin to assign practitioners to you'
                        : 'You haven\'t been connected with any practitioners yet'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {relationships.map((relationship) => (
                      <div
                        key={relationship.id}
                        className="flex items-center justify-between p-4 bg-stone-50/60 rounded-lg border border-stone-200/60 hover:bg-stone-100/60 transition-colors"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium text-stone-800">
                            {relationship.profiles?.full_name || 'Practitioner'}
                          </h4>
                          <p className="text-sm text-stone-600">
                            Connected since {relationship.created_at ? new Date(relationship.created_at).toLocaleDateString() : 'Unknown'}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={
                            relationship.status === 'active' 
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : 'bg-amber-100 text-amber-800 border-amber-200'
                          }>
                            {relationship.status === 'active' && <CheckCircle className="h-3 w-3 mr-1" />}
                            {relationship.status || 'pending'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Activity Overview */}
          <div className="space-y-6">
            {/* Activity Overview */}
            {canViewPractitioners && practitionerActivities.length > 0 && (
              <Card className="bg-white/80 backdrop-blur-sm border-stone-200/60 shadow-gentle">
                <CardHeader className="flex flex-row items-center gap-4">
                  <Activity className="h-5 w-5 text-amber-700" />
                  <div>
                    <CardTitle className="text-base text-stone-800">Recent Activity</CardTitle>
                    <CardDescription className="text-stone-600">
                      Practitioner engagement overview
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {practitionerActivities.slice(0, 5).map((activity) => (
                      <div key={activity.userId} className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-stone-800">
                            User {activity.userId.slice(0, 8)}...
                          </p>
                          <p className="text-xs text-stone-600">
                            {formatLastActivity(activity.lastLogin)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            activity.engagementScore >= 80 ? 'bg-green-500' :
                            activity.engagementScore >= 60 ? 'bg-yellow-500' :
                            activity.engagementScore >= 40 ? 'bg-orange-500' : 'bg-red-500'
                          }`}></div>
                          <span className="text-xs text-stone-600">
                            {activity.engagementScore}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <Card className="bg-white/80 backdrop-blur-sm border-stone-200/60 shadow-gentle">
              <CardHeader className="flex flex-row items-center gap-4">
                <Calendar className="h-5 w-5 text-amber-700" />
                <div>
                  <CardTitle className="text-base text-stone-800">Quick Stats</CardTitle>
                  <CardDescription className="text-stone-600">
                    Your coaching overview
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-stone-600">Active Practitioners</span>
                    <span className="text-sm font-medium text-stone-800">
                      {relationships.filter(r => r.status === 'active').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-stone-600">Total Connections</span>
                    <span className="text-sm font-medium text-stone-800">
                      {relationships.length}
                    </span>
                  </div>
                  {context?.organizationId && (
                    <div className="flex justify-between">
                      <span className="text-sm text-stone-600">Organization Role</span>
                      <span className="text-sm font-medium text-stone-800">
                        {context.roles.includes('admin') ? 'Admin + Coach' : 'Coach'}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
