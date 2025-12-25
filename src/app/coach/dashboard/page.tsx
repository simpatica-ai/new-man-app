'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users, 
  Activity, 
  Calendar,
  RefreshCw,
  AlertCircle,
  UserCheck,
  TrendingUp,
  MessageSquare
} from 'lucide-react'
import AppHeader from '@/components/AppHeader'
import Footer from '@/components/Footer'
import {
  getCurrentUserOrganization,
  getOrganizationMembers,
  getOrganizationActivityOverview,
  formatLastActivity,
  getRoleBadgeColor,
  isCurrentUserCoach,
  type Organization,
  type OrganizationMember,
  type ActivityOverview
} from '@/lib/organizationService'

export default function CoachDashboard() {
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [members, setMembers] = useState<OrganizationMember[]>([])
  const [activityOverview, setActivityOverview] = useState<ActivityOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [isCoach, setIsCoach] = useState(false)

  useEffect(() => {
    loadOrganizationData()
  }, [])

  const loadOrganizationData = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()

      // Check if user is coach first
      const coachStatus = await isCurrentUserCoach()
      setIsCoach(coachStatus)

      if (!coachStatus) {
        setLoading(false)
        return
      }

      // Load organization details
      const orgData = await getCurrentUserOrganization()
      if (!orgData) {
        setLoading(false)
        return
      }
      setOrganization(orgData)

      // Load organization members
      const membersData = await getOrganizationMembers(orgData.id)
      setMembers(membersData)

      // Load activity overview
      const overview = await getOrganizationActivityOverview(orgData.id)
      setActivityOverview(overview)
    } catch (error) {
      console.error('Error loading organization data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Apply organization branding if available
  const primaryColor = '#5F4339'
  const secondaryColor = '#A8A29E'

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-amber-100">
        <AppHeader />
        <div className="container mx-auto p-4 md:p-8 max-w-6xl">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-stone-600" />
          </div>
        </div>
      </div>
    )
  }

  if (!isCoach) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-amber-100">
        <AppHeader />
        <div className="container mx-auto p-4 md:p-8 max-w-6xl">
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-amber-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-stone-800 mb-2">Access Denied</h2>
              <p className="text-stone-600">You need coach privileges to access this dashboard.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-amber-100">
        <AppHeader />
        <div className="container mx-auto p-4 md:p-8 max-w-6xl">
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-amber-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-stone-800 mb-2">No Organization Found</h2>
              <p className="text-stone-600">You don't appear to be part of an organization yet.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const practitioners = members.filter(m => m.roles?.includes('practitioner') && m.is_active)
  const therapists = members.filter(m => m.roles?.includes('therapist') && m.is_active)
  const assignedPractitioners = practitioners.filter(p => 
    // TODO: Filter by actual assignments when practitioner_assignments table is properly set up
    // For now, show all practitioners in the organization
    true
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-amber-100">
      <AppHeader />
      <main className="container mx-auto p-4 md:p-8 max-w-6xl">
        {/* Header with Organization Context */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <div>
                  <h1 className="text-3xl font-light text-stone-800">
                    {organization.name}
                    <span className="block text-xl font-medium text-amber-900 mt-1">
                      Coach Dashboard
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
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assigned Practitioners</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{assignedPractitioners.length}</div>
              <p className="text-xs text-muted-foreground">
                practitioners under your coaching
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Therapists</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{therapists.length}</div>
              <p className="text-xs text-muted-foreground">
                therapists in organization
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recently Active</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activityOverview?.recentlyActive || 0}</div>
              <p className="text-xs text-muted-foreground">
                active in last 7 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Engagement</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {activityOverview?.engagementRate || 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                weekly engagement
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="practitioners" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="practitioners">My Practitioners</TabsTrigger>
            <TabsTrigger value="overview">Organization Overview</TabsTrigger>
          </TabsList>

          <TabsContent value="practitioners" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5" />
                  <span>Assigned Practitioners</span>
                </CardTitle>
                <CardDescription>
                  Practitioners assigned to your coaching
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {assignedPractitioners.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No practitioners assigned to you yet.
                    </div>
                  ) : (
                    assignedPractitioners.map((practitioner, index) => (
                      <div key={`practitioner-${practitioner.id || index}`} className="flex items-center justify-between p-4 border rounded-lg bg-amber-50/30">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div>
                              <h4 className="font-medium">{practitioner.full_name || practitioner.email}</h4>
                              <p className="text-sm text-muted-foreground">{practitioner.email}</p>
                            </div>
                            <div className="flex space-x-1">
                              {practitioner.roles?.map((role, roleIndex) => (
                                <Badge key={`${practitioner.id || index}-role-${roleIndex}`} className={getRoleBadgeColor(practitioner.roles)}>
                                  {role}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            Last active: {formatLastActivity(practitioner.last_activity)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Virtue {practitioner.current_virtue_id || 1}, Stage {practitioner.current_stage || 1}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-start space-x-3">
                    <MessageSquare className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-amber-800 mb-1">Coach Role Information</h4>
                      <p className="text-sm text-amber-700">
                        As a coach, you have direct interaction with your assigned practitioners. 
                        You can communicate with them, provide guidance, and track their progress through the virtue development program. 
                        Therapists in your organization have oversight access to all practitioner data for therapeutic purposes.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Organization Overview</CardTitle>
                <CardDescription>
                  Summary of organization structure and activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-stone-800 mb-3">Team Structure</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Practitioners:</span>
                        <span className="text-sm font-medium">{practitioners.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Coaches:</span>
                        <span className="text-sm font-medium">
                          {members.filter(m => m.roles?.includes('coach') && m.is_active).length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Therapists:</span>
                        <span className="text-sm font-medium">{therapists.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Admins:</span>
                        <span className="text-sm font-medium">
                          {members.filter(m => m.roles?.includes('admin') && m.is_active).length}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-stone-800 mb-3">Activity Summary</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Recently Active:</span>
                        <span className="text-sm font-medium">{activityOverview?.recentlyActive || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Engagement Rate:</span>
                        <span className="text-sm font-medium">{activityOverview?.engagementRate || 0}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Members:</span>
                        <span className="text-sm font-medium">{activityOverview?.activeMembers || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-stone-50 rounded-lg border border-stone-200">
                  <h4 className="font-medium text-stone-800 mb-2">Organization Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Organization:</span>
                      <span className="ml-2 font-medium">{organization.name}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Created:</span>
                      <span className="ml-2 font-medium">{new Date(organization.created_at).toLocaleDateString()}</span>
                    </div>
                    {organization.website_url && (
                      <div>
                        <span className="text-muted-foreground">Website:</span>
                        <span className="ml-2 font-medium">{organization.website_url}</span>
                      </div>
                    )}
                    {organization.phone_number && (
                      <div>
                        <span className="text-muted-foreground">Phone:</span>
                        <span className="ml-2 font-medium">{organization.phone_number}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  )
}
