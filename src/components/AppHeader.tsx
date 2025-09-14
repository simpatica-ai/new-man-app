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
    if (pathname.startsWith('/journal')) return 'My Journal';
    if (pathname.startsWith('/virtue')) return 'Virtue Workspace';
    if (pathname.startsWith('/account-settings')) return 'Account Settings';
    return profile?.full_name ? `Welcome, ${profile.full_name}` : 'Dashboard';
  }

  const isDashboard = pathname === '/';

  return (
    <>
      <header className="bg-white/80 backdrop-blur-sm border-b border-stone-200/60 sticky top-0 z-10 shadow-gentle">
        <div className="container mx-auto p-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            {!isDashboard && (
              <Link href="/" passHref>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="border-stone-300 text-stone-700 hover:bg-stone-50 hover:border-amber-200 transition-mindful"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="sr-only">Back to Dashboard</span>
                </Button>
              </Link>
            )}
            <h1 className="text-xl font-medium text-stone-800 leading-relaxed">
              {getPageTitle()}
            </h1>
          </div>
          <div className="flex items-center space-x-1">
            <Button 
              onClick={() => setShowFeedbackModal(true)}
              title="Alpha Feedback" 
              variant="outline" 
              size="sm"
              className="border-amber-300 text-amber-700 hover:bg-amber-50 transition-mindful mr-2"
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              Feedback
            </Button>
            <Link href="/get-support">
              <Button 
                title="Get Support" 
                variant="ghost" 
                size="icon"
                className="text-stone-600 hover:text-amber-700 hover:bg-amber-50 transition-mindful"
              >
                <LifeBuoy className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/account-settings">
              <Button 
                title="Settings" 
                variant="ghost" 
                size="icon"
                className="text-stone-600 hover:text-amber-700 hover:bg-amber-50 transition-mindful"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
            <Button 
              onClick={handleSignOut} 
              title="Sign Out" 
              variant="ghost" 
              size="icon"
              className="text-stone-600 hover:text-red-700 hover:bg-red-50 transition-mindful"
            >
              <LogOut className="h-5 w-5" />
            </Button>
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

