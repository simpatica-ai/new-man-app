'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Session } from '@supabase/supabase-js'
import { Button } from './ui/button'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { FileText, MessageSquare, ArrowRight } from 'lucide-react'

// --- TYPE DEFINITIONS ---
type StageProgress = {
  virtue_id: number;
  stage_number: number;
  status: 'not_started' | 'in_progress' | 'completed';
}

type Virtue = {
  id: number;
  name: string;
  description: string;
  short_description: string | null;
  priority_score?: number;
  defect_intensity?: number;
};

type Connection = {
    id: number;
    status: 'pending' | 'active';
    practitioner_name: string | null;
    practitioner_id: string;
}

type PractitionerAlert = {
  practitioner_id: string;
  practitioner_name: string;
  has_unread_memos: boolean;
  has_unread_chats: boolean;
}

// --- DATA for calculation ---
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
    { name: "Cowardice", virtues: ["Vulnerability", "Courage"] },
    { name: "Cruelty", virtues: ["Compassion", "Respect"] },
    { name: "Deceit", virtues: ["Honesty", "Integrity"] },
    { name: "Defensiveness", virtues: ["Humility", "Vulnerability"] },
    { name: "Dishonesty", virtues: ["Honesty", "Integrity"] },
    { name: "Disrespect", virtues: ["Respect", "Compassion"] },
    { name: "Distrust", virtues: ["Vulnerability", "Honesty"] },
    { name: "Egotism", virtues: ["Humility", "Respect"] },
    { name: "Envy", virtues: ["Gratitude", "Contentment"] },
    { name: "Fearfulness", virtues: ["Vulnerability", "Courage"] },
    { name: "Greed", virtues: ["Gratitude", "Generosity"] },
    { name: "Haughtiness", virtues: ["Humility", "Respect"] },
    { name: "Hypocrisy", virtues: ["Honesty", "Integrity"] },
    { name: "Impatience", virtues: ["Patience", "Mindfulness"] },
    { name: "Impulsiveness", virtues: ["Self-Control", "Mindfulness"] },
    { name: "Indifference", virtues: ["Compassion", "Responsibility"] },
    { name: "Ingratitude", virtues: ["Gratitude"] },
    { name: "Infidelity", virtues: ["Honesty", "Integrity", "Respect"] },
    { name: "Intolerance", virtues: ["Respect", "Compassion"] },
    { name: "Irresponsibility", virtues: ["Responsibility"] },
    { name: "Jealousy", virtues: ["Gratitude", "Contentment"] },
    { name: "Judgmental attitude", virtues: ["Compassion", "Respect"] },
    { name: "Lack of empathy", virtues: ["Compassion"] },
    { name: "Lack of gratitude", virtues: ["Gratitude"] },
    { name: "Lack of self-control", virtues: ["Self-Control", "Mindfulness"] },
    { name: "Laziness", virtues: ["Responsibility", "Effort"] },
    { name: "Lying", virtues: ["Honesty", "Integrity"] },
    { name: "Manipulation", virtues: ["Honesty", "Respect", "Integrity"] },
    { name: "Narcissism", virtues: ["Humility", "Compassion"] },
    { name: "Neglect", virtues: ["Responsibility", "Compassion"] },
    { name: "Objectification", virtues: ["Respect", "Compassion"] },
    { name: "Pride", virtues: ["Humility", "Respect"] },
    { name: "Procrastination", virtues: ["Responsibility", "Effort"] },
    { name: "Recklessness", virtues: ["Self-Control", "Mindfulness"] },
    { name: "Resentment", virtues: ["Gratitude", "Compassion"] },
    { name: "Rudeness", virtues: ["Respect", "Compassion"] },
    { name: "Self-centeredness", virtues: ["Humility", "Compassion"] },
    { name: "Self-righteousness", virtues: ["Humility", "Respect"] },
    { name: "Selfishness", virtues: ["Compassion", "Generosity"] },
    { name: "Stealing", virtues: ["Honesty", "Integrity"] },
    { name: "Stubbornness", virtues: ["Humility", "Openness"] },
    { name: "Superiority", virtues: ["Humility", "Respect"] },
    { name: "Suspicion", virtues: ["Vulnerability", "Trust"] },
    { name: "Unreliability", virtues: ["Responsibility", "Integrity"] },
    { name: "Vindictiveness", virtues: ["Compassion", "Forgiveness"] },
    { name: "Withdrawn behavior", virtues: ["Vulnerability", "Connection"] } 
];

