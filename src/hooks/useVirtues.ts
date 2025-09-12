import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export interface Virtue {
  id: number;
  name: string;
  description: string;
  short_description: string;
}

export const useVirtues = () => {
  return useQuery({
    queryKey: ['virtues'],
    queryFn: async (): Promise<Virtue[]> => {
      const { data, error } = await supabase
        .from('virtues')
        .select('id, name, description, short_description')
        .order('id');
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 60, // 1 hour - virtues rarely change
    cacheTime: 1000 * 60 * 60 * 24, // 24 hours
  });
};
