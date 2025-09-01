'use client'

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from 'next/navigation';

// --- TYPE DEFINITIONS ---
type PractitionerDetails = {
  id: string; 
  full_name: string | null;
  email: string | null;
  connection_id: number | null;
  sponsor_name: string | null;
};

type SupportTicket = {
  id: number;
  created_at: string;
  subject: string;
  message: string;
  status: 'Open' | 'In Progress' | 'Closed';
  user_email: string;
  user_full_name: string;
};

// --- ADMIN PAGE COMPONENT ---
export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [practitioners, setPractitioners] = useState<PractitionerDetails[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const router = useRouter();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        router.push('/');
        return;
      }
      
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

      const practitionerPromise = supabase.rpc('get_all_practitioner_details');
      const ticketsPromise = supabase.rpc('get_all_support_tickets');
      
      const [practitionerResult, ticketsResult] = await Promise.all([practitionerPromise, ticketsPromise]);

      if (practitionerResult.error) throw practitionerResult.error;
      setPractitioners(practitionerResult.data || []);

      if (ticketsResult.error) throw ticketsResult.error;
      setSupportTickets(ticketsResult.data || []);

    } catch (error) {
      if (error instanceof Error) alert(error.message);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const handleUpdateTicketStatus = async (ticketId: number, newStatus: SupportTicket['status']) => {
    try {
        const { error } = await supabase
            .from('support_tickets')
            .update({ status: newStatus })
            .eq('id', ticketId);
        if (error) throw error;
        setSupportTickets(currentTickets => 
            currentTickets.map(ticket => 
                ticket.id === ticketId ? { ...ticket, status: newStatus } : ticket
            )
        );
    } catch (error) {
        if (error instanceof Error) alert(`Failed to update status: ${error.message}`);
    }
  };

  const handleRemoveSponsor = async (connection_id: number) => {
    if (!confirm('Are you sure you want to remove this sponsor connection? This action cannot be undone.')) {
      return;
    }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session");

      const { error } = await supabase.functions.invoke('admin-remove-sponsor-connection', {
        body: { connection_id },
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });

      if (error) throw error;
      alert('Sponsor connection removed successfully.');
      fetchData();
    } catch (error) {
      if (error instanceof Error) alert('Error: ' + error.message);
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
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });

      if (error) throw error;
      alert('Practitioner deleted successfully.');
      fetchData();
    } catch (error) {
      if (error instanceof Error) alert('Error: ' + error.message);
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
        <p className="text-gray-500">Manage practitioners, support tickets, and other system settings.</p>
      </div>

      <Tabs defaultValue="practitioners">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="practitioners">Practitioner Management</TabsTrigger>
          <TabsTrigger value="support">Support Tickets</TabsTrigger>
        </TabsList>
        
        <TabsContent value="practitioners">
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
        </TabsContent>

        <TabsContent value="support">
          <Card>
            <CardHeader>
              <CardTitle>Support Ticket Management</CardTitle>
              <CardDescription>View and respond to user-submitted support tickets.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {supportTickets.length > 0 ? supportTickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell>
                        <div className="font-medium">{ticket.user_full_name}</div>
                        <div className="text-sm text-gray-500">{ticket.user_email}</div>
                      </TableCell>
                      <TableCell>{ticket.subject}</TableCell>
                      <TableCell>{new Date(ticket.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Select 
                          value={ticket.status} 
                          onValueChange={(value) => handleUpdateTicketStatus(ticket.id, value as SupportTicket['status'])}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Set Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Open">Open</SelectItem>
                            <SelectItem value="In Progress">In Progress</SelectItem>
                            <SelectItem value="Closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-gray-500">
                        No support tickets found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

