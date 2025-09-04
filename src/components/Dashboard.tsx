'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Session } from '@supabase/supabase-js'
import { Button } from './ui/button'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { UserCheck, BookOpen, Edit } from 'lucide-react'
import AppHeader from './AppHeader'

// --- TYPE DEFINITIONS ---
type Profile = { full_name: string | null; }
type StageProgress = { virtue_id: number; stage_number: number; status: 'not_started' | 'in_progress' | 'completed'; }
// ## FIX: Added virtue_score to the Virtue type ##
type Virtue = { id: number; name: string; description: string; short_description: string | null; virtue_score?: number; };
type Connection = { id: number; status: 'pending' | 'active'; sponsor_name: string | null; }

// --- DASHBOARD COMPONENT ---
export default function Dashboard({ session }: { session: Session }) {
  const [loading, setLoading] = useState(true);
  const [connection, setConnection] = useState<Connection | null>(null);
  const [virtues, setVirtues] = useState<Virtue[]>([]);
  const [assessmentTaken, setAssessmentTaken] = useState(false);
  const [progress, setProgress] = useState<Map<string, StageProgress['status']>>(new Map());
  const [lastJournalEntry, setLastJournalEntry] = useState<string | null>(null);

  useEffect(() => { document.title = "New Man: Dashboard"; }, []);

  // ## FIX: Dependency array is now empty for stability, ensuring focus listener always refetches correctly ##
  const getDashboardData = useCallback(async () => {
    try {
      setLoading(true); 
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const connectionPromise = supabase.rpc('get_practitioner_connection_details', { practitioner_id_param: user.id });
      const virtuesPromise = supabase.from('virtues').select('id, name, description, short_description').order('id');
      const assessmentPromise = supabase.from('user_assessment_results').select('virtue_name, priority_score').eq('user_id', user.id).order('assessment_id', { ascending: false });
      const progressPromise = supabase.from('user_virtue_stage_progress').select('virtue_id, stage_number, status').eq('user_id', user.id);
      const journalPromise = supabase.from('journal_entries').select('created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1);

      const [connectionResult, virtuesResult, assessmentResult, progressResult, journalResult] = await Promise.all([
        connectionPromise, virtuesPromise, assessmentPromise, progressPromise, journalPromise
      ]);
      
      if (connectionResult.error) throw connectionResult.error;
      setConnection(connectionResult.data?.[0] || null);
      
      if (journalResult.data && journalResult.data.length > 0) {
        setLastJournalEntry(journalResult.data[0].created_at);
      } else if (journalResult.error && journalResult.error.code !== 'PGRST116') {
        throw journalResult.error;
      }

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
        results.forEach(r => { scoreMap.set(r.virtue_name, r.priority_score); });
        
        // ## FIX: Invert score (10 - defect score) and sort by lowest virtue score first ##
        const sortedVirtues = baseVirtues
            .map(v => ({ ...v, virtue_score: 10 - (scoreMap.get(v.name) || 0) }))
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
    <li className="flex flex-col md:flex-row items-start md:items-center gap-4 p-4 border rounded-lg bg-white shadow-sm">
      {/* ## FIX: Score circle is now only shown if assessment has been taken ## */}
      {assessmentTaken && (
        <div className="flex-shrink-0 flex items-center gap-4 w-full md:w-auto">
          <div className="relative w-16 h-16 flex items-center justify-center">
            {/* ## FIX: SVG now uses virtue_score ## */}
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
            <Link href={{ pathname: `/virtue/${virtue.id}`, query: { stage: 1 } }}><Button size="sm" variant="outline" className={getStatusClasses(virtue.id, 1)}>Stage 1</Button></Link>
            <Link href={{ pathname: `/virtue/${virtue.id}`, query: { stage: 2 } }}><Button size="sm" variant="outline" className={getStatusClasses(virtue.id, 2)}>Stage 2</Button></Link>
            <Link href={{ pathname: `/virtue/${virtue.id}`, query: { stage: 3 } }}><Button size="sm" variant="outline" className={getStatusClasses(virtue.id, 3)}>Stage 3</Button></Link>
          </div>
      </div>
    </li>
  );
  
  const ActionCards = () => {
    const daysSinceJournal = calculateDaysSince(lastJournalEntry);
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                    <UserCheck className="h-8 w-8 text-amber-700" />
                    <div><CardTitle className="text-stone-800">Sponsor Connection</CardTitle></div>
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

            <Card>
                <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                    <BookOpen className="h-8 w-8 text-amber-700" />
                    <div><CardTitle className="text-stone-800">Assessment</CardTitle></div>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-stone-600 mb-2">{assessmentTaken ? 'Your virtues are prioritized. You can retake the assessment anytime.' : 'Take the assessment to prioritize your virtues.'}</p>
                    <Link href="/assessment"><Button size="sm" variant="outline">{assessmentTaken ? 'Retake Assessment' : 'Take Assessment'}</Button></Link>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                    <Edit className="h-8 w-8 text-amber-700" />
                    <div><CardTitle className="text-stone-800">Journal</CardTitle></div>
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
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-600 bg-stone-100 p-2 rounded-md">
      <strong>Legend:</strong>
      <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-stone-200 border border-stone-300"></div><span>Not Started</span></div>
      <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-amber-200 border border-amber-300"></div><span>In Progress</span></div>
      <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-green-200 border border-green-300"></div><span>Completed</span></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50">
      <AppHeader />

      <main className="container mx-auto p-4 md:p-8">
        {loading ? (
          <p className="text-center text-stone-500">Loading dashboard...</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-4">
               <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 p-3 bg-white rounded-lg border">
                  <h2 className="text-2xl font-light text-stone-800">
                    {assessmentTaken ? "Your Prioritized Virtues" : "Virtues for Practice"}
                  </h2>
                  <ProgressLegend />
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
    </div>
  )
}
