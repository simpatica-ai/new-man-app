'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import AppHeader from '@/components/AppHeader';
import Footer from '@/components/Footer';
import WorkProductReportGenerator from '@/components/WorkProductReportGenerator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, AlertCircle, Users } from 'lucide-react';

interface Practitioner {
  id: string;
  full_name: string;
}

function WorkProductReportContent() {
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [organizationName, setOrganizationName] = useState<string>('');

  const searchParams = useSearchParams();
  const preselectedPractitionerId = searchParams.get('practitioner_id');
  const preselectedVirtueIds = searchParams.get('virtue_ids');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        setError('Authentication required');
        return;
      }
      setCurrentUser(user);

      // Get user's profile - try basic profile first to avoid column errors
      let profile = null;
      try {
        // First try with just full_name (always exists)
        const { data: basicProfile, error: basicError } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
        
        if (basicError) {
          console.error('Basic profile error:', basicError);
        } else {
          profile = { ...basicProfile, role: null, organization_id: null };
          
          // Try to get organizational columns if they exist (one at a time to avoid column errors)
          try {
            // Try role column
            const { data: roleData } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', user.id)
              .single();
            
            if (roleData) {
              profile.role = roleData.role;
            }
          } catch (error) {
            // role column doesn't exist, try roles array
            try {
              const { data: rolesData } = await supabase
                .from('profiles')
                .select('roles')
                .eq('id', user.id)
                .single();
              
              if (rolesData?.roles && rolesData.roles.length > 0) {
                profile.role = rolesData.roles[0]; // Use first role
              }
            } catch (rolesError) {
              // Neither role nor roles exist, that's fine
            }
          }
          
          try {
            // Try organization_id column
            const { data: orgData } = await supabase
              .from('profiles')
              .select('organization_id')
              .eq('id', user.id)
              .single();
            
            if (orgData) {
              profile.organization_id = orgData.organization_id;
            }
          } catch (error) {
            // organization_id column doesn't exist yet, that's fine
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        // Continue without profile data
      }

      // For now, we'll get practitioners from sponsor relationships
      // TODO: Update this to use organizational model when implemented
      let practitionersData: Practitioner[] = [];

      if (preselectedPractitionerId) {
        // If a specific practitioner is preselected, just get that one
        const { data: practitioner, error: practitionerError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('id', preselectedPractitionerId)
          .single();

        if (practitionerError) {
          setError('Practitioner not found');
          return;
        }

        practitionersData = [practitioner];
      } else {
        // Get practitioners from sponsor relationships (current system)
        try {
          const { data: relationships, error: relationError } = await supabase
            .from('sponsor_relationships')
            .select(`
              practitioner_id,
              profiles!sponsor_relationships_practitioner_id_fkey (
                id,
                full_name
              )
            `)
            .eq('sponsor_id', user.id)
            .eq('status', 'active');

          if (relationError) {
            console.error('Relationship error:', relationError);
            // If sponsor relationships don't work, try practitioner assignments (organizational model)
            const { data: assignments, error: assignmentError } = await supabase
              .from('practitioner_assignments')
              .select(`
                practitioner_id,
                profiles!practitioner_assignments_practitioner_id_fkey (
                  id,
                  full_name
                )
              `)
              .eq('supervisor_id', user.id)
              .eq('active', true);

            if (assignmentError) {
              console.error('Assignment error:', assignmentError);
              // If both fail, just allow the user to see their own data
              practitionersData = [{
                id: user.id,
                full_name: profile?.full_name || 'You'
              }];
            } else {
              practitionersData = assignments?.map(rel => ({
                id: rel.profiles?.id || '',
                full_name: rel.profiles?.full_name || 'Unknown'
              })).filter(p => p.id) || [];
            }
          } else {
            practitionersData = relationships?.map(rel => ({
              id: rel.profiles?.id || '',
              full_name: rel.profiles?.full_name || 'Unknown'
            })).filter(p => p.id) || [];
          }
        } catch (error) {
          console.error('Error loading practitioners:', error);
          // Fallback: allow user to see their own data
          practitionersData = [{
            id: user.id,
            full_name: profile?.full_name || 'You'
          }];
        }
      }

      setPractitioners(practitionersData);

      // TODO: Get organization name when organizational model is implemented
      setOrganizationName(''); // Will be populated from organization data

    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-amber-100">
        <AppHeader />
        <main className="container mx-auto p-8">
          <div className="text-center">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-stone-300/60 rounded-lg w-64 mx-auto"></div>
              <div className="h-4 bg-amber-200/60 rounded-lg w-48 mx-auto"></div>
            </div>
            <p className="text-stone-600 font-light mt-4">Loading report interface...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-amber-100">
        <AppHeader />
        <main className="container mx-auto p-8">
          <Alert className="border-red-200 bg-red-50 max-w-2xl mx-auto">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-amber-100 relative">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgb(120,113,108)_1px,_transparent_0)] bg-[length:32px_32px]"></div>
      </div>
      
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-50/60 to-stone-100/80"></div>
      
      <div className="relative z-10">
        <AppHeader />
        
        <main className="container mx-auto p-4 md:p-8 max-w-6xl">
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <FileText className="h-8 w-8 text-amber-700" />
              <div>
                <h1 className="text-3xl font-light text-stone-800">
                  Work Product Reports
                </h1>
                <p className="text-stone-600 mt-1">
                  Generate detailed progress reports showing virtue development work and milestones
                </p>
              </div>
            </div>
            <div className="w-24 h-0.5 bg-gradient-to-r from-amber-600 to-stone-600"></div>
          </div>

          {practitioners.length === 0 ? (
            <Card className="bg-white/80 backdrop-blur-sm border-stone-200/60 shadow-gentle max-w-2xl mx-auto">
              <CardHeader className="text-center">
                <Users className="h-12 w-12 text-stone-400 mx-auto mb-4" />
                <CardTitle className="text-stone-600">No Practitioners Available</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-stone-600 mb-4">
                  You don't have any practitioners assigned to generate reports for.
                </p>
                <p className="text-sm text-stone-500">
                  Contact your organization administrator to get practitioners assigned to your supervision.
                </p>
              </CardContent>
            </Card>
          ) : (
            <WorkProductReportGenerator
              practitioners={practitioners}
              current_user_name={currentUser?.user_metadata?.full_name || currentUser?.email}
              organization_name={organizationName}
              current_user_id={currentUser?.id}
              is_supervisor={practitioners.length > 1} // If more than one practitioner, user is likely a supervisor
            />
          )}
        </main>
        
        <Footer />
      </div>
    </div>
  );
}

export default function WorkProductReportPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-amber-100">
        <AppHeader />
        <main className="container mx-auto p-8">
          <div className="text-center">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-stone-300/60 rounded-lg w-64 mx-auto"></div>
              <div className="h-4 bg-amber-200/60 rounded-lg w-48 mx-auto"></div>
            </div>
            <p className="text-stone-600 font-light mt-4">Loading report interface...</p>
          </div>
        </main>
      </div>
    }>
      <WorkProductReportContent />
    </Suspense>
  );
}