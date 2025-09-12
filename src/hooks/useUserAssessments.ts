import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export const useUserAssessments = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['user-assessments', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID required');
      
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
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    cacheTime: 1000 * 60 * 10, // 10 minutes
  });
};
