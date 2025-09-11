'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from './ui/button'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { UserCheck, BookOpen, Edit, Sparkles, HelpCircle } from 'lucide-react'
import AppHeader from './AppHeader'
import Footer from './Footer'
import WelcomeModal from './WelcomeModal'
import VirtueRoseChart from './VirtueRoseChart'

// --- CONSTANTS ---
const defects = [
    { name: "Addictive tendencies", virtues: ["Self-Control", "Mindfulness"] },
    { name: "Anger", virtues: ["Patience", "Compassion", "Self-Control"] },
    { name: "Apathy", virtues: ["Compassion", "Responsibility"] },
    { name: "Arrogance", virtues: ["Humility", "Respect"] },
    { name: "Betrayal", virtues: ["Honesty", "Integrity", "Respect"] },
    { name: "Bitterness", virtues: ["Gratitude", "Compassion"] },
    { name: "Blaming others", virtues: ["Responsibility", "Honesty"] },
    { name: "Boastfulness", virtues: ["Humility"] },
    { name: "Close-mindedness", virtues: ["Humility", "Respect"] },
    { name: "Compulsiveness", virtues: ["Self-Control", "Mindfulness"] },
    { name: "Conceit", virtues: ["Humility"] },
    { name: "Cruelty", virtues: ["Compassion", "Respect"] },
    { name: "Deceit", virtues: ["Honesty", "Integrity"] },
    { name: "Defensiveness", virtues: ["Humility", "Vulnerability"] },
    { name: "Dishonesty", virtues: ["Honesty", "Integrity"] },
    { name: "Disrespect", virtues: ["Respect", "Compassion"] },
    { name: "Distrust", virtues: ["Vulnerability", "Honesty"] },
    { name: "Egotism", virtues: ["Humility", "Respect"] },
    { name: "Haughtiness", virtues: ["Humility", "Respect"] },
    { name: "Hypocrisy", virtues: ["Honesty", "Integrity"] },
    { name: "Impatience", virtues: ["Patience", "Mindfulness"] },
    { name: "Impulsiveness", virtues: ["Self-Control", "Mindfulness"] },
    { name: "Indifference", virtues: ["Compassion", "Responsibility"] },
    { name: "Ingratitude", virtues: ["Gratitude"] },
    { name: "Infidelity", virtues: ["Honesty", "Integrity", "Respect"] },
    { name: "Intolerance", virtues: ["Respect", "Compassion"] },
    { name: "Irresponsibility", virtues: ["Responsibility"] },
    { name: "Judgmental attitude", virtues: ["Compassion", "Respect"] },
    { name: "Lack of empathy", virtues: ["Compassion"] },
    { name: "Lack of gratitude", virtues: ["Gratitude"] },
    { name: "Lack of self-control", virtues: ["Self-Control", "Mindfulness"] },
    { name: "Lying", virtues: ["Honesty", "Integrity"] },
    { name: "Manipulation", virtues: ["Honesty", "Respect", "Integrity"] },
    { name: "Narcissism", virtues: ["Humility", "Compassion"] },
    { name: "Neglect", virtues: ["Responsibility", "Compassion"] },
    { name: "Objectification", virtues: ["Respect", "Compassion"] },
    { name: "Pride", virtues: ["Humility", "Respect"] },
    { name: "Recklessness", virtues: ["Self-Control", "Mindfulness"] },
    { name: "Resentment", virtues: ["Gratitude", "Compassion"] },
    { name: "Rudeness", virtues: ["Respect", "Compassion"] },
    { name: "Self-centeredness", virtues: ["Humility", "Compassion"] },
    { name: "Self-righteousness", virtues: ["Humility", "Respect"] },
    { name: "Selfishness", virtues: ["Compassion"] },
    { name: "Stealing", virtues: ["Honesty", "Integrity"] },
    { name: "Superiority", virtues: ["Humility", "Respect"] },
    { name: "Unreliability", virtues: ["Responsibility", "Integrity"] }
];

// --- TYPE DEFINITIONS ---
type StageProgress = { virtue_id: number; stage_number: number; status: 'not_started' | 'in_progress' | 'completed'; }
type Virtue = { id: number; name: string; description: string; short_description: string | null; virtue_score?: number; };
type Connection = { id: number; status: string; sponsor_name: string | null; }

