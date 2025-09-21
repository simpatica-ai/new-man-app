'use client';

import { useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { AuthCard } from "@/components/AuthCard";
import Dashboard from "@/components/Dashboard";
import EmailConfirmationRequired from "@/components/EmailConfirmationRequired";
import Footer from "@/components/Footer";
import heroBackground from "@/assets/hero-background.jpg";
import { useRouter } from "next/navigation";


// ## FIX: Define the component as a constant before exporting ##
const HomePage = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);
  const [hasCompletedAssessment, setHasCompletedAssessment] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    document.title = "New Man App: Home";
    
    const checkUserStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user && !session.user.email_confirmed_at) {
        setNeedsEmailConfirmation(true);
        setIsLoading(false);
        return;
      }
      
      if (session?.user) {
        // Check if user has completed assessment
        const { data: profile } = await supabase
          .from('profiles')
          .select('has_completed_first_assessment')
          .eq('id', session.user.id)
          .single();
        
        const completed = profile?.has_completed_first_assessment || false;
        setHasCompletedAssessment(completed);
        
        console.log('Main page - Assessment completed:', completed, 'Current path:', window?.location?.pathname);
        
        // Only redirect new users to welcome page automatically (avoid loop)
        if (!completed && typeof window !== 'undefined' && window.location.pathname === '/') {
          console.log('Redirecting to welcome page');
          router.push('/welcome');
          return;
        }
        
        // If assessment is completed, stay on dashboard
        if (completed) {
          console.log('Assessment completed, staying on dashboard');
        }
      }
      
      setSession(session);
      setIsLoading(false);
    };

    checkUserStatus();

    // Failsafe: Force loading to stop after 3 seconds
    const timeout = setTimeout(() => {
      console.log('Timeout reached, forcing loading to stop');
      setIsLoading(false);
      setSession(null); // Assume no session on timeout
    }, 3000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user && !session.user.email_confirmed_at) {
          setNeedsEmailConfirmation(true);
          setSession(null);
          setHasCompletedAssessment(null);
        } else if (session?.user) {
          // Check assessment status for authenticated users
          const { data: profile } = await supabase
            .from('profiles')
            .select('has_completed_first_assessment')
            .eq('id', session.user.id)
            .single();
          
          const completed = profile?.has_completed_first_assessment || false;
          setHasCompletedAssessment(completed);
          
          console.log('Auth change - Assessment completed:', completed, 'Current path:', window?.location?.pathname);
          
          // Redirect new users to welcome page automatically (avoid loop)
          if (!completed && typeof window !== 'undefined' && window.location.pathname === '/') {
            console.log('Redirecting to welcome page from auth change');
            router.push('/welcome');
            return;
          }
          
          // If assessment is completed, stay on dashboard
          if (completed) {
            console.log('Assessment completed, staying on dashboard from auth change');
          }
          
          setSession(session);
          setNeedsEmailConfirmation(false);
        } else {
          setSession(session);
          setHasCompletedAssessment(null);
          setNeedsEmailConfirmation(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [router]);

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

  if (session && hasCompletedAssessment) {
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
                        <li className="flex"><span className="mr-2">•</span><span><strong>Mentor Support</strong> - Connect with a sponsor who guides and encourages your growth using insights from your assessments</span></li>
                        <li className="flex"><span className="mr-2">•</span><span><strong>Smart Progress Tracking</strong> - Visualize your development with analytics that identify trends and suggest next steps using responsibly applied AI to leverage insights generated by your virtue practice</span></li>
                        <li className="flex"><span className="mr-2">•</span><span><strong>Privacy First</strong> - Your personal journey and reflections remain completely private and secure</span></li>
                      </ul>
                    </div>
                    
                    <p>
                      Whether you're beginning your journey of personal growth or deepening existing practices, The New Man App combines proven virtue development principles with modern technology to provide personalized guidance and community support.
                    </p>
                    
                    <p className="font-semibold text-amber-800">
                      Ready to begin your transformation? Create your account today to start your personalized virtue development journey. Thank you for being an early adopter and joining us in this mission to build character and transform lives.
                    </p>
                  </div>
                </div>
                
                <div>
                  <AuthCard />
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

