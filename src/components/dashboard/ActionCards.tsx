'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { UserCheck, BookOpen, Edit, Sparkles, Target } from 'lucide-react'
import VirtueRoseChart from '../VirtueRoseChart'
import ReactMarkdown from 'react-markdown'
import { Virtue, Connection, getChartDisplayVirtueName } from '@/lib/constants'
import { supabase } from '@/lib/supabaseClient'
import { AIFeedbackButtons } from '@/components/AIFeedbackButtons'

interface ActionCardsProps {
  assessmentTaken: boolean;
  virtues: Virtue[];
  connection: Connection | null;
  lastJournalEntry: string | null;
  progress: Map<string, string>;
}

export default function ActionCards({ 
  assessmentTaken, 
  virtues, 
  connection, 
  lastJournalEntry,
  progress 
}: ActionCardsProps) {
  const [dashboardPrompt, setDashboardPrompt] = useState<string>('');
  const [promptLoading, setPromptLoading] = useState(false);

  const calculateDaysSince = (dateString: string | null): number | null => {
    if (!dateString) return null;
    const lastDate = new Date(dateString);
    const today = new Date();
    lastDate.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    const differenceInTime = today.getTime() - lastDate.getTime();
    return Math.floor(differenceInTime / (1000 * 3600 * 24));
  };

  const fetchDashboardPrompt = async () => {
    if (!assessmentTaken || virtues.length === 0) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setPromptLoading(true);
    try {
      const prioritizedVirtues = virtues.map(v => ({
        virtue: v.name,
        defectIntensity: 10 - (v.virtue_score || 0),
        virtueId: v.id
      }));

      const stageProgress: {[key: string]: string} = {};
      progress.forEach((status, key) => {
        stageProgress[key] = status;
      });

      const response = await fetch('https://getdashboardprompt-917009769018.us-central1.run.app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessmentSummary: 'Assessment completed - virtue development journey in progress',
          prioritizedVirtues,
          stageProgress,
          recentProgress: 'Dashboard accessed',
          isFirstTime: progress.size === 0
        })
      });

      if (response.ok) {
        const data = await response.json();
        const prompt = data.prompt || 'Continue your virtue development journey by selecting a stage to work on.';
        setDashboardPrompt(prompt);
      }
    } catch (error) {
      console.error('Error fetching dashboard prompt:', error);
      setDashboardPrompt('Continue your virtue development journey by selecting a stage to work on.');
    } finally {
      setPromptLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardPrompt();
  }, [assessmentTaken, virtues.length, progress.size]);

  const daysSinceJournal = calculateDaysSince(lastJournalEntry);

  return (
    <div className="space-y-6">
      {assessmentTaken && virtues.length > 0 && (
        <Card className="order-first bg-white/80 backdrop-blur-sm border-stone-200/60 shadow-gentle">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex flex-row items-center gap-4">
              <Target className="h-8 w-8 text-amber-700" />
              <CardTitle className="text-stone-800 font-medium">Your Next Step</CardTitle>
            </div>
            {!promptLoading && (
              <AIFeedbackButtons 
                promptName="Dashboard-NextStep"
                promptContent={dashboardPrompt || "Dashboard guidance content"}
                size="sm"
              />
            )}
          </CardHeader>
          <CardContent>
            {promptLoading ? (
              <div className="space-y-3">
                <div className="animate-pulse space-y-2">
                  <div className="h-3 bg-stone-300/40 rounded w-full"></div>
                  <div className="h-3 bg-stone-300/40 rounded w-5/6"></div>
                  <div className="h-3 bg-stone-300/40 rounded w-4/6"></div>
                </div>
                <p className="text-stone-600 text-xs font-light animate-pulse">
                  Generating your personalized guidance...
                </p>
              </div>
            ) : (
              <div className="text-sm text-stone-700 leading-relaxed prose prose-sm prose-stone max-w-none [&>p]:mb-6">
                <ReactMarkdown>{dashboardPrompt}</ReactMarkdown>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="order-first bg-white/80 backdrop-blur-sm border-stone-200/60 shadow-gentle">
        <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
          <BookOpen className="h-8 w-8 text-amber-700" />
          <div>
            <CardTitle className="text-stone-800 font-medium">Discovery</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {assessmentTaken && virtues.length > 0 ? (
            <>
              <p className="text-sm text-stone-600 text-center">
                Place your pointer above each pedal of the virtue chart to see the virtue and its score, the higher the score the greater perfection. The rose will grow as you take the steps of dismantling, building and practice.
              </p>
              <VirtueRoseChart 
                data={virtues.map(v => ({
                  virtue: getChartDisplayVirtueName(v.name),
                  score: v.virtue_score || 0
                }))}
                size="medium"
                showLabels={false}
              />
              <div className="px-6 pb-4 pt-2 text-center space-y-2">
                <Link href="/assessment">
                  <Button size="sm" variant="outline">View Virtue Growth Plan</Button>
                </Link>
              </div>
            </>
          ) : (
            <div className="p-6">
              <div className="flex items-center gap-2 mb-3 text-amber-700">
                <Sparkles size={18} />
                <p className="text-sm font-medium">Discover your Virtue Rose</p>
              </div>
              <p className="text-sm text-stone-600 mb-3">
                Take the assessment to visualize your virtue strengths and areas for growth.
              </p>
              <Link href="/assessment">
                <Button size="sm" variant="outline">Take Assessment</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white/80 backdrop-blur-sm border-stone-200/60 shadow-gentle">
        <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
          <UserCheck className="h-8 w-8 text-amber-700" />
          <div className="flex-1">
            <CardTitle className="text-stone-800 font-medium">Sponsor Connection</CardTitle>
          </div>
          {connection?.unread_messages && (
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          )}
        </CardHeader>
        <CardContent>
          {connection ? (
            <div>
              {connection.status === 'pending' ? (
                <p className="text-sm text-stone-600 mb-2">
                  Your sponsor connection is still pending.
                </p>
              ) : (
                <p className="text-sm text-stone-600 mb-2">
                  Your sponsor is {connection.sponsor_name || 'Your Sponsor'}.
                </p>
              )}
              <p className={`text-sm font-medium capitalize ${
                connection.status === 'active' ? 'text-green-600' : 'text-amber-600'
              }`}>
                {connection.status}
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-stone-600 mb-2">
                Connecting with a sponsor or coach brings further insights to your virtue development.
              </p>
              <Link href="/account-settings">
                <Button size="sm" variant="outline">Invite a Sponsor</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white/80 backdrop-blur-sm border-stone-200/60 shadow-gentle">
        <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
          <Edit className="h-8 w-8 text-amber-700" />
          <div>
            <CardTitle className="text-stone-800 font-medium">Journal</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {daysSinceJournal !== null ? (
            <p className="text-sm text-stone-600 mb-2">
              Your last entry was <span className="font-bold text-stone-800">
                {daysSinceJournal === 0 ? 'today' : `${daysSinceJournal} day${daysSinceJournal > 1 ? 's' : ''} ago`}
              </span>.
            </p>
          ) : (
            <p className="text-sm text-stone-600 mb-2">
              Journaling is a place to capture more insights about virtue growth.
            </p>
          )}
          <Link href="/journal">
            <Button size="sm" variant="outline">Go to Journal</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
