// src/app/journal/page.tsx
'use client'

import { useEffect } from 'react';
import AppHeader from "@/components/AppHeader";
import JournalComponent from "@/components/JournalComponent";

export default function JournalPage() {
  
  useEffect(() => {
    document.title = "New Man: My Journal";
  }, []);

  return (
    // ## FIX: Replaced background image with a clean, consistent theme background ##
    <div className="min-h-screen bg-stone-50">
      <AppHeader />
      
      <main className="container mx-auto p-4 md:p-8">
          {/* ## FIX: The redundant "Back to Dashboard" button has been removed ##
            Navigation is now handled exclusively by the AppHeader for a cleaner look.
          */}
          <div className="bg-white p-6 md:p-8 rounded-xl border border-stone-200 shadow-lg">
              <JournalComponent />
          </div>
      </main>
    </div>
  );
}

