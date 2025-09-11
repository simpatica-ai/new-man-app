import { supabase } from '../src/lib/supabaseClient'
import { Database } from '../src/lib/database.types'

type Tables = Database['public']['Tables']

// Profile queries
export const profileQueries = {
  getProfile: async (userId: string) => {
    return await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
  },

  updateProfile: async (userId: string, updates: Tables['profiles']['Update']) => {
    return await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
  }
}

// Virtue queries
export const virtueQueries = {
  getAllVirtues: async () => {
    return await supabase
      .from('virtues')
      .select('*')
      .order('order_index')
  },

  getVirtueStages: async (virtueId: string) => {
    return await supabase
      .from('virtue_stages')
      .select('*')
      .eq('virtue_id', parseInt(virtueId))
      .order('stage_number')
  }
}

// User progress queries
export const progressQueries = {
  getUserProgress: async (userId: string) => {
    return await supabase
      .from('user_virtue_stage_progress')
      .select(`
        *,
        virtues (
          id,
          name,
          description
        )
      `)
      .eq('user_id', userId)
  },

  updateProgress: async (userId: string, virtueId: string, stageNumber: number, updates: Tables['user_virtue_stage_progress']['Update']) => {
    return await supabase
      .from('user_virtue_stage_progress')
      .upsert({
        user_id: userId,
        virtue_id: parseInt(virtueId),
        stage_number: stageNumber,
        ...updates
      })
  }
}

// Journal queries
export const journalQueries = {
  getUserJournalEntries: async (userId: string) => {
    return await supabase
      .from('journal_entries')
      .select(`
        *,
        virtues (
          id,
          name
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
  },

  createJournalEntry: async (entry: Tables['journal_entries']['Insert']) => {
    return await supabase
      .from('journal_entries')
      .insert(entry)
      .select()
      .single()
  },

  updateJournalEntry: async (entryId: string, updates: Tables['journal_entries']['Update']) => {
    return await supabase
      .from('journal_entries')
      .update(updates)
      .eq('id', parseInt(entryId))
  }
}

// Sponsor relationship queries
export const sponsorQueries = {
  getSponsorRelationships: async (userId: string) => {
    return await supabase
      .from('sponsor_relationships')
      .select(`
        *,
        sponsor:profiles!sponsor_id (
          id,
          full_name,
          email
        ),
        practitioner:profiles!practitioner_id (
          id,
          full_name,
          email
        )
      `)
      .or(`sponsor_id.eq.${userId},practitioner_id.eq.${userId}`)
  },

  createSponsorRelationship: async (sponsorId: string, practitionerId: string) => {
    return await supabase
      .from('sponsor_relationships')
      .insert({
        sponsor_id: sponsorId,
        practitioner_id: practitionerId,
        status: 'pending'
      })
  }
}