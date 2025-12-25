'use client';

import { useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { AuthCard } from "@/components/AuthCard";
import Dashboard from "@/components/Dashboard";
import EmailConfirmationRequired from "@/components/EmailConfirmationRequired";
import Footer from "@/components/Footer";
import PublicHeader from "@/components/PublicHeader";
import heroBackground from "@/assets/hero-background.jpg";


// ## FIX: Define the component as a constant before exporting ##
const HomePage = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);

  useEffect(() => {
    document.title = "New Man App: Home";
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && !session.user.email_confirmed_at) {
        setNeedsEmailConfirmation(true);
        setIsLoading(false);
      } else if (session?.user) {
        // Just set the session, let Dashboard handle routing
        setSession(session);
        setIsLoading(false);
      } else {
        setSession(session);
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user && !session.user.email_confirmed_at) {
          setNeedsEmailConfirmation(true);
          setSession(null);
        } else if (session?.user) {
          // Check if user is sponsor-only or org admin before setting session
          supabase
            .from('profiles')
            .select('has_completed_first_assessment, roles, organization_id')
            .eq('id', session.user.id)
            .single()
            .then(async ({ data: profile }) => {
              // Check if user is an organization admin
              const isOrgAdmin = profile?.roles?.includes('admin') && profile?.organization_id;
              
              if (isOrgAdmin) {
                window.location.href = '/orgadmin';
                return;
              }
              
              // Check if user is a sponsor
              const { data: sponsorData } = await supabase
                .from('sponsor_relationships')
                .select('id')
                .eq('sponsor_id', session.user.id)
                .eq('status', 'active')
                .limit(1);
              
              const isSponsor = sponsorData && sponsorData.length > 0;
              const isPractitioner = profile?.has_completed_first_assessment;
              
              // Redirect sponsor-only users
              if (isSponsor && !isPractitioner) {
                window.location.href = '/sponsor/dashboard';
                return;
              }
              // For practitioners (or both), set session normally
              setSession(session);
              setNeedsEmailConfirmation(false);
            });
        } else {
          setSession(session);
          setNeedsEmailConfirmation(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
            <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (needsEmailConfirmation) {
    return <EmailConfirmationRequired />;
  }

  if (session) {
    return <Dashboard />;
  }

  return (
    <div 
      className="min-h-screen relative bg-cover bg-center"
      style={{ backgroundImage: `url(${heroBackground.src})` }}
    >
      {/* ## FIX: Removed backdrop-blur-md class ## */}
      <div className="absolute inset-0 bg-white/80"></div>
      
      <div className="relative z-10">
        <PublicHeader />
        <main className="container mx-auto p-4 sm:p-6 lg:p-8">
          <div className="min-h-screen flex items-center justify-center">
            <div className="w-full">
              <h1 className="text-4xl md:text-5xl font-light leading-tight mb-8 text-center text-stone-800">
                A New Man: Your Guide to Virtuous Living
              </h1>
              
              <div className="grid md:grid-cols-2 gap-12 lg:gap-24 items-center">
                
                <div className="text-stone-800 text-left">
                  <div className="space-y-4 text-stone-700">
                    <p>
                      Transform your character through intentional virtue development with personalized insights and guidance. The New Man App helps you identify areas for growth, track your progress, and build lasting positive habits with the support of a personal mentor.
                    </p>
                    
                    <div className="space-y-3">
                      <h3 className="font-semibold text-stone-800">Key Features:</h3>
                      <ul className="space-y-2 text-sm">
                        <li className="flex"><span className="mr-2">•</span><span><strong>Comprehensive Virtue Assessment</strong> - Discover your strengths and growth areas across 12 core virtues with personalized analysis and recommendations</span></li>
                        <li className="flex"><span className="mr-2">•</span><span><strong>Detailed Insight Reports</strong> - Receive in-depth reports that analyze your virtue development patterns and provide actionable guidance for improvement</span></li>
                        <li className="flex"><span className="mr-2">•</span><span><strong>Personal Journal</strong> - Reflect on your daily experiences with intelligent feedback that helps you recognize growth opportunities</span></li>
                        <li className="flex"><span className="mr-2">•</span><span><strong>Mentor Support</strong> - Connect with a coach who guides and encourages your growth using insights from your assessments</span></li>
                        <li className="flex"><span className="mr-2">•</span><span><strong>Smart Progress Tracking</strong> - Visualize your development with analytics that identify trends and suggest next steps using responsibly applied AI to leverage insights generated by your virtue practice</span></li>
                        <li className="flex"><span className="mr-2">•</span><span><strong>Privacy First</strong> - Your personal journey and reflections remain completely private and secure</span></li>
                      </ul>
                    </div>
                    
                    <p>
                      Whether you&apos;re beginning your journey of personal growth or deepening existing practices, The New Man App combines proven virtue development principles with modern technology to provide personalized guidance and community support.
                    </p>
                    
                    <p className="font-semibold text-amber-800">
                      Ready to begin your transformation? Create your account today to start your personalized virtue development journey. Thank you for being an early adopter and joining us in this mission to build character and transform lives.
                    </p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <AuthCard />
                  
                  <div className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                    <h3 className="text-lg font-semibold text-amber-800 mb-2">
                      Looking to support your entire organization?
                    </h3>
                    <p className="text-amber-700 mb-4">
                      Empower your team, students, or community with organizational accounts featuring custom branding, progress tracking, and coaching support.
                    </p>
                    <div className="flex justify-end">
                      <a 
                        href="/organizations" 
                        className="inline-flex items-center justify-center px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md font-medium transition-colors"
                      >
                        Learn About Organizations
                      </a>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default HomePage;

