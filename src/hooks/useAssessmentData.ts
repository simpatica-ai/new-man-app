import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export const useAssessmentData = (assessmentId: number | null) => {
  return useQuery({
    queryKey: ['assessment-data', assessmentId],
    queryFn: async () => {
      if (!assessmentId) return null;
      
      // Single query to get all assessment data
      const { data, error } = await supabase
        .from('user_assessments')
        .select(`
          id,
          created_at,
          summary_analysis,
          user_assessment_results (
            virtue_name,
            priority_score,
            defect_intensity
          ),
          user_assessment_defects (
            defect_name,
            harm_level
          ),
          virtue_analysis (
            virtue_id,
            analysis_text
          )
        `)
        .eq('id', assessmentId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!assessmentId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 30, // 30 minutes
  });
};
