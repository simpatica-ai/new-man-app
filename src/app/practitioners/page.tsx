'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Users, 
  Activity, 
  Eye,
  MessageSquare,
  Settings,
  Building2,
  UserCheck,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Calendar,
  Clock,
  Target,
  Award,
  Filter,
  Search,
  Plus,
  MoreVertical
} from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import SimpleRoleSwitcher from '@/components/SimpleRoleSwitcher';
import DevRoleTester from '@/components/DevRoleTester';
import { supabase } from '@/lib/supabaseClient';
import { getUserSafely } from '@/lib/authUtils';

interface PractitionerData {
  id: string;
  full_name?: string | null;
  roles: string[] | null;
  is_active: boolean | null;
  last_activity?: string | null;
  current_virtue_id?: number | null;
  current_stage?: number | null;
  organization_id: string | null;
  created_at?: string | null;
  progress_score?: number;
  total_sessions?: number;
  completed_virtues?: number;
}

interface UserProfile {
  id: string;
  roles: string[] | null;
  organization_id: string | null;
  full_name?: string | null;
  organizations?: {
    slug: string;
  } | null;
}

export default function PractitionersPage() {
  const router = useRouter();
  const [practitioners, setPractitioners] = useState<PractitionerData[]>([]);
  const [filteredPractitioners, setFilteredPractitioners] = useState<PractitionerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userRole, setUserRole] = useState<'org-coach' | 'org-therapist' | 'org-admin' | 'none'>('none');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    loadUserAndPractitioners();
  }, []);

  const loadUserAndPractitioners = async () => {
    try {
      // Get current user
      const { user, error: userError } = await getUserSafely();
      if (userError || !user) {
        router.push('/');
        return;
      }

      // Get user profile and check permissions
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          id, 
          roles, 
          organization_id, 
          full_name,
          organizations(slug)
        `)
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        console.error('Profile error:', profileError);
        router.push('/');
        return;
      }

      setUserProfile(profile);

      // Determine user role and permissions
      const userRoles = profile.roles || [];
      const isOrgAdmin = userRoles.includes('org-admin');
      const isOrgTherapist = userRoles.includes('org-therapist');
      const isOrgCoach = userRoles.includes('org-coach');

      if (!isOrgAdmin && !isOrgTherapist && !isOrgCoach) {
        // User doesn't have permission to access this page
        router.push('/');
        return;
      }

      // Set primary role (highest permission level)
      if (isOrgAdmin) {
        setUserRole('org-admin');
      } else if (isOrgTherapist) {
        setUserRole('org-therapist');
      } else {
        setUserRole('org-coach');
      }

      // Load practitioners based on role
      await loadPractitioners(profile, isOrgAdmin || isOrgTherapist);

    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const loadPractitioners = async (profile: UserProfile, canSeeAllPractitioners: boolean) => {
    try {
      if (!profile.organization_id) {
        console.error('No organization ID found');
        return;
      }
      
      const query = supabase
        .from('profiles')
        .select('id, full_name, roles, is_active, last_activity, current_virtue_id, current_stage, organization_id, created_at')
        .eq('organization_id', profile.organization_id)
        .contains('roles', ['org-practitioner'])
        .order('created_at', { ascending: false });

      // If user is org-coach (not therapist/admin), only show assigned practitioners
      if (!canSeeAllPractitioners) {
        // TODO: Add coach-practitioner assignment logic here
        // For now, show all practitioners in the organization
      }

      const { data: practitionersData, error } = await query;

      if (error) {
        console.error('Error loading practitioners:', error);
        return;
      }

      setPractitioners(practitionersData || []);
      setFilteredPractitioners(practitionersData || []);
    } catch (error) {
      console.error('Error in loadPractitioners:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatLastActivity = (lastActivity?: string | null) => {
    if (!lastActivity) return 'Never';
    const date = new Date(lastActivity);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  // Filter practitioners based on search and status
  useEffect(() => {
    let filtered = practitioners;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(p => 
        (p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(p => 
        filterStatus === 'active' ? p.is_active : !p.is_active
      );
    }

    setFilteredPractitioners(filtered);
  }, [practitioners, searchTerm, filterStatus]);

  const getProgressPercentage = (practitioner: PractitionerData) => {
    // Calculate progress based on current virtue and stage
    if (!practitioner.current_virtue_id || !practitioner.current_stage) return 0;
    
    // Assuming 13 virtues total, each with 4 stages
    const totalStages = 13 * 4;
    const completedStages = ((practitioner.current_virtue_id - 1) * 4) + (practitioner.current_stage - 1);
    return Math.round((completedStages / totalStages) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-amber-100">
        <AppHeader />
        <main className="container mx-auto p-8">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-amber-600" />
            <p className="text-stone-600">Loading practitioners...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-amber-100">
      <AppHeader />
      
      <main className="container mx-auto p-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center space-x-4 mb-2">
                <h1 className="text-3xl font-light text-stone-800">
                  {userRole === 'org-coach' && 'My Practitioners'}
                  {userRole === 'org-therapist' && 'Organization Overview'}
                  {userRole === 'org-admin' && 'Practitioner Management'}
                </h1>
                {userProfile && userProfile.roles && (
                  <SimpleRoleSwitcher 
                    userRoles={userProfile.roles} 
                    currentRole={userRole}
                    organizationSlug={userProfile.organizations?.slug || userProfile.organization_id || 'unknown'}
                  />
                )}
              </div>
              <p className="text-stone-600">
                {userRole === 'org-admin' && 'Manage all practitioners in your organization'}
                {userRole === 'org-therapist' && 'Monitor practitioner progress and wellbeing in your organization'}
                {userRole === 'org-coach' && 'Support and guide your assigned practitioners on their virtue journey'}
              </p>
            </div>
            
            <div className="flex space-x-3">
              {userRole === 'org-admin' && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => router.push('/organization/invite')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Invite Practitioner
                  </Button>
                  <Button
                    onClick={() => router.push(`/organization/manage/${userProfile?.organizations?.slug || 'unknown'}`)}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Organization Settings
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-stone-600">Total Practitioners</p>
                    <p className="text-2xl font-bold text-stone-800">{practitioners.length}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-stone-600">Active This Week</p>
                    <p className="text-2xl font-bold text-green-600">
                      {practitioners.filter(p => {
                        if (!p.last_activity) return false;
                        const lastActivity = new Date(p.last_activity);
                        const weekAgo = new Date();
                        weekAgo.setDate(weekAgo.getDate() - 7);
                        return lastActivity > weekAgo;
                      }).length}
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-stone-600">Engagement Rate</p>
                    <p className="text-2xl font-bold text-amber-600">
                      {practitioners.length > 0 
                        ? Math.round((practitioners.filter(p => p.is_active).length / practitioners.length) * 100)
                        : 0
                      }%
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-amber-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-stone-600">Avg Progress</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {practitioners.length > 0 
                        ? Math.round(practitioners.reduce((acc, p) => acc + getProgressPercentage(p), 0) / practitioners.length)
                        : 0
                      }%
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter Bar */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-stone-400" />
              <Input
                placeholder="Search practitioners..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  {filterStatus === 'all' ? 'All Status' : filterStatus === 'active' ? 'Active Only' : 'Inactive Only'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setFilterStatus('all')}>
                  All Status
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus('active')}>
                  Active Only
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus('inactive')}>
                  Inactive Only
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Practitioners List */}
        <div className="space-y-4">
          {filteredPractitioners.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-stone-400" />
                <h3 className="text-lg font-medium text-stone-800 mb-2">
                  {searchTerm || filterStatus !== 'all' ? 'No Matching Practitioners' : 'No Practitioners Found'}
                </h3>
                <p className="text-stone-600">
                  {searchTerm || filterStatus !== 'all' 
                    ? 'Try adjusting your search or filter criteria.'
                    : userRole === 'org-coach' 
                      ? 'You have no assigned practitioners yet.'
                      : 'No practitioners have been added to your organization yet.'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredPractitioners.map((practitioner) => (
              <Card key={practitioner.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-amber-400">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-stone-100 rounded-full flex items-center justify-center">
                        <UserCheck className="h-6 w-6 text-amber-600" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-stone-800 text-lg">
                            {practitioner.full_name || `User ${practitioner.id.slice(0, 8)}`}
                          </h3>
                          <div className="flex items-center space-x-2">
                            <Badge 
                              variant={practitioner.is_active ? "default" : "secondary"}
                              className={practitioner.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                            >
                              {practitioner.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                            {practitioner.current_virtue_id && (
                              <Badge variant="outline" className="text-xs">
                                Virtue {practitioner.current_virtue_id}
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-stone-600">Journey Progress</span>
                            <span className="text-sm font-medium text-stone-800">
                              {getProgressPercentage(practitioner)}%
                            </span>
                          </div>
                          <div className="w-full bg-stone-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-amber-400 to-amber-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${getProgressPercentage(practitioner)}%` }}
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-stone-600 flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              Last Active
                            </p>
                            <p className="font-medium">{formatLastActivity(practitioner.last_activity)}</p>
                          </div>
                          <div>
                            <p className="text-stone-600 flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              Member Since
                            </p>
                            <p className="font-medium">
                              {practitioner.created_at 
                                ? new Date(practitioner.created_at).toLocaleDateString()
                                : 'Unknown'
                              }
                            </p>
                          </div>
                          <div>
                            <p className="text-stone-600 flex items-center">
                              <Target className="h-3 w-3 mr-1" />
                              Current Stage
                            </p>
                            <p className="font-medium">
                              {practitioner.current_stage ? `Stage ${practitioner.current_stage}` : 'Not Started'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2 ml-4">
                      {userRole === 'org-coach' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Store selected practitioner in localStorage
                            try {
                              if (typeof window !== 'undefined') {
                                localStorage.setItem('selectedPractitionerId', practitioner.id);
                                localStorage.setItem('selectedPractitionerName', practitioner.full_name || 'Practitioner');
                              }
                            } catch (error) {
                              console.error('Error saving to localStorage:', error);
                            }
                            router.push(`/coach-desktop/${userProfile?.organizations?.slug || 'unknown'}`);
                          }}
                          className="w-full"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Coach Desktop
                        </Button>
                      )}
                      
                      {(userRole === 'org-therapist' || userRole === 'org-admin') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/reports/practitioner/${practitioner.id}`)}
                          className="w-full text-stone-600"
                        >
                          <Activity className="h-4 w-4 mr-1" />
                          Monitor
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
      
      {/* Development Role Tester */}
      <DevRoleTester onRoleChange={() => window.location.reload()} />
    </div>
  );
}