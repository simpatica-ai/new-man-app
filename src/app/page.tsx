'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Session } from '@supabase/supabase-js'
import Dashboard from '@/components/Dashboard'
import AppHeader from '@/components/AppHeader'
import EmailConfirmationRequired from "@/components/EmailConfirmationRequired";
import Footer from "@/components/Footer";
import heroBackground from "@/assets/hero-background.jpg";

const HomePage = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);
  const [hasCompletedAssessment, setHasCompletedAssessment] = useState<boolean | null>(null);

  useEffect(() => {
    document.title = "New Man App: Home";
    
    const checkUserStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user && !session.user.email_confirmed_at) {
          setNeedsEmailConfirmation(true);
          setIsLoading(false);
          return;
        }
        
        if (session?.user) {
          // Check assessment with timeout
          try {
            const profilePromise = supabase
              .from('user_profiles')
              .select('has_completed_first_assessment')
              .eq('user_id', session.user.id)
              .single();
            
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Profile timeout')), 3000)
            );
            
            const { data: profile } = await Promise.race([profilePromise, timeoutPromise]) as any;
            const completed = profile?.has_completed_first_assessment || false;
            setHasCompletedAssessment(completed);
            
            // Redirect to welcome if assessment not completed
            if (!completed) {
              window.location.href = '/welcome';
              return;
            }
          } catch (error) {
            console.error('Profile check failed:', error);
            // On error, assume assessment completed to avoid redirect loop
            setHasCompletedAssessment(true);
          }
        }
        
        setSession(session);
        setIsLoading(false);
      } catch (error) {
        console.error('Auth error:', error);
        setSession(null);
        setIsLoading(false);
      }
    };

    checkUserStatus();

    // Set up auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event);
        setSession(session);
        setNeedsEmailConfirmation(false);
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

  if (!session) {
    return (
      <div 
        className="min-h-screen bg-cover bg-center bg-no-repeat flex flex-col"
        style={{ backgroundImage: `url(${heroBackground.src})` }}
      >
        <div className="bg-black bg-opacity-40 min-h-screen flex flex-col">
          <AppHeader />
          <main className="flex-1 flex items-center justify-center px-4">
            <div className="text-center text-white max-w-2xl">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                Transform Your Character
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-gray-200">
                Discover, develop, and practice virtue through guided reflection and AI-powered insights
              </p>
              <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
                <a 
                  href="/auth" 
                  className="inline-block bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 shadow-lg"
                >
                  Get Started
                </a>
                <a 
                  href="/auth" 
                  className="inline-block bg-transparent border-2 border-white text-white hover:bg-white hover:text-gray-900 font-semibold py-3 px-8 rounded-lg transition-colors duration-200"
                >
                  Sign In
                </a>
              </div>
            </div>
          </main>
          <Footer />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-amber-50">
      <AppHeader />
      <main className="container mx-auto px-4 py-8">
        <Dashboard />
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;