// --- DASHBOARD COMPONENT ---
export default function Dashboard({ session }: { session: Session }) {
  const [loading, setLoading] = useState(true);
  const [isSponsor, setIsSponsor] = useState(false);
  const [hasSponsorConnection, setHasSponsorConnection] = useState(false);
  
  // State for Practitioner View
  const [virtues, setVirtues] = useState<Virtue[]>([]);
  const [assessmentTaken, setAssessmentTaken] = useState(false);
  const [progress, setProgress] = useState<Map<string, StageProgress['status']>>(new Map());

  // State for Sponsor View
  const [invitations, setInvitations] = useState<Connection[]>([]);
  const [practitionerAlerts, setPractitionerAlerts] = useState<PractitionerAlert[]>([]);

  const getDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const invitesPromise = supabase.rpc('get_pending_invitations_for_sponsor', { sponsor_id_param: user.id });
      const practitionerConnectionPromise = supabase.from('sponsor_connections').select('id').eq('practitioner_user_id', user.id).in('status', ['pending', 'active']).maybeSingle();
      
      const [invitesResult, practitionerConnectionResult] = await Promise.all([invitesPromise, practitionerConnectionPromise]);

      if (invitesResult.error) throw invitesResult.error;
      setInvitations(invitesResult.data || []);
      
      if (practitionerConnectionResult.error) throw practitionerConnectionResult.error;
      setHasSponsorConnection(!!practitionerConnectionResult.data);

      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      const userIsSponsor = profile?.role === 'sponsor' || (invitesResult.data && invitesResult.data.length > 0);
      setIsSponsor(userIsSponsor);

      if (userIsSponsor) {
        const { data: alerts, error: alertsError } = await supabase.rpc('get_sponsor_practitioner_alerts', { sponsor_id_param: user.id });
        if (alertsError) throw alertsError;
        setPractitionerAlerts(alerts || []);
      }
      
      const virtuesPromise = supabase.from('virtues').select(`id, name, description, short_description`).order('id');
      const assessmentPromise = supabase.from('user_assessment_results').select('virtue_name, priority_score').eq('user_id', user.id).order('assessment_id', { ascending: false });
      const progressPromise = supabase.from('user_virtue_stage_progress').select('virtue_id, stage_number, status').eq('user_id', user.id);
      
      const [virtuesResult, assessmentResult, progressResult] = await Promise.all([virtuesPromise, assessmentPromise, progressPromise]);
      
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
        const maxPossibleScores = new Map<string, number>();
        baseVirtues.forEach(virtue => {
            const relevantDefects = defects.filter(d => d.virtues.includes(virtue.name));
            maxPossibleScores.set(virtue.name, relevantDefects.length * 25);
        });
        const sortedVirtues = baseVirtues
            .map(v => ({ ...v, priority_score: scoreMap.get(v.name) || 0, defect_intensity: ((scoreMap.get(v.name) || 0) / (maxPossibleScores.get(v.name) || 1)) * 10 }))
            .sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0));
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
  }, [getDashboardData]);

  const handleAcceptInvite = async (connectionId: number) => {
      try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const { error: connectionError } = await supabase
            .from('sponsor_connections')
            .update({ status: 'active' })
            .eq('id', connectionId);

          if (connectionError) throw connectionError;

          const { error: profileError } = await supabase
            .from('profiles')
            .update({ role: 'sponsor' })
            .eq('id', user.id);
          
          if (profileError) throw profileError;

          alert('Connection accepted!');
          getDashboardData();
      } catch (error) {
          if (error instanceof Error) alert(error.message);
      }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const getStatusIndicatorClass = (virtueId: number, stage: number): string => {
    const status = progress.get(`${virtueId}-${stage}`);
    switch (status) {
        case 'in_progress': return 'text-yellow-500';
        case 'completed': return 'text-green-500';
        default: return 'text-gray-400';
    }
  };

  const SponsorDashboard = () => (
    <Card className="mb-8">
        <CardHeader>
            <CardTitle>Sponsor Hub</CardTitle>
            {/* ## FIX: Replaced ' with &apos; */}
            <CardDescription>Review invitations and access your practitioners&apos; journals.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            {invitations.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2 text-blue-800">Pending Invitations</h3>
                  <ul className="space-y-2">
                      {invitations.map(invite => (
                          <li key={invite.id} className="flex justify-between items-center p-2 border rounded-md bg-white">
                              <span>Invitation from: <strong>{invite.practitioner_name || 'A new practitioner'}</strong></span>
                              <Button size="sm" onClick={() => handleAcceptInvite(invite.id)}>Accept</Button>
                          </li>
                      ))}
                  </ul>
                </div>
            )}
            {practitionerAlerts.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Actively Sponsoring</h3>
                  <ul className="space-y-2">
                      {practitionerAlerts.map(p => (
                          <li key={p.practitioner_id} className="flex justify-between items-center p-2 border rounded-md bg-white">
                              <div className="flex items-center gap-4">
                                <span><strong>{p.practitioner_name || 'Practitioner'}</strong></span>
                                <div className="flex items-center gap-2">
                                  {p.has_unread_memos && <FileText className="h-5 w-5 text-green-600" title="Unread Memos" />}
                                  {p.has_unread_chats && <MessageSquare className="h-5 w-5 text-blue-600" title="Unread Chats" />}
                                </div>
                              </div>
                              <Link href={`/sponsor/journal/${p.practitioner_id}`}>
                                <Button size="sm" variant="outline">View Journal</Button>
                              </Link>
                          </li>
                      ))}
                  </ul>
                </div>
            )}
        </CardContent>
    </Card>
  );

  const PractitionerDashboard = () => (
    <div className="space-y-8">
        {!assessmentTaken && (
            <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <h3 className="font-semibold text-lg text-blue-900">Personalize Your Journey</h3>
                        <p className="text-blue-800">Take the Character Defects Inventory to prioritize your virtues based on your unique needs.</p>
                    </div>
                    <Link href="/assessment">
                        <Button className="bg-blue-600 hover:bg-blue-700 flex-shrink-0">
                            Take the Assessment <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        )}
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">
                    {assessmentTaken ? "Your Prioritized Virtues" : "Virtues for Practice"}
                </h2>
                {assessmentTaken && (
                    <Link href="/assessment">
                        <Button variant="outline" size="sm">Retake Assessment</Button>
                    </Link>
                )}
            </div>
          {virtues.map((virtue) => (
            <Card key={virtue.id} className="bg-white">
                <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-grow md:w-2/3">
                        <h3 className="font-bold text-lg text-brand-header">{virtue.name}</h3>
                        <p className="text-brand-text text-sm mb-2">{virtue.short_description || virtue.description}</p>
                        {assessmentTaken && (
                            <>
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    <span>Defect Intensity: {(virtue.defect_intensity || 0).toFixed(1)} / 10</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                                    <div className={`h-2.5 rounded-full ${
                                        (virtue.defect_intensity || 0) > 7.5 ? 'bg-red-600' :
                                        (virtue.defect_intensity || 0) > 5 ? 'bg-orange-500' :
                                        (virtue.defect_intensity || 0) > 2.5 ? 'bg-yellow-400' : 'bg-green-500'
                                    }`} style={{ width: `${(virtue.defect_intensity || 0) * 10}%` }}></div>
                                </div>
                            </>
                        )}
                    </div>
                    <div className="flex-shrink-0 md:w-1/3">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button className="w-full">Begin Virtue Work</Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56">
                                <DropdownMenuItem asChild>
                                    <Link href={`/journal/${virtue.id}?stage=1`} className="flex items-center gap-2">
                                        <span className={`text-lg ${getStatusIndicatorClass(virtue.id, 1)}`}>●</span>
                                        <span>Stage 1 - Dismantling</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                     <Link href={`/journal/${virtue.id}?stage=2`} className="flex items-center gap-2">
                                        <span className={`text-lg ${getStatusIndicatorClass(virtue.id, 2)}`}>●</span>
                                        <span>Stage 2 - Building</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                     <Link href={`/journal/${virtue.id}?stage=3`} className="flex items-center gap-2">
                                        <span className={`text-lg ${getStatusIndicatorClass(virtue.id, 3)}`}>●</span>
                                        <span>Stage 3 - Maintaining</span>
                                    </Link>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardContent>
            </Card>
          ))}
        </div>
    </div>
  );
  
  // This logic determines if the user is a "pure sponsor"
  // (i.e., they are a sponsor but not also a practitioner).
  const isPureSponsor = isSponsor && !hasSponsorConnection;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-gray-600">Signed in as: {session.user.email}</p>
        </div>
        <div className="flex items-center space-x-2">
          {!isSponsor && (
            <Link href="/manage-sponsor">
              <Button variant="outline">
                {hasSponsorConnection ? 'Manage Sponsor' : 'Add Sponsor'}
              </Button>
            </Link>
          )}
          {/* ## ADDED GET SUPPORT BUTTON HERE ## */}
          <Link href="/get-support"><Button variant="outline">Get Support</Button></Link>
          <Link href="/account-settings"><Button variant="outline">Settings</Button></Link>
          <Button onClick={handleSignOut} variant="outline">Sign Out</Button>
        </div>
      </div>

      {loading ? (
        <p>Loading dashboard...</p>
      ) : (
        <>
          {/* Always show Sponsor Hub if the user has any sponsor-related tasks */}
          {(isSponsor || invitations.length > 0) && <SponsorDashboard />}
          
          {/* Only show the Practitioner dashboard if the user is NOT a "pure sponsor" */}
          {!isPureSponsor && <PractitionerDashboard />}
        </>
      )}
    </div>
  )
}

