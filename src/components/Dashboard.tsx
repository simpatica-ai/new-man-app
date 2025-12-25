'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { HelpCircle, ChevronDown, ChevronUp, BookOpen, Target, Users, MessageCircle, Sparkles } from 'lucide-react'
import AppHeader from './AppHeader'
import Footer from './Footer'
import WelcomeModal from './WelcomeModal'
import VirtueRow from './dashboard/VirtueRow'
import ActionCards from './dashboard/ActionCards'
import ProgressLegend from './dashboard/ProgressLegend'
import VirtueRoseChart from './VirtueRoseChart'
import VirtueProgressBar from './VirtueProgressBar'
import { useDashboardData } from '@/hooks/useDashboardData'

export default function Dashboard() {
  const [showOverview, setShowOverview] = useState(false)
  const [isCheckingRouting, setIsCheckingRouting] = useState(true)
  
  // Add routing check for coaches/therapists
  useEffect(() => {
    const checkUserRouting = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('has_completed_first_assessment, roles, organization_id')
          .eq('id', user.id)
          .single()
        
        if (!profile) {
          setIsCheckingRouting(false)
          return
        }
        
        console.log('🔍 DASHBOARD ROUTING - Profile:', profile)
        
        // Check if user is an organization admin
        const isOrgAdmin = profile?.roles?.includes('admin') && profile?.organization_id
        if (isOrgAdmin) {
          console.log('🔍 DASHBOARD ROUTING - Redirecting to /orgadmin')
          window.location.href = '/orgadmin'
          return
        }
        
        // Check if user is a coach
        const isCoach = profile?.roles?.includes('coach')
        if (isCoach) {
          console.log('🔍 DASHBOARD ROUTING - Redirecting to /coach/dashboard')
          window.location.href = '/coach/dashboard'
          return
        }
        
        // Check if user is a therapist
        const isTherapist = profile?.roles?.includes('therapist')
        if (isTherapist) {
          console.log('🔍 DASHBOARD ROUTING - Redirecting to /therapist')
          window.location.href = '/therapist'
          return
        }
        
        // Check if user is a sponsor (has active sponsor relationships)
        const { data: sponsorData } = await supabase
          .from('sponsor_relationships')
          .select('id')
          .eq('sponsor_id', user.id)
          .eq('status', 'active')
          .limit(1)
        
        const isSponsor = sponsorData && sponsorData.length > 0
        const isPractitioner = profile?.has_completed_first_assessment
        
        // If user is ONLY a sponsor (not a practitioner), redirect to sponsor dashboard
        if (isSponsor && !isPractitioner) {
          console.log('🔍 DASHBOARD ROUTING - Redirecting to /sponsor/dashboard')
          window.location.href = '/sponsor/dashboard'
          return
        }
        
        // Redirect practitioners who haven't completed assessment to welcome
        if (!isPractitioner) {
          console.log('🔍 DASHBOARD ROUTING - Redirecting to /welcome')
          window.location.href = '/welcome'
          return
        }
        
        // User is a practitioner - show practitioner dashboard
        console.log('🔍 DASHBOARD ROUTING - Showing practitioner dashboard')
        setIsCheckingRouting(false)
        
      } catch (error) {
        console.error('Error checking user routing:', error)
        setIsCheckingRouting(false)
      }
    }
    
    checkUserRouting()
  }, [])
  
  const {
    loading,
    connection,
    virtues,
    assessmentTaken,
    assessmentResults,
    progress,
    lastJournalEntry,
    showWelcomeModal,
    buttonStates,
    handleCloseModal,
    handleOpenModal,
    getStatusClasses,
    debouncedRefresh,
    setButtonStates
  } = useDashboardData();

  console.log('Dashboard render - assessmentTaken:', assessmentTaken);
  console.log('Dashboard render - virtues length:', virtues.length);
  console.log('Dashboard render - loading:', loading);

  useEffect(() => { 
    document.title = "New Man: Dashboard"; 
  }, []);

  // Show loading while checking routing or loading data
  if (loading || isCheckingRouting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-amber-100">
        <AppHeader />
        <main className="container mx-auto p-8">
          <div className="text-center">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-stone-300/60 rounded-lg w-64 mx-auto"></div>
              <div className="h-4 bg-amber-200/60 rounded-lg w-48 mx-auto"></div>
            </div>
            <p className="text-stone-600 font-light mt-4">
              {isCheckingRouting ? 'Checking user permissions...' : 'Loading dashboard...'}
            </p>
          </div>
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
        <WelcomeModal isOpen={showWelcomeModal} onClose={handleCloseModal} />

        <main className="container mx-auto p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {!assessmentTaken ? (
                // New users - just virtues list
                <div className="space-y-4">
                  {console.log('About to render virtues:', virtues.length)}
                  {virtues.map((virtue) => (
                    <VirtueRow 
                      key={virtue.id} 
                      virtue={virtue} 
                      assessmentTaken={assessmentTaken}
                      getStatusClasses={getStatusClasses}
                      buttonStates={buttonStates}
                      setButtonStates={setButtonStates}
                    />
                  ))}
                </div>
              ) : (
                // Existing users - complex layout with progress legend
                <>
                  <div className="space-y-3 p-4 bg-white/80 backdrop-blur-sm rounded-lg border border-stone-200/60 shadow-gentle">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <h2 className="text-xl font-light text-stone-800">Your Prioritized Virtues</h2>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenModal()}
                        className="border-amber-200 text-amber-700 hover:bg-amber-50"
                      >
                        <HelpCircle className="h-4 w-4 mr-2" />
                        Guide
                      </Button>
                    </div>
                    <ProgressLegend />
                  </div>

                  <ul className="space-y-4">
                    {virtues.map((virtue) => (
                      <VirtueRow 
                        key={virtue.id} 
                        virtue={virtue} 
                        assessmentTaken={assessmentTaken}
                        getStatusClasses={getStatusClasses}
                        buttonStates={buttonStates}
                        setButtonStates={setButtonStates}
                      />
                    ))}
                  </ul>
                </>
              )}
            </div>
            
            {/* Right sidebar - Action Cards for ALL users */}
            <div className="lg:col-span-1 space-y-4">
              <ActionCards 
                assessmentTaken={assessmentTaken}
                virtues={virtues}
                connection={connection}
                lastJournalEntry={lastJournalEntry}
                progress={progress}
              />
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </div>
  );
}
