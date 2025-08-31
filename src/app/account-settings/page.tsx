'use client'

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

type ConnectionDetails = {
  id: number;
  sponsor_name: string | null;
  journal_shared: boolean;
};

export default function AccountSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [connection, setConnection] = useState<ConnectionDetails | null>(null);

  const fetchConnectionDetails = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // This query uses a join to fetch the sponsor's name from the profiles table
      const { data, error } = await supabase
        .from('sponsor_connections')
        .select(`
          id,
          journal_shared,
          sponsor:profiles!sponsor_connections_sponsor_user_id_fkey(full_name)
        `)
        .eq('practitioner_user_id', user.id)
        .eq('status', 'active')
        .single();
      
      if (error && error.code !== 'PGRST116') { // Ignore 'PGRST116' (no rows found)
        throw error;
      }
      
      if (data) {
        // The joined data is nested, so we flatten it for our state
        setConnection({
            id: data.id,
            journal_shared: data.journal_shared,
            sponsor_name: data.sponsor.full_name
        });
      }

    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConnectionDetails();
  }, [fetchConnectionDetails]);

  const handleToggleSharing = async (isShared: boolean) => {
    if (!connection) return;

    // Optimistically update the UI for a responsive feel
    setConnection({ ...connection, journal_shared: isShared });

    const { error } = await supabase
      .from('sponsor_connections')
      .update({ journal_shared: isShared })
      .eq('id', connection.id);

    if (error) {
      // If the database update fails, revert the UI and show an error
      alert("Error updating sharing preference: " + error.message);
      setConnection({ ...connection, journal_shared: !isShared }); // Revert the change
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading settings...</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
       <Link href="/" className="mb-4 inline-block">
          <Button variant="outline">&larr; Back to Dashboard</Button>
        </Link>
      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
          <CardDescription>Manage your account and sharing preferences.</CardDescription>
        </CardHeader>
        <CardContent>
          {connection ? (
            <div className="flex items-center space-x-2">
              <Switch
                id="journal-sharing"
                checked={connection.journal_shared}
                onCheckedChange={handleToggleSharing}
              />
              <Label htmlFor="journal-sharing">
                Share my journal and memos with my sponsor ({connection.sponsor_name || 'Sponsor'})
              </Label>
            </div>
          ) : (
            <p className="text-gray-500">You do not have an active sponsor connection. Sharing settings are unavailable.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}