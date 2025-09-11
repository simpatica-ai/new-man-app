'use client';

import { useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { AuthCard } from "@/components/AuthCard";
import Dashboard from "@/components/Dashboard";
import Footer from "@/components/Footer";
import heroBackground from "@/assets/hero-background.jpg";


// ## FIX: Define the component as a constant before exporting ##
const HomePage = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
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
        <main className="container mx-auto p-4 sm:p-6 lg:p-8">
          <div className="min-h-screen flex items-center justify-center">
            <div className="w-full">
              <div className="grid md:grid-cols-2 gap-12 lg:gap-24 items-center">
                
                <div className="text-stone-800 text-center md:text-left">
                  <h1 className="text-4xl md:text-5xl font-light leading-tight mb-4">
                    A New Man With
                    <br />
                    New Behaviors
                  </h1>
                  <p className="text-lg text-stone-600 mb-6">
                    A Guide to a Virtuous Life
                  </p>
                  <div className="space-y-4 text-stone-700">
                    <p>
                      This application grows from the book, inviting you to a journey of self-reflection. Learn from your character defects to build a sustainable practice of virtue.
                    </p>
                    <p>
                      Connect with a sponsor who can guide and coach you through your recovery and growth. This is a shared path, and you are not alone.
                    </p>
                    <p className="font-semibold">
                      This application is a free resource, made possible by the generosity of our community.
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

