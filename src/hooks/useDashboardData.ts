'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Virtue, Connection, StageProgress } from '@/lib/constants'



export function useDashboardData() {
  const [loading, setLoading] = useState(true);
  const [connection, setConnection] = useState<Connection | null>(null);
  const [virtues, setVirtues] = useState<Virtue[]>([]);
  const [assessmentTaken, setAssessmentTaken] = useState(false);
  const [assessmentResults, setAssessmentResults] = useState<Array<{virtue: string, score: number}> | null>(null);
  const [progress, setProgress] = useState<Map<string, StageProgress['status']>>(new Map());
  const [lastJournalEntry, setLastJournalEntry] = useState<string | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [buttonStates, setButtonStates] = useState<{[key: string]: boolean}>({});

  const getDashboardData = useCallback(async () => {
    try {
      setLoading(true); 
      
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current user:', user);
      console.log('Email confirmed at:', user?.email_confirmed_at);
      if (!user) {
        console.log('No user found, returning early');
        return;
      }

      // Check if email is confirmed (we handle this manually)
      if (!user.email_confirmed_at) {
        console.log('Email not confirmed, user should not access dashboard');
        return;
      }
      
      const profilePromise = supabase.from('profiles').select('full_name, has_completed_first_assessment').eq('id', user.id).single();
      const virtuesPromise = supabase.from('virtues').select('id, name, description, short_description').order('id');
      const journalPromise = supabase.from('journal_entries').select('created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1);
      const progressPromise = supabase.from('user_virtue_stage_progress').select('virtue_id, stage_number, status').eq('user_id', user.id);

      // Handle connection RPC separately with error handling
      let connectionResult = { data: null, error: null };
      try {
        connectionResult = await supabase.rpc('get_practitioner_connection_details', { practitioner_id_param: user.id });
      } catch (err) {
        console.warn('Connection RPC failed, continuing without connection data:', err);
      }

      const [profileResult, virtuesResult, journalResult, progressResult] = await Promise.all([
        profilePromise, virtuesPromise, journalPromise, progressPromise
      ]);

      console.log('Profile result:', profileResult);
      console.log('Virtues result:', virtuesResult);
      console.log('Virtues error:', virtuesResult.error);
      console.log('Virtues data length:', virtuesResult.data?.length);

      if (profileResult.error) throw profileResult.error;
      if (virtuesResult.error) throw virtuesResult.error;

      const profile = profileResult.data;
      const hasCompletedAssessment = profile?.has_completed_first_assessment || false;
      setAssessmentTaken(hasCompletedAssessment);
      console.log('Assessment taken:', hasCompletedAssessment);

      // If assessment is completed, fetch the latest results
      if (hasCompletedAssessment) {
        console.log('Fetching assessment results...');
        const { data: assessments, error: assessmentError } = await supabase
          .from('user_assessments')
          .select(`
            id,
            user_assessment_results (
              virtue_name,
              defect_intensity
            )
          `)
          .eq('user_id', user.id)
          .eq('assessment_type', 'virtue')
          .order('created_at', { ascending: false })
          .limit(1);

        console.log('Assessment query result:', assessments);
        console.log('Assessment error:', assessmentError);

        if (assessments && assessments.length > 0) {
          const latestAssessment = assessments[0];
          if (latestAssessment?.user_assessment_results && latestAssessment.user_assessment_results.length > 0) {
            const results = latestAssessment.user_assessment_results.map((result: { virtue_name: string; defect_intensity: number }) => ({
              virtue: result.virtue_name === 'Healthy Boundaries' ? 'Boundaries' : result.virtue_name,
              score: Math.max(0, Math.min(10, result.defect_intensity)) // This should be the virtue score (0-10)
            }));
            console.log('Transformed results:', results);
            setAssessmentResults(results);
          } else {
            console.log('Assessment found but no results data');
          }
        } else {
          console.log('No assessments found for user');
        }
      }

      if (!hasCompletedAssessment) {
        setShowWelcomeModal(true);
      }

      if (connectionResult.data && connectionResult.data.length > 0) {
        setConnection(connectionResult.data[0]);
      }

      let virtuesWithScores = virtuesResult.data || [];
      if (hasCompletedAssessment) {
        const { data: assessmentData } = await supabase
          .from('user_assessment_results')
          .select('virtue_name, defect_intensity')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(12);

        if (assessmentData) {
          virtuesWithScores = virtuesWithScores.map(virtue => {
            const assessment = assessmentData.find(a => a.virtue_name === virtue.name);
            return { ...virtue, virtue_score: assessment ? 10 - (assessment.defect_intensity || 0) : 0 };
          });
          virtuesWithScores.sort((a, b) => (a.virtue_score || 0) - (b.virtue_score || 0)); // Sort lowest to highest
        }
      } else {
        // For new users, sort by virtue ID (default order)
        virtuesWithScores.sort((a, b) => a.id - b.id);
      }

      setVirtues(virtuesWithScores);
      console.log('Final virtues set:', virtuesWithScores);

      if (journalResult.data && journalResult.data.length > 0) {
        setLastJournalEntry(journalResult.data[0].created_at);
      }

      if (progressResult.data) {
        const progressMap = new Map();
        progressResult.data.forEach((p: StageProgress) => {
          progressMap.set(`${p.virtue_id}-${p.stage_number}`, p.status);
        });
        setProgress(progressMap);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        errorObject: error
      });
    } finally {
      setLoading(false);
    }
  }, []);



  useEffect(() => {
    getDashboardData();
  }, [getDashboardData]);

  const handleCloseModal = () => {
    setShowWelcomeModal(false);
  };

  const handleOpenModal = () => {
    setShowWelcomeModal(true);
  };

  const getStatusClasses = (virtueId: number, stage: number): string => {
    const status = progress.get(`${virtueId}-${stage}`);
    switch (status) {
      case 'in_progress': return 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200';
      default: return 'bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200';
    }
  };

  return {
    loading,
    connection,
    virtues,
    assessmentTaken,
    assessmentResults,
    progress,
    lastJournalEntry,
    showWelcomeModal,
    buttonStates,
    handleCloseModal,
    handleOpenModal,
    getStatusClasses,

    setButtonStates
  };
}
