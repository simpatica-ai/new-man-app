// src/components/JournalComponent.tsx
"use client"; 

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import JournalEntryCard from '@/components/JournalEntryCard';
import { Button } from '@/components/ui/button';

type JournalEntry = {
  id: number;
  created_at: string;
  entry_text: string | null;
};

export default function JournalComponent() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    try {
      // Don't show full loading screen on refetch, just update in background
      if (entries.length === 0) {
        setLoading(true);
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication required to view the journal.");

      const { data, error } = await supabase
        .from('journal_entries')
        .select('id, created_at, entry_text')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred while fetching entries.");
      }
    } finally {
      setLoading(false);
    }
  }, [entries.length]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleUpdateEntry = async (entryId: number, newContent: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      alert("Error: Not authenticated.");
      return;
    }

    const response = await fetch(`https://ogucnankmxrakkxavelk.supabase.co/functions/v1/update-journal-entry`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ entry_id: entryId, entry_text: newContent }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        alert(`Failed to update entry: ${errorData.error}`);
    } else {
        // Optimistically update the UI for a faster user experience
        setEntries(currentEntries =>
            currentEntries.map(entry =>
                entry.id === entryId ? { ...entry, entry_text: newContent } : entry
            )
        );
    }
  };

  const handleDeleteEntry = async (entryId: number) => {
    try {
      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', entryId);

      if (error) {
        throw error;
      }

      // Remove the deleted entry from the local state to update the UI
      setEntries(currentEntries => currentEntries.filter(e => e.id !== entryId));

    } catch (error) {
      if (error instanceof Error) {
        alert(`Failed to delete entry: ${error.message}`);
      }
    }
  };

  if (loading) return <p className="text-center text-stone-500 py-8">Loading journal entries...</p>;
  if (error) return <p className="text-center text-red-500 py-8">{error}</p>;

  return (
    <div className="p-1">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-stone-800">My Journal</h2>
          <p className="mt-1 text-stone-600">Your private space for reflection.</p>
        </div>
        <Link href="/journal/new">
          <Button variant="outline" className="flex-shrink-0">
            + New Entry
          </Button>
        </Link>
      </header>
      
      {/* Container with max height and scrolling to keep it within the tab */}
      <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-3">
        {entries.length > 0 ? (
          entries.map((entry) => (
            <JournalEntryCard 
              key={entry.id} 
              entry={{
                id: entry.id,
                date: new Date(entry.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                }),
                content: entry.entry_text
              }} 
              onUpdate={handleUpdateEntry}
              onDelete={handleDeleteEntry}
            />
          ))
        ) : (
          <div className="text-center bg-stone-100 border border-stone-200 rounded-xl p-8">
            <h3 className="text-xl font-semibold text-stone-700">No Entries Yet</h3>
            <p className="text-stone-500 mt-2">Click &quot;New Entry&quot; to start your journal.</p>
          </div>
        )}
      </div>
    </div>
  );
}