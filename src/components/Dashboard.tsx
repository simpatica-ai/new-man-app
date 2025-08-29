'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Session } from '@supabase/supabase-js'
import { Button } from './ui/button'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'

// --- TYPE DEFINITIONS ---
type Virtue = {
  id: number;
  name: string;
  description: string;
  short_description: string | null;
  defect_intensity_score?: number;
  progress?: StageProgress[]; 
};

type Connection = {
    id: number;
    status: 'pending' | 'active';
    practitioner: {
        full_name: string | null;
        id: string;
    }
};

type StageProgress = {
    virtue_id: number;
    stage_number: number;
    status: 'not_started' | 'in_progress' | 'completed';
};

// --- DEFECTS DATA (RESTORED) ---
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
  const [virtues, setVirtues] = useState<Virtue[]>([]);
  const [invitations, setInvitations] = useState<Connection[]>([]);
  const [activeSponsorships, setActiveSponsorships] = useState<Connection[]>([]);
  const [assessmentTaken, setAssessmentTaken] = useState(false);
  const stageTitles = ["Starting", "Building", "Maintaining"];

  const getDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const virtuesPromise = supabase.from('virtues').select(`id, name, description, short_description`).order('id');
      const invitesPromise = supabase.rpc('get_pending_invitations_for_sponsor', { sponsor_id_param: user.id });
      const activeSponsorshipsPromise = supabase.rpc('get_active_sponsorships_for_sponsor', { sponsor_id_param: user.id });
      const assessmentPromise = supabase.from('user_assessment_results').select('virtue_name, priority_score').eq('user_id', user.id).order('assessment_id', { ascending: false });
      const progressPromise = supabase.from('user_virtue_stage_progress').select('virtue_id, stage_number, status').eq('user_id', user.id);

      const [virtuesResult, invitesResult, activeSponsorshipsResult, assessmentResult, progressResult] = await Promise.all([
          virtuesPromise, invitesPromise, activeSponsorshipsPromise, assessmentPromise, progressPromise
      ]);

      if (invitesResult.error) throw invitesResult.error;
      setInvitations(invitesResult.data || []);
      if (activeSponsorshipsResult.error) throw activeSponsorshipsResult.error;
      const activeConns = activeSponsorshipsResult.data || [];
      setActiveSponsorships(activeConns);
      setIsSponsor(activeConns.length > 0);

      if (virtuesResult.error) throw virtuesResult.error;
      const baseVirtues = virtuesResult.data || [];
      if (assessmentResult.error) throw assessmentResult.error;
      const results = assessmentResult.data || [];
      if (progressResult.error) throw progressResult.error;
      const progressData = progressResult.data || [];

      const progressMap = new Map<string, StageProgress>();
      progressData.forEach(p => {
          progressMap.set(`${p.virtue_id}-${p.stage_number}`, p);
      });

      if (results.length > 0) {
        setAssessmentTaken(true);
        const scoreMap = new Map<string, number>();
        results.forEach(r => scoreMap.set(r.virtue_name, r.priority_score));
        
        const maxScores = new Map<string, number>();
        defects.forEach(defect => {
            defect.virtues.forEach(virtue => {
                maxScores.set(virtue, (maxScores.get(virtue) || 0) + 25);
            });
        });

        const sortedVirtues = baseVirtues
            .map(v => {
                const actualScore = scoreMap.get(v.name) || 0;
                const maxScore = maxScores.get(v.name) || 1;
                const intensity = (actualScore / maxScore) * 10;
                const virtueProgress = [1, 2, 3].map(stageNum => 
                    progressMap.get(`${v.id}-${stageNum}`) || { virtue_id: v.id, stage_number: stageNum, status: 'not_started' }
                );
                return { ...v, defect_intensity_score: parseFloat(intensity.toFixed(1)), progress: virtueProgress };
            })
            .sort((a, b) => (b.defect_intensity_score || 0) - (a.defect_intensity_score || 0));
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
          const { error } = await supabase.from('sponsor_connections').update({ status: 'active' }).eq('id', connectionId);
          if (error) throw error;
          alert('Connection accepted!');
          getDashboardData();
      } catch (error) {
          if (error instanceof Error) alert(error.message);
      }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };
  
  const getBarColor = (score: number) => {
      if (score > 7.5) return 'bg-red-500';
      if (score > 5) return 'bg-orange-400';
      if (score > 2.5) return 'bg-yellow-400';
      return 'bg-green-500';
  };

  const getButtonVariant = (status: string): "default" | "secondary" | "outline" => {
      if (status === 'completed') return 'default';
      if (status === 'in_progress') return 'secondary';
      return 'outline';
  };

  const SponsorDashboard = () => (
    <Card>
        <CardHeader>
            <CardTitle>Sponsor Hub</CardTitle>
            <CardDescription>Review invitations and access your practitioners&apos; journals.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            {invitations.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2 text-blue-800">Pending Invitations</h3>
                  <ul className="space-y-2">
                      {invitations.map(invite => (
                          <li key={invite.id} className="flex justify-between items-center p-2 border rounded-md bg-white">
                              <span>Invitation from: <strong>{invite.practitioner?.full_name || 'A new practitioner'}</strong></span>
                              <Button size="sm" onClick={() => handleAcceptInvite(invite.id)}>Accept</Button>
                          </li>
                      ))}
                  </ul>
                </div>
            )}
             {activeSponsorships.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Actively Sponsoring</h3>
                  <ul className="space-y-2">
                      {activeSponsorships.map(conn => (
                          <li key={conn.id} className="flex justify-between items-center p-2 border rounded-md bg-white">
                              <span><strong>{conn.practitioner?.full_name || 'Practitioner'}</strong></span>
                              <Link href={`/sponsor/journal/${conn.practitioner.id}`}>
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
      {!assessmentTaken ? (
        <Card className="bg-gray-50 text-center">
            <CardHeader>
              <CardTitle>Begin Your Journey</CardTitle>
              <CardDescription>
                Start by taking the Character Defects Inventory. This will create a personalized path for your virtue practice.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/assessment">
                <Button>Take the Assessment</Button>
              </Link>
            </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Your Prioritized Virtues</h2>
                <Link href="/assessment">
                    <Button variant="outline" size="sm">Retake Assessment</Button>
                </Link>
            </div>
          {virtues.map((virtue) => (
            <Card key={virtue.id} className="bg-white">
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-grow">
                            <h3 className="font-bold text-lg text-slate-900">{virtue.name}</h3>
                            <p className="text-sm text-slate-600 mt-1 mb-3">{virtue.short_description || virtue.description}</p>
                            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                <span>Defect Intensity: {virtue.defect_intensity_score} / 10</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2.5 mt-2">
                                <div className={`${getBarColor(virtue.defect_intensity_score || 0)} h-2.5 rounded-full`} style={{ width: `${(virtue.defect_intensity_score || 0) * 10}%` }}></div>
                            </div>
                        </div>
                        <div className="flex-shrink-0 mt-4 md:mt-0 flex flex-col items-start gap-2">
                           <h4 className="font-semibold text-sm text-slate-600">Journaling</h4>
                            {virtue.progress?.map(p => (
                                <Button key={p.stage_number} variant={getButtonVariant(p.status)} size="sm" className="w-full justify-start">
                                    Stage {p.stage_number} - {stageTitles[p.stage_number - 1]}
                                </Button>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-gray-600">Signed in as: {session.user.email}</p>
        </div>
        <div className="flex items-center space-x-2">
          {!isSponsor && (
            <Link href="/sponsor"><Button variant="outline">Manage Sponsor</Button></Link>
          )}
          <Button onClick={handleSignOut} variant="outline">Sign Out</Button>
        </div>
      </div>
      
      {loading ? (
        <p>Loading dashboard...</p>
      ) : isSponsor ? (
        <SponsorDashboard />
      ) : (
        <PractitionerDashboard />
      )}
    </div>
  )
}