// --- DASHBOARD COMPONENT ---
export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [connection, setConnection] = useState<Connection | null>(null);
  const [virtues, setVirtues] = useState<Virtue[]>([]);
  const [assessmentTaken, setAssessmentTaken] = useState(false);
  const [progress, setProgress] = useState<Map<string, StageProgress['status']>>(new Map());
  const [lastJournalEntry, setLastJournalEntry] = useState<string | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);


  useEffect(() => { document.title = "New Man: Dashboard"; }, []);

  const getDashboardData = useCallback(async () => {
    try {
      setLoading(true); 
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const profilePromise = supabase.from('profiles').select('full_name, has_completed_first_assessment').eq('id', user.id).single();
      const connectionPromise = supabase.rpc('get_practitioner_connection_details', { practitioner_id_param: user.id });
      const virtuesPromise = supabase.from('virtues').select('id, name, description, short_description').order('id');
      const assessmentPromise = supabase.from('user_assessment_results').select('virtue_name, priority_score').eq('user_id', user.id).order('assessment_id', { ascending: false });
      const progressPromise = supabase.from('user_virtue_stage_progress').select('virtue_id, stage_number, status').eq('user_id', user.id);
      const journalPromise = supabase.from('journal_entries').select('created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1);

      const [profileResult, connectionResult, virtuesResult, assessmentResult, progressResult, journalResult] = await Promise.all([
        profilePromise, connectionPromise, virtuesPromise, assessmentPromise, progressPromise, journalPromise
      ]);
      
      if (profileResult.error) throw profileResult.error;
      const welcomeKey = 'welcome-modal-seen';
      const seen = localStorage.getItem(welcomeKey);
      if (!seen) {
        setShowWelcomeModal(true);
      }


      if (connectionResult.error) throw connectionResult.error;
      setConnection(connectionResult.data?.[0] || null);
      
      if (journalResult.data && journalResult.data.length > 0) {
        setLastJournalEntry(journalResult.data[0].created_at);
      } else if (journalResult.error && journalResult.error.code !== 'PGRST116') throw journalResult.error;

      if (progressResult.error) throw progressResult.error;
      const progressMap = new Map<string, StageProgress['status']>();
      (progressResult.data || []).forEach(p => progressMap.set(`${p.virtue_id}-${p.stage_number}`, p.status as StageProgress['status']));
      setProgress(progressMap);

      if (virtuesResult.error) throw virtuesResult.error;
      const baseVirtues = virtuesResult.data || [];

      if (assessmentResult.error) throw assessmentResult.error;
      const results = assessmentResult.data || [];

      if (results.length > 0) {
        setAssessmentTaken(true);
        
        const scoreMap = new Map<string, number>();
        results.forEach(r => { 
          if (!scoreMap.has(r.virtue_name)) {
            scoreMap.set(r.virtue_name, r.priority_score); 
          }
        });
        
        const virtueDefectCounts = new Map<string, number>();
        defects.forEach(defect => {
          defect.virtues.forEach(virtueName => {
            virtueDefectCounts.set(virtueName, (virtueDefectCounts.get(virtueName) || 0) + 1);
          });
        });

        const sortedVirtues = baseVirtues
            .map(v => {
              const priorityScore = scoreMap.get(v.name) || 0;
              const defectCount = virtueDefectCounts.get(v.name) || 0;
              const maxPossiblePriority = defectCount * 25; // Max rating 5 * (Max harm 4 + 1) = 25
              const defectIntensity = maxPossiblePriority > 0 ? (priorityScore / maxPossiblePriority) * 10 : 0;
              const finalVirtueScore = Math.max(0, Math.min(10, 10 - defectIntensity));
              return { ...v, virtue_score: finalVirtueScore };
            })
            .sort((a, b) => (a.virtue_score || 0) - (b.virtue_score || 0));
        
        setVirtues(sortedVirtues);
      } else {
        setAssessmentTaken(false);
        setVirtues(baseVirtues);
      }
    } catch (error) {
      if (error instanceof Error) alert(error.message);
    } finally {
      setLoading(false);
    }
  }, []); 

  useEffect(() => {
    getDashboardData();
    const handleFocus = () => getDashboardData();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [getDashboardData]);

  const handleCloseModal = () => {
    const welcomeKey = 'welcome-modal-seen';
    localStorage.setItem(welcomeKey, 'true');
    setShowWelcomeModal(false);

  }

  const getStatusClasses = (virtueId: number, stage: number): string => {
    const status = progress.get(`${virtueId}-${stage}`);
    switch (status) {
        case 'in_progress': return 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200';
        case 'completed': return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200';
        default: return 'bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200';
    }
  };

  const calculateDaysSince = (dateString: string | null): number | null => {
      if (!dateString) return null;
      const lastDate = new Date(dateString);
      const today = new Date();
      lastDate.setHours(0,0,0,0);
      today.setHours(0,0,0,0);
      const differenceInTime = today.getTime() - lastDate.getTime();
      return Math.floor(differenceInTime / (1000 * 3600 * 24));
  }
  
  const VirtueRow = ({ virtue }: { virtue: Virtue }) => (
    <li className="flex flex-col md:flex-row items-start md:items-center gap-4 p-4 border border-stone-200/60 rounded-lg bg-white/80 backdrop-blur-sm shadow-gentle transition-mindful hover:shadow-lg">
      {assessmentTaken && (
        <div className="flex-shrink-0 flex items-center gap-4 w-full md:w-auto">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg className="w-full h-full" viewBox="0 0 36 36"><path className="text-stone-200" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2" /><path className="text-amber-600" strokeDasharray={`${(virtue.virtue_score || 0) * 10}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2" /></svg>
            <span className="absolute text-xl font-semibold text-stone-700">{(virtue.virtue_score || 0).toFixed(1)}</span>
          </div>
          <div className="md:hidden flex-grow"><h3 className="font-semibold text-lg text-stone-800">{virtue.name}</h3></div>
        </div>
      )}
      <div className="flex-grow w-full">
          <h3 className="hidden md:block font-semibold text-lg text-stone-800">{virtue.name}</h3>
          <p className="text-stone-600 text-sm mb-3">{virtue.short_description || virtue.description}</p>
          <div className="flex flex-wrap gap-2">
            <Link href={{ pathname: `/virtue/${virtue.id}`, query: { stage: 1 } }}><Button size="sm" variant="outline" className={getStatusClasses(virtue.id, 1)}>Stage 1: Dismantling</Button></Link>
            <Link href={{ pathname: `/virtue/${virtue.id}`, query: { stage: 2 } }}><Button size="sm" variant="outline" className={getStatusClasses(virtue.id, 2)}>Stage 2: Building</Button></Link>
            <Link href={{ pathname: `/virtue/${virtue.id}`, query: { stage: 3 } }}><Button size="sm" variant="outline" className={getStatusClasses(virtue.id, 3)}>Stage 3: Maintaining</Button></Link>
          </div>
      </div>
    </li>
  );
  
  const ActionCards = () => {
    const daysSinceJournal = calculateDaysSince(lastJournalEntry);
    return (
        <div className="space-y-6">
            <Card className="order-first bg-white/80 backdrop-blur-sm border-stone-200/60 shadow-gentle">
                <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                    <BookOpen className="h-8 w-8 text-amber-700" />
                    <div><CardTitle className="text-stone-800 font-medium">Assessment</CardTitle></div>
                </CardHeader>
                <CardContent>
                  {assessmentTaken && virtues.length > 0 ? (
                    <>
                      <Link href="/assessment" className="cursor-pointer block p-2">
                        <VirtueRoseChart 
                          data={virtues.map(v => ({
                            virtue: v.name,
                            score: v.virtue_score || 0
                          }))}
                          size="thumbnail"
                          showLabels={false}
                        />
                      </Link>
                      <div className="px-6 pb-4 pt-0 text-center">
                        <p className="text-sm text-stone-600 mb-2">Click chart for details or to retake.</p>
                        <Link href="/assessment"><Button size="sm" variant="outline">Retake Assessment</Button></Link>
                      </div>
                    </>
                  ) : (
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-3 text-amber-700">
                        <Sparkles size={18} />
                        <p className="text-sm font-medium">Discover your Virtue Rose</p>
                      </div>
                      <p className="text-sm text-stone-600 mb-3">Take the assessment to visualize your virtue strengths and areas for growth.</p>
                      <Link href="/assessment"><Button size="sm" variant="outline">Take Assessment</Button></Link>
                    </div>
                  )}
                </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-stone-200/60 shadow-gentle">
                <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                    <UserCheck className="h-8 w-8 text-amber-700" />
                    <div><CardTitle className="text-stone-800 font-medium">Sponsor Connection</CardTitle></div>
                </CardHeader>
                <CardContent>
                    {connection ? (
                        <div>
                            <p className="text-sm text-stone-600">Connected with:</p>
                            <p className="font-semibold text-stone-800">{connection.sponsor_name || 'Your Sponsor'}</p>
                            <p className={`text-sm font-medium capitalize ${connection.status === 'active' ? 'text-green-600' : 'text-amber-600'}`}>{connection.status}</p>
                        </div>
                    ) : (
                        <div>
                            <p className="text-sm text-stone-600 mb-2">You have not connected with a sponsor yet.</p>
                            <Link href="/account-settings"><Button size="sm" variant="outline">Invite a Sponsor</Button></Link>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-stone-200/60 shadow-gentle">
                <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                    <Edit className="h-8 w-8 text-amber-700" />
                    <div><CardTitle className="text-stone-800 font-medium">Journal</CardTitle></div>
                </CardHeader>
                <CardContent>
                    {daysSinceJournal !== null ? (
                         <p className="text-sm text-stone-600 mb-2">
                           Your last entry was <span className="font-bold text-stone-800">{daysSinceJournal === 0 ? 'today' : `${daysSinceJournal} day${daysSinceJournal > 1 ? 's' : ''} ago`}</span>.
                         </p>
                    ) : (
                        <p className="text-sm text-stone-600 mb-2">Start your journey with your first journal entry.</p>
                    )}
                    <Link href="/journal"><Button size="sm" variant="outline">Go to Journal</Button></Link>
                </CardContent>
            </Card>
        </div>
    )
  };

  const ProgressLegend = () => (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-600 bg-stone-100/60 backdrop-blur-sm p-2 rounded-md border border-stone-200/60">
      <strong>Legend:</strong>
      <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-stone-200 border border-stone-300"></div><span>Not Started</span></div>
      <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-amber-200 border border-amber-300"></div><span>In Progress</span></div>
      <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-green-200 border border-green-300"></div><span>Completed</span></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-amber-100 relative">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgb(120,113,108)_1px,_transparent_0)] bg-[length:32px_32px]"></div>
      </div>
      
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-50/60 to-stone-100/80"></div>
      
      <div className="relative z-10">
        <AppHeader />
        <WelcomeModal isOpen={showWelcomeModal} onClose={handleCloseModal} />

        <main className="container mx-auto p-4 md:p-8">
        {loading ? (
          <div className="text-center">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-stone-300/60 rounded-lg w-64 mx-auto"></div>
              <div className="h-4 bg-amber-200/60 rounded-lg w-48 mx-auto"></div>
            </div>
            <p className="text-stone-600 font-light mt-4">Loading dashboard...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-4">
               
                <div className="space-y-3 p-4 bg-white/80 backdrop-blur-sm rounded-lg border border-stone-200/60 shadow-gentle">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-light text-stone-800">
                        Your Prioritized Virtues
                      </h2>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowWelcomeModal(true)}
                        className="border-amber-200 text-amber-700 hover:bg-amber-50 transition-mindful"
                      >
                        <HelpCircle className="h-4 w-4 mr-2" />
                        Guide
                      </Button>
                    </div>
                    <div className="flex justify-end">
                      <ProgressLegend />
                    </div>
                </div>

                <ul className="space-y-4">
                  {virtues.map((virtue) => <VirtueRow key={virtue.id} virtue={virtue} />)}
                </ul>
            </div>
            <div className="lg:col-span-1 lg:sticky lg:top-24">
                <ActionCards />
            </div>
          </div>
        )}
        </main>
        <Footer />
      </div>
    </div>
  )
}