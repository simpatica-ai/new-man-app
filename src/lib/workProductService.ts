import { supabase } from './supabaseClient';
import { WorkProductData, VirtueStageWork, JournalEntry, AssessmentResult } from '@/components/WorkProductReport';

export interface WorkProductFilters {
  practitioner_id: string;
  date_range?: {
    start: string;
    end: string;
  };
  status_filter: 'completed' | 'in_progress' | 'both';
  virtue_ids?: number[];
}

export async function generateWorkProductData(filters: WorkProductFilters): Promise<WorkProductData> {
  const { practitioner_id, date_range, status_filter, virtue_ids } = filters;

  // Get practitioner name
  const { data: practitioner, error: practitionerError } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', practitioner_id)
    .single();

  if (practitionerError) throw practitionerError;

  // Use all available data if no date range specified, otherwise use provided range
  const startDate = date_range?.start || new Date('2020-01-01').toISOString(); // Far back date to get all data
  const endDate = date_range?.end || new Date().toISOString();

  // Try to use database function, fall back to manual queries if not available
  let virtue_stage_work: VirtueStageWork[] = [];
  
  try {
    const { data: stageWorkData, error: stageError } = await (supabase as any)
      .rpc('get_virtue_stage_work_details', {
        target_user_id: practitioner_id,
        start_date: startDate,
        end_date: endDate,
        status_filter: status_filter,
        virtue_ids: virtue_ids || null
      });

    if (stageError) {
      throw new Error('Database function not available, using fallback');
    }

    // Transform stage progress data from database function
    virtue_stage_work = stageWorkData?.map((stage: any) => ({
      virtue_id: stage.virtue_id,
      virtue_name: stage.virtue_name || 'Unknown Virtue',
      stage_number: stage.stage_number,
      stage_title: stage.stage_title,
      status: stage.status as 'completed' | 'in_progress',
      started_at: stage.started_at,
      completed_at: stage.completed_at,
      updated_at: stage.updated_at,
      memo_text: stage.memo_text
    })) || [];

  } catch (error) {
    // Fallback to manual queries if database function doesn't exist
    console.log('Using fallback queries for work product data');
    
    // Get virtue stage progress with filtering
    const selectFields = `
      virtue_id,
      stage_number,
      status,
      created_at,
      virtues (
        name
      )
    `;
    
    let stageQuery = supabase
      .from('user_virtue_stage_progress')
      .select(selectFields)
      .eq('user_id', practitioner_id);

    // Apply status filter
    if (status_filter !== 'both') {
      stageQuery = stageQuery.eq('status', status_filter);
    } else {
      stageQuery = stageQuery.in('status', ['completed', 'in_progress']);
    }

    // Apply virtue filter if specified
    if (virtue_ids && virtue_ids.length > 0) {
      stageQuery = stageQuery.in('virtue_id', virtue_ids);
    }

    // Apply date filter if specified (use created_at as fallback if updated_at doesn't exist)
    if (date_range) {
      stageQuery = stageQuery.gte('created_at', startDate).lte('created_at', endDate);
    }

    const { data: stageProgress, error: fallbackStageError } = await stageQuery;
    
    // Handle case where query fails due to missing columns/relations
    if (fallbackStageError || !stageProgress) {
      console.error('Fallback query failed:', fallbackStageError);
      virtue_stage_work = []; // Return empty array if fallback fails
    } else {
      // Get stage memos for the filtered stages
      const stageKeys = stageProgress.map((s: any) => ({ virtue_id: s.virtue_id, stage_number: s.stage_number }));
      let memos: any[] = [];
      
      if (stageKeys.length > 0) {
        try {
          const memoPromises = stageKeys.map(key => 
            supabase
              .from('user_virtue_stage_memos')
              .select('virtue_id, stage_number, memo_text, created_at')
              .eq('user_id', practitioner_id)
              .eq('virtue_id', key.virtue_id)
              .eq('stage_number', key.stage_number)
              .order('created_at', { ascending: false })
              .limit(1)
              .single()
          );

          const memoResults = await Promise.allSettled(memoPromises);
          memos = memoResults
            .filter(result => result.status === 'fulfilled' && result.value.data)
            .map(result => (result as PromiseFulfilledResult<any>).value.data);
        } catch (memoError) {
          console.error('Error fetching memos:', memoError);
          memos = []; // Continue without memos if there's an error
        }
      }

      // Transform stage progress data from manual queries
      virtue_stage_work = stageProgress.map((stage: any) => {
        const memo = memos.find(m => 
          m.virtue_id === stage.virtue_id && m.stage_number === stage.stage_number
        );

        return {
          virtue_id: stage.virtue_id,
          virtue_name: stage.virtues?.name || 'Unknown Virtue',
          stage_number: stage.stage_number,
          stage_title: undefined, // Will be populated when virtue_stages relation is available
          status: stage.status as 'completed' | 'in_progress',
          started_at: stage.created_at,
          completed_at: stage.status === 'completed' ? (stage.updated_at || stage.created_at) : undefined,
          updated_at: stage.updated_at || stage.created_at,
          memo_text: memo?.memo_text
        };
      });
    }
  }

  // Get summary statistics - try database function first, fall back if not available
  let summary;
  try {
    const { data: summaryData, error: summaryError } = await (supabase as any)
      .rpc('get_work_product_summary', {
        target_user_id: practitioner_id,
        start_date: startDate,
        end_date: endDate,
        status_filter: status_filter
      });

    if (summaryError && summaryError.code === 'PGRST202') {
      // Function doesn't exist, calculate manually
      summary = {
        total_stages_completed: virtue_stage_work.filter(s => s.status === 'completed').length,
        total_stages_in_progress: virtue_stage_work.filter(s => s.status === 'in_progress').length,
        total_journal_entries: 0, // Will be updated after journal query
        total_assessments: 0, // Will be updated after assessment query
        virtues_with_progress: new Set(virtue_stage_work.map(s => s.virtue_id)).size
      };
    } else if (summaryError) {
      throw summaryError;
    } else {
      summary = (summaryData as any)?.[0] || {
        total_stages_completed: 0,
        total_stages_in_progress: 0,
        total_journal_entries: 0,
        total_assessments: 0,
        virtues_with_progress: 0
      };
    }
  } catch (error) {
    console.error('Error with summary function, calculating manually:', error);
    summary = {
      total_stages_completed: virtue_stage_work.filter(s => s.status === 'completed').length,
      total_stages_in_progress: virtue_stage_work.filter(s => s.status === 'in_progress').length,
      total_journal_entries: 0, // Will be updated after journal query
      total_assessments: 0, // Will be updated after assessment query
      virtues_with_progress: new Set(virtue_stage_work.map(s => s.virtue_id)).size
    };
  }

  // Get journal entries within date range
  const { data: journalEntries, error: journalError } = await supabase
    .from('journal_entries')
    .select('id, created_at, entry_text')
    .eq('user_id', practitioner_id)
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: false })
    .limit(50);

  if (journalError) throw journalError;

  // Get assessment results within date range
  const { data: assessments, error: assessmentError } = await supabase
    .from('user_assessments')
    .select(`
      id,
      created_at,
      assessment_type,
      user_assessment_results (
        virtue_name,
        priority_score,
        defect_intensity
      )
    `)
    .eq('user_id', practitioner_id)
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: false })
    .limit(10);

  if (assessmentError) throw assessmentError;

  // Transform assessment data
  const assessment_results: AssessmentResult[] = assessments?.map(assessment => ({
    id: assessment.id,
    created_at: assessment.created_at,
    assessment_type: assessment.assessment_type,
    virtue_results: (assessment.user_assessment_results || []).map((result: any) => ({
      virtue_name: result.virtue_name,
      priority_score: result.priority_score,
      defect_intensity: result.defect_intensity || 0
    }))
  })) || [];

  // Generate timeline events
  const timeline_events = [
    ...virtue_stage_work
      .filter(s => s.completed_at)
      .map(s => ({
        date: s.completed_at!,
        event: `Completed ${s.virtue_name} Stage ${s.stage_number}`,
        type: 'stage_completion' as const
      })),
    ...virtue_stage_work
      .filter(s => s.status === 'in_progress' && s.started_at)
      .map(s => ({
        date: s.started_at!,
        event: `Started ${s.virtue_name} Stage ${s.stage_number}`,
        type: 'stage_start' as const
      })),
    ...journalEntries?.slice(0, 10).map(j => ({
      date: j.created_at,
      event: `Journal entry created`,
      type: 'journal_entry' as const
    })) || [],
    ...assessment_results.map(a => ({
      date: a.created_at,
      event: `${a.assessment_type} assessment completed`,
      type: 'assessment' as const
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return {
    practitioner_name: practitioner.full_name || 'Unknown Practitioner',
    date_range: {
      start: startDate,
      end: endDate
    },
    filter_status: status_filter,
    virtue_stage_work,
    journal_entries: (journalEntries || []).map(entry => ({
      id: entry.id,
      created_at: entry.created_at,
      entry_text: entry.entry_text || ''
    })),
    assessment_results,
    summary_stats: {
      total_stages_completed: Number(summary.total_stages_completed),
      total_stages_in_progress: Number(summary.total_stages_in_progress),
      total_journal_entries: journalEntries?.length || Number(summary.total_journal_entries),
      total_assessments: assessment_results.length || Number(summary.total_assessments),
      virtues_with_progress: Number(summary.virtues_with_progress)
    },
    timeline_events: timeline_events.slice(0, 20) // Limit to most recent 20 events
  };
}

export async function getAvailableVirtuesForPractitioner(practitioner_id: string): Promise<{id: number, name: string}[]> {
  try {
    // Try using the database function first
    const { data, error } = await (supabase as any)
      .rpc('get_available_virtues_for_user', {
        target_user_id: practitioner_id
      });

    if (error) {
      // If function doesn't exist, fall back to direct query
      if (error.code === 'PGRST202') {
        console.log('Database function not available, using fallback query');
        return getAvailableVirtuesFallback(practitioner_id);
      }
      throw error;
    }

    return (data as any)?.map((virtue: any) => ({
      id: virtue.virtue_id,
      name: virtue.virtue_name
    })) || [];
  } catch (error) {
    console.error('Error with database function, trying fallback:', error);
    return getAvailableVirtuesFallback(practitioner_id);
  }
}

// Fallback function when database functions aren't available
async function getAvailableVirtuesFallback(practitioner_id: string): Promise<{id: number, name: string}[]> {
  const { data, error } = await supabase
    .from('user_virtue_stage_progress')
    .select(`
      virtue_id,
      virtues (
        id,
        name
      )
    `)
    .eq('user_id', practitioner_id);

  if (error) throw error;

  // Get unique virtues
  const uniqueVirtues = new Map();
  data?.forEach(item => {
    if (item.virtues) {
      uniqueVirtues.set(item.virtues.id, item.virtues);
    }
  });

  return Array.from(uniqueVirtues.values()).sort((a: any, b: any) => a.name.localeCompare(b.name));
}