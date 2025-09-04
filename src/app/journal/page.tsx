// src/components/JournalComponent.tsx
"use client"; 

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import JournalEntryCard from '@/components/JournalEntryCard'; 

// Define the type for a journal entry from your database
type JournalEntry = {
  id: number;
  created_at: string;
  entry_text: string;
};

export default function JournalComponent() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication required to view the journal.");

      const { data, error } = await supabase
        .from('journal_entries')
        .select('id, created_at, entry_text')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  if (loading) {
    return <p className="text-center text-gray-500 py-8">Loading journal entries...</p>;
  }

  if (error) {
    return <p className="text-center text-red-500 py-8">{error}</p>;
  }

  return (
    <div className="p-1">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">My Journal</h2>
          <p className="mt-1 text-gray-600">Your private space for reflection.</p>
        </div>
        <Link 
          href="/journal/new" 
          className="inline-block rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 flex-shrink-0"
        >
          + New Entry
        </Link>
      </header>
      
      <div className="space-y-4">
        {entries.length > 0 ? (
          entries.map((entry) => (
            // Adapt the data from your table to the props your card component expects
            <JournalEntryCard 
              key={entry.id} 
              entry={{
                id: entry.id,
                title: `Entry from ${new Date(entry.created_at).toLocaleDateString()}`,
                date: new Date(entry.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                }),
                content: entry.entry_text
              }} 
            />
          ))
        ) : (
          <div className="text-center bg-gray-50 shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl p-8">
            <h3 className="text-xl font-semibold text-gray-700">No Entries Yet</h3>
            <p className="text-gray-500 mt-2">Click "New Entry" to start your journal.</p>
          </div>
        )}
      </div>
    </div>
  );
}
