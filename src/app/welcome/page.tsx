'use client'

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import AppHeader from "@/components/AppHeader"
import Footer from "@/components/Footer"
import VirtueProgressBar from "@/components/VirtueProgressBar"

export default function WelcomePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [hasCompletedAssessment, setHasCompletedAssessment] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      console.log('Welcome page - Session check:', !!session);
      
      if (!session) {
        console.log('No session, redirecting to auth');
        router.push('/auth')
        return
      }

      // Check if user has completed assessment
      const { data: profile } = await supabase
        .from('profiles')
        .select('has_completed_first_assessment')
        .eq('id', session.user.id)
        .single()

      setHasCompletedAssessment(profile?.has_completed_first_assessment || false)
      setIsAuthenticated(true)
      setIsLoading(false)
    }

    checkAuth()
  }, [router])

  const handleBeginAssessment = () => {
    router.push('/assessment')
  }

  const handleGoToDashboard = () => {
    router.push('/')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-stone-50">
      <AppHeader />
      
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-stone-800 mb-4">
              Welcome to Your Virtue Development Journey
            </h1>
          </div>

          {/* Introduction Text */}
          <div className="bg-white rounded-lg shadow-sm p-8 mb-8 border border-stone-200">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <p className="text-lg text-stone-700 leading-relaxed mb-6">
                  Welcome to a transformative journey of virtue development. This program guides you through 
                  a comprehensive process of personal growth, helping you identify, understand, and cultivate 
                  virtue focusing on 12 core virtues listed at the right.
                </p>
                <p className="text-lg text-stone-700 leading-relaxed">
                  Our approach follows a proven methodology that takes you through four distinct stages of virtue recovery 
                  and development. Each stage builds upon the previous one, creating a solid foundation for lasting change 
                  and personal transformation.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-stone-800 mb-4">The 12 Core Virtues</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    'Responsibility', 'Mindfulness', 'Compassion', 'Gratitude',
                    'Self-Control', 'Patience', 'Honesty', 'Integrity', 
                    'Respect', 'Humility', 'Vulnerability', 'Boundaries'
                  ].map((virtue) => (
                    <div 
                      key={virtue}
                      className="bg-amber-100 text-amber-800 px-3 py-2 rounded-full text-sm font-medium text-center border border-amber-200"
                    >
                      {virtue}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Process Progress Bar */}
          <div className="bg-white rounded-lg shadow-sm p-8 mb-8 border border-stone-200">
            <h2 className="text-2xl font-semibold text-stone-800 mb-6 text-center">
              The Four Stages of Virtue Development
            </h2>
            <div className="max-w-2xl mx-auto px-4">
              <VirtueProgressBar 
                hasCompletedAssessment={false}
                className="py-6"
              />
            </div>
          </div>

          {/* Stage Descriptions */}
          <div className="bg-white rounded-lg shadow-sm p-8 mb-8 border border-stone-200">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-3" style={{color: '#8B4513'}}>Discovery</h3>
                <p className="text-stone-700 mb-4">
                  Begin with a comprehensive assessment to understand your current virtue landscape. 
                  The app analyzes your responses to prioritize which virtues to develop based on the 
                  intensity of character defects associated with each virtue. This ensures you focus 
                  your energy on the areas where growth will have the most meaningful impact.
                </p>

                <h3 className="text-xl font-semibold mb-3" style={{color: '#A0522D'}}>Dismantling</h3>
                <p className="text-stone-700 mb-4">
                  Work through guided reflections that help you identify and address the barriers, habits, 
                  and thought patterns that prevent virtue development. The app provides structured exercises 
                  and AI-generated insights to support this foundational work.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3" style={{color: '#6B8E23'}}>Building</h3>
                <p className="text-stone-700 mb-4">
                  Actively cultivate new virtuous habits through daily journaling and reflection. 
                  The app tracks your progress, provides personalized feedback, and suggests specific 
                  actions to strengthen each virtue in your daily life.
                </p>

                <h3 className="text-xl font-semibold mb-3" style={{color: '#556B2F'}}>Practicing</h3>
                <p className="text-stone-700">
                  Integrate your developed virtues into daily life with consistency and discernment. 
                  The app helps you maintain your progress, connect with mentors, and eventually 
                  guide others on their own journey of character development.
                </p>
              </div>
            </div>
          </div>

          {/* Next Actions Container */}
          <div className="bg-white rounded-lg shadow-sm p-8 mb-8 border border-stone-200">
            <h2 className="text-2xl font-semibold text-stone-800 mb-6">
              Next Actions for Virtue Development
            </h2>
            <div className="space-y-4 text-stone-700 leading-relaxed">
              <p>
                The first stage entails an assessment of a broad inventory of potential character defects. 
                As the assessment is completed, insights on progress across 12 virtues are offered.
              </p>
              <p>
                With these insights, you will be taken to a virtue dashboard where you can begin examining 
                character defects as the next step. This work is done on a virtue desktop where you can 
                write about the consequences of each defect. A contextual prompt will help guide this reflection.
              </p>
              <p>
                You can choose to keep working on one virtue by continuing to the building stage, and further 
                once the building is complete, begin reflections on virtue practice. Once the discovery assessment 
                is complete, you can invite a sponsor to view your work and offer comments via an integrated chat.
              </p>
              <p className="font-medium text-amber-800">
                We invite daily practice, and expect that this is a journey of months not days.
              </p>
              
              <div className="pt-4">
                {!hasCompletedAssessment ? (
                  <Button 
                    onClick={handleBeginAssessment}
                    size="lg"
                    className="bg-amber-700 hover:bg-amber-800 text-white px-8 py-4 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    Start Assessment
                  </Button>
                ) : (
                  <Button 
                    onClick={handleGoToDashboard}
                    size="lg"
                    className="bg-emerald-700 hover:bg-emerald-800 text-white px-8 py-4 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    Continue to Dashboard
                  </Button>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
      <Footer />
    </div>
  )
}
