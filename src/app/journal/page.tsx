// src/app/journal/page.tsx
'use client'

import { useEffect } from 'react';
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import JournalComponent from "@/components/JournalComponent";

export default function JournalPage() {
  
  useEffect(() => {
    document.title = "New Man: My Journal";
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/30 to-orange-50/20">
      <AppHeader />
      
      <main className="container mx-auto p-4 md:p-8 max-w-4xl">
          <div className="bg-white/80 backdrop-blur-sm p-6 md:p-8 rounded-2xl border border-stone-200/50 shadow-xl">
              <JournalComponent />
          </div>
      </main>
      
      <Footer />
    </div>
  );
}

