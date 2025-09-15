// src/components/AppHeader.tsx
'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation'; // <-- Import the hook
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Settings, LogOut, LifeBuoy, ArrowLeft, MessageSquare } from 'lucide-react';
import FeedbackSurveyModal from './FeedbackSurveyModal';

type Profile = {
  full_name: string | null;
}

export default function AppHeader() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
        setProfile(data);
      }
    };
    fetchProfile();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };
  
  const getPageTitle = () => {
    if (pathname.startsWith('/assessment')) return 'Character Assessment';
    if (pathname.startsWith('/journal')) return 'My Journal';
    if (pathname.startsWith('/virtue/')) return 'Virtue Workspace';
    if (pathname.startsWith('/account-settings')) return 'Account Settings';
    if (pathname.startsWith('/get-support')) return 'Get Support';
    if (pathname.startsWith('/sponsor')) return 'Sponsor Dashboard';
    return 'Dashboard';
  }

  const isDashboard = pathname === '/';

  return (
    <>
      <header className="bg-white/80 backdrop-blur-sm border-b border-stone-200/60 sticky top-0 z-10 shadow-gentle">
        <div className="container mx-auto p-3 md:p-4">
          {/* Mobile: Single row with buttons on right, Desktop: Flexible layout */}
          <div className="flex justify-between items-start">
            {/* Left side: Back button and app info */}
            <div className="flex items-start gap-2 md:gap-4 flex-1 min-w-0">
              {!isDashboard && (
                <Link href="/" passHref className="flex-shrink-0 mt-1">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="border-stone-300 text-stone-700 hover:bg-stone-50 hover:border-amber-200 transition-mindful w-8 h-8 md:w-10 md:h-10"
                  >
                    <ArrowLeft className="h-3 w-3 md:h-4 md:w-4" />
                    <span className="sr-only">Back to Dashboard</span>
                  </Button>
                </Link>
              )}
              <div className="flex flex-col min-w-0">
                <div className="text-xs md:text-sm font-medium text-amber-700">New Man App</div>
                <div className="text-base md:text-xl font-medium text-stone-800 leading-tight truncate">
                  {getPageTitle()}
                </div>
                {profile?.full_name && pathname === '/' && (
                  <div className="text-xs md:text-sm text-stone-600 truncate">Welcome, {profile.full_name}</div>
                )}
              </div>
            </div>
            
            {/* Right side: Action buttons - always in top row */}
            <div className="flex items-center space-x-1 flex-shrink-0">
              <Button 
                onClick={() => setShowFeedbackModal(true)}
                title="Alpha Feedback" 
                variant="outline" 
                size="sm"
                className="border-amber-300 text-amber-700 hover:bg-amber-50 transition-mindful text-xs h-8 px-2"
              >
                <MessageSquare className="h-3 w-3 mr-1" />
                <span className="hidden xs:inline">Feedback</span>
              </Button>
              <Link href="/get-support">
                <Button 
                  title="Get Support" 
                  variant="ghost" 
                  size="icon"
                  className="text-stone-600 hover:text-amber-700 hover:bg-amber-50 transition-mindful w-8 h-8"
                >
                  <LifeBuoy className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/account-settings">
                <Button 
                  title="Settings" 
                  variant="ghost" 
                  size="icon"
                  className="text-stone-600 hover:text-amber-700 hover:bg-amber-50 transition-mindful w-8 h-8"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
              <Button 
                onClick={handleSignOut} 
                title="Sign Out" 
                variant="ghost" 
                size="icon"
                className="text-stone-600 hover:text-red-700 hover:bg-red-50 transition-mindful w-8 h-8"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      <FeedbackSurveyModal 
        isOpen={showFeedbackModal} 
        onClose={() => setShowFeedbackModal(false)} 
      />
    </>
  );
}

