'use client'

import { useEffect, useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { HelpCircle, ChevronDown, ChevronUp, BookOpen, Target, Users, MessageCircle } from 'lucide-react'
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
    lastJournalEntry,
    showWelcomeModal,
    handleCloseModal,
    handleOpenModal,
    getStatusClasses
  } = useDashboardData();

  useEffect(() => { 
    document.title = "New Man: Dashboard"; 
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-amber-100 relative">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgb(120,113,108)_1px,_transparent_0)] bg-[length:32px_32px]"></div>
      </div>
      
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-50/60 to-stone-100/80"></div>
      
      <div className="relative z-10">
        <AppHeader />
        <WelcomeModal isOpen={showWelcomeModal} onClose={handleCloseModal} />

        <main className="container mx-auto p-4 md:p-8">
          {loading ? (
            <div className="text-center">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-stone-300/60 rounded-lg w-64 mx-auto"></div>
                <div className="h-4 bg-amber-200/60 rounded-lg w-48 mx-auto"></div>
              </div>
              <p className="text-stone-600 font-light mt-4">Loading dashboard...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              <div className="lg:col-span-2 space-y-4">
                {/* Assessment Chart - Show when assessment is completed */}
                {assessmentTaken && assessmentResults && (
                  <Card className="bg-white/80 backdrop-blur-sm border-stone-200/60 shadow-gentle">
                    <CardHeader>
                      <CardTitle className="text-xl font-light text-stone-800">Your Virtue Assessment</CardTitle>
                    </CardHeader>
                    <CardContent className="flex justify-center items-center h-[400px]">
                      <VirtueRoseChart 
                        data={assessmentResults}
                        size="medium"
                      />
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-3 p-4 bg-white/80 backdrop-blur-sm rounded-lg border border-stone-200/60 shadow-gentle">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-light text-stone-800">
                      Your Prioritized Virtues
                    </h2>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenModal()}
                      className="border-amber-200 text-amber-700 hover:bg-amber-50 transition-mindful"
                    >
                      <HelpCircle className="h-4 w-4 mr-2" />
                      Guide
                    </Button>
                  </div>
                  <div className="flex justify-end">
                    <ProgressLegend />
                  </div>
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
              </div>
              
              <div className="lg:col-span-1 lg:sticky lg:top-24">
                {/* App Overview Card */}
                <Card className="mb-6 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold text-amber-800 flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        Your Virtue Journey
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowOverview(!showOverview)}
                        className="text-amber-700 hover:text-amber-800 hover:bg-amber-100"
                      >
                        {showOverview ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </div>
                  </CardHeader>
                  {showOverview && (
                    <CardContent className="pt-0">
                      <div className="space-y-4 text-sm text-amber-900">
                        <div className="flex items-start gap-3">
                          <Target className="h-4 w-4 mt-0.5 text-amber-600 flex-shrink-0" />
                          <div>
                            <p className="font-medium mb-1">1. Character Assessment</p>
                            <p className="text-amber-800">Begin with a moral awakening through character inventory, discovering insights presented positively toward 12 virtues.</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <BookOpen className="h-4 w-4 mt-0.5 text-amber-600 flex-shrink-0" />
                          <div>
                            <p className="font-medium mb-1">2. Virtue Sequencing</p>
                            <p className="text-amber-800">AI-powered insights sequence your 12 virtues by greatest development need, creating a personalized months-long journey.</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <div className="h-4 w-4 mt-0.5 text-amber-600 flex-shrink-0 rounded-full bg-amber-200 flex items-center justify-center text-xs font-bold">1</div>
                          <div>
                            <p className="font-medium mb-1">Stage 1: Dismantling</p>
                            <p className="text-amber-800">Dwell on character defects associated with each virtue. Clear the foundation before building.</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <div className="h-4 w-4 mt-0.5 text-amber-600 flex-shrink-0 rounded-full bg-amber-200 flex items-center justify-center text-xs font-bold">2</div>
                          <div>
                            <p className="font-medium mb-1">Stage 2: Building</p>
                            <p className="text-amber-800">Construct virtue through guided reflection and AI-generated insights.</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <div className="h-4 w-4 mt-0.5 text-amber-600 flex-shrink-0 rounded-full bg-amber-200 flex items-center justify-center text-xs font-bold">3</div>
                          <div>
                            <p className="font-medium mb-1">Stage 3: Maintaining</p>
                            <p className="text-amber-800">Sustain virtue development through ongoing reflection and practice.</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <Users className="h-4 w-4 mt-0.5 text-amber-600 flex-shrink-0" />
                          <div>
                            <p className="font-medium mb-1">Sponsor Support</p>
                            <p className="text-amber-800">Invite a sponsor to observe your assessment and virtue progress, with chat available on each virtue desktop.</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <MessageCircle className="h-4 w-4 mt-0.5 text-amber-600 flex-shrink-0" />
                          <div>
                            <p className="font-medium mb-1">Journal & Reflection Book</p>
                            <p className="text-amber-800">Record insights in your journal. In time, we'll build a reflection book celebrating your progress while recognizing the ongoing journey.</p>
                          </div>
                        </div>
                        
                        <div className="mt-4 p-3 bg-amber-100 rounded-lg border border-amber-200">
                          <p className="text-xs text-amber-800 font-medium">
                            💡 <strong>Approach:</strong> Complete all Stage 1s across virtues, or focus on one virtue through all stages. Always progress toward Stage 3 - the journey of virtue development unfolds across months.
                          </p>
                        </div>
                        
                        <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
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
          )}
        </main>
        <Footer />
      </div>
    </div>
  );
}
