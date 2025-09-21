'use client'

import { useState, useEffect } from 'react'
import Dashboard from '@/components/Dashboard'
import AppHeader from '@/components/AppHeader'
import Footer from "@/components/Footer";

const HomePage = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    document.title = "New Man App: Home";
    
    // Emergency bypass: Skip all Supabase calls to get site working
    console.log('Emergency bypass: Loading dashboard directly');
    setTimeout(() => {
      setIsLoading(false);
    }, 100);
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
