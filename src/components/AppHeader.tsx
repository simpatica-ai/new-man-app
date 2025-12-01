// src/components/AppHeader.tsx
'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation'; // <-- Import the hook
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Settings, LogOut, LifeBuoy, ArrowLeft, MessageSquare, Users, Target } from 'lucide-react';
import FeedbackSurveyModal from './FeedbackSurveyModal';

type Profile = {
  full_name: string | null;
}

export default function AppHeader() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [isSponsor, setIsSponsor] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profileData } = await supabase.from('profiles').select('full_name, has_completed_first_assessment').eq('id', user.id).single();
        setProfile(profileData);
        
        // Only check for sponsor role if user has also completed assessment (is a practitioner)
        // This way the switcher only shows for users with BOTH roles
        if (profileData?.has_completed_first_assessment) {
          const { data: sponsorData } = await supabase
            .from('sponsor_relationships')
            .select('id')
            .eq('sponsor_id', user.id)
            .eq('status', 'active')
            .limit(1);
          
          setIsSponsor(!!(sponsorData && sponsorData.length > 0));
        }
      }
    };
    fetchProfile();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };
  
  const getPageTitle = () => {
    if (pathname.startsWith('/welcome')) return 'Welcome!';
    if (pathname.startsWith('/assessment')) return 'Discovery';
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
              {/* Show sponsor dashboard link if user is a sponsor and on practitioner dashboard */}
              {isSponsor && pathname === '/' && (
                <Link href="/sponsor/dashboard">
                  <Button 
                    title="Sponsor Dashboard" 
                    variant="outline" 
                    size="sm"
                    className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 transition-colors h-8 px-2"
                  >
                    <Users className="h-4 w-4" />
                    <span className="hidden md:inline ml-1">Sponsor View</span>
                  </Button>
                </Link>
              )}
              {/* Show practitioner dashboard link if on sponsor pages */}
              {pathname.startsWith('/sponsor') && (
                <Link href="/">
                  <Button 
                    title="My Dashboard" 
                    variant="outline" 
                    size="sm"
                    className="border-blue-300 text-blue-700 hover:bg-blue-50 transition-colors h-8 px-2"
                  >
                    <Target className="h-4 w-4" />
                    <span className="hidden md:inline ml-1">My Practice</span>
                  </Button>
                </Link>
              )}
              <Button 
                onClick={() => setShowFeedbackModal(true)}
                title="Feedback" 
                variant="outline" 
                size="sm"
                className="border-amber-300 text-amber-700 hover:bg-amber-50 transition-colors h-8 px-2"
              >
                <MessageSquare className="h-4 w-4" />
                <span className="hidden md:inline ml-1">Feedback</span>
              </Button>
              <Link href="/get-support">
                <Button 
                  title="Get Support" 
                  variant="ghost" 
                  size="sm"
                  className="text-stone-600 hover:text-amber-700 hover:bg-amber-50 transition-colors h-8 px-2"
                >
                  <LifeBuoy className="h-4 w-4" />
                  <span className="hidden md:inline ml-1">Support</span>
                </Button>
              </Link>
              <Link href="/account-settings">
                <Button 
                  title="My Account" 
                  variant="ghost" 
                  size="sm"
                  className="text-stone-600 hover:text-amber-700 hover:bg-amber-50 transition-colors h-8 px-2"
                >
                  <Settings className="h-4 w-4" />
                  <span className="hidden md:inline ml-1">My Account</span>
                </Button>
              </Link>
              <Button 
                onClick={handleSignOut} 
                title="Logout" 
                variant="ghost" 
                size="sm"
                className="text-stone-600 hover:text-red-700 hover:bg-red-50 transition-colors h-8 px-2"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden md:inline ml-1">Logout</span>
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

