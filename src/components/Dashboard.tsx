'use client'

import { useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { HelpCircle } from 'lucide-react'
import AppHeader from './AppHeader'
import Footer from './Footer'
import WelcomeModal from './WelcomeModal'
import VirtueRow from './dashboard/VirtueRow'
import ActionCards from './dashboard/ActionCards'
import ProgressLegend from './dashboard/ProgressLegend'
import VirtueRoseChart from './VirtueRoseChart'
import { useDashboardData } from '@/hooks/useDashboardData'

export default function Dashboard() {
  const {
    loading,
    connection,
    virtues,
    assessmentTaken,
    assessmentResults,
    lastJournalEntry,
    showWelcomeModal,
    handleCloseModal,
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
                      onClick={() => handleCloseModal()}
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
