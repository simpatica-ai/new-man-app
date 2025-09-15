'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
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
import { useDashboardData } from '@/hooks/useDashboardData'

export default function Dashboard() {
  const [showOverview, setShowOverview] = useState(false)
  const {
    loading,
    connection,
    virtues,
    assessmentTaken,
    assessmentResults,
    progress,
    lastJournalEntry,
    showWelcomeModal,
    handleCloseModal,
    handleOpenModal,
    getStatusClasses
  } = useDashboardData();

  console.log('Dashboard render - assessmentTaken:', assessmentTaken);
  console.log('Dashboard render - virtues length:', virtues.length);
  console.log('Dashboard render - loading:', loading);

  useEffect(() => { 
    document.title = "New Man: Dashboard"; 
  }, []);

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
            <p className="text-stone-600 font-light mt-4">Loading dashboard...</p>
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
                      />
                    ))}
                  </ul>
                </>
              )}
            </div>
            
            {/* Right sidebar - Journey container + Action Cards for ALL users */}
            <div className="lg:col-span-1 space-y-4">
              {/* App Overview Card - Available for all users */}
              <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <CardTitle className="text-base md:text-lg font-semibold text-amber-800 flex items-center gap-2">
                      <BookOpen className="h-4 md:h-5 w-4 md:w-5" />
                      Your Virtue Journey
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="lg"
                      onClick={() => setShowOverview(!showOverview)}
                      className="text-amber-700 hover:text-amber-800 hover:bg-amber-100 self-start sm:self-auto p-3 min-w-[44px] min-h-[44px]"
                    >
                      {showOverview ? <ChevronUp className="h-6 w-6 md:h-7 md:w-7" /> : <ChevronDown className="h-6 w-6 md:h-7 md:w-7" />}
                    </Button>
                  </div>
                </CardHeader>
                {showOverview && (
                  <CardContent className="pt-0">
                    <div className="space-y-3 md:space-y-4 text-xs md:text-sm text-amber-900">
                      <div className="flex items-start gap-2 md:gap-3">
                        <Target className="h-3 md:h-4 w-3 md:w-4 mt-0.5 text-amber-600 flex-shrink-0" />
                        <div>
                          <p className="font-medium mb-1">1. Character Assessment</p>
                          <p className="text-amber-800">Begin with a moral awakening through character inventory, discovering insights presented positively toward 12 virtues.</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2 md:gap-3">
                        <BookOpen className="h-3 md:h-4 w-3 md:w-4 mt-0.5 text-amber-600 flex-shrink-0" />
                        <div>
                          <p className="font-medium mb-1">2. Virtue Sequencing</p>
                          <p className="text-amber-800">AI-powered insights sequence your 12 virtues by greatest development need, creating a personalized months-long journey.</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2 md:gap-3">
                        <div className="h-3 md:h-4 w-3 md:w-4 mt-0.5 text-amber-600 flex-shrink-0 rounded-full bg-amber-200 flex items-center justify-center text-xs font-bold">1</div>
                        <div>
                          <p className="font-medium mb-1">Stage 1: Dismantling</p>
                          <p className="text-amber-800">Dwell on character defects associated with each virtue. Clear the foundation before building.</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2 md:gap-3">
                        <div className="h-3 md:h-4 w-3 md:w-4 mt-0.5 text-amber-600 flex-shrink-0 rounded-full bg-amber-200 flex items-center justify-center text-xs font-bold">2</div>
                        <div>
                          <p className="font-medium mb-1">Stage 2: Building</p>
                          <p className="text-amber-800">Construct virtue through guided reflection and AI-generated insights.</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2 md:gap-3">
                        <div className="h-3 md:h-4 w-3 md:w-4 mt-0.5 text-amber-600 flex-shrink-0 rounded-full bg-amber-200 flex items-center justify-center text-xs font-bold">3</div>
                        <div>
                          <p className="font-medium mb-1">Stage 3: Maintaining</p>
                          <p className="text-amber-800">Sustain virtue through ongoing practice and community connection.</p>
                        </div>
                      </div>

                      <div className="mt-2 md:mt-3 p-2 md:p-3 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-xs text-green-800 font-medium">
                          💬 <strong>We Value Your Input:</strong> Questions or feedback? Use the "Get Support" button in the top navigation. Your insights help us improve this early-stage application.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>

              <ActionCards 
                assessmentTaken={assessmentTaken}
                virtues={virtues}
                connection={connection}
                lastJournalEntry={lastJournalEntry}
              />
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </div>
  );
}
