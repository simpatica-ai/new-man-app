'use client'

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useRouter } from 'next/navigation';

// Type to hold our combined practitioner and connection data
type PractitionerDetails = {
  id: string; // Practitioner's UUID
  full_name: string | null;
  email: string | null;
  connection_id: number | null;
  sponsor_name: string | null;
};

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [practitioners, setPractitioners] = useState<PractitionerDetails[]>([]);
  const router = useRouter();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        router.push('/'); // Redirect if not logged in
        return;
      }
      
      // First, verify if the current user is an admin
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
      
      if (profileError || profile?.role !== 'admin') {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      
      setIsAdmin(true);

      // If user is admin, fetch all practitioners and their active connections
      const { data, error } = await supabase.rpc('get_all_practitioner_details');

      if (error) throw error;
      setPractitioners(data || []);

    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRemoveSponsor = async (connection_id: number) => {
    if (!confirm('Are you sure you want to remove this sponsor connection? This action cannot be undone.')) {
      return;
    }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session");

      const { error } = await supabase.functions.invoke('admin-remove-sponsor-connection', {
        body: { connection_id },
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;
      alert('Sponsor connection removed successfully.');
      fetchData(); // Refresh the list
    } catch (error) {
      if (error instanceof Error) {
        alert('Error: ' + error.message);
      }
    }
  };

  const handleRemovePractitioner = async (practitioner_id: string) => {
    if (!confirm('EXTREME DANGER: Are you sure you want to permanently delete this practitioner and all their associated data? This action cannot be undone.')) {
      return;
    }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session");
      
      const { error } = await supabase.functions.invoke('admin-remove-practitioner', {
        body: { practitioner_id },
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;
      alert('Practitioner deleted successfully.');
      fetchData(); // Refresh the list
    } catch (error) {
      if (error instanceof Error) {
        alert('Error: ' + error.message);
      }
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading Admin Panel...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto p-4 max-w-2xl text-center">
        <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
        <p>You do not have permission to view this page.</p>
        <Link href="/" className="mt-4 inline-block">
          <Button variant="outline">Go to Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
       <Link href="/" className="mb-4 inline-block">
          <Button variant="outline">&larr; Back to Dashboard</Button>
        </Link>
      <div className="mb-6">
        <h1 className="text-4xl font-bold">Admin Panel</h1>
        <p className="text-gray-500">Manage practitioners and their connections.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Practitioner Management</CardTitle>
          <CardDescription>View all practitioners and perform administrative actions.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Practitioner</TableHead>
                <TableHead>Active Sponsor</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {practitioners.length > 0 ? practitioners.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="font-medium">{p.full_name}</div>
                    <div className="text-sm text-gray-500">{p.email}</div>
                  </TableCell>
                  <TableCell>{p.sponsor_name || 'None'}</TableCell>
                  <TableCell className="text-right space-x-2">
                    {p.connection_id && (
                       <Button variant="outline" size="sm" onClick={() => handleRemoveSponsor(p.connection_id!)}>
                         Remove Sponsor
                       </Button>
                    )}
                    <Button variant="destructive" size="sm" onClick={() => handleRemovePractitioner(p.id)}>
                      Delete Practitioner
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-gray-500">
                    No practitioners found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

