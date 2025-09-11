'use client'

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { Users, AlertTriangle, Clock, TrendingUp } from 'lucide-react';

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

type AdminStats = {
  totalUsers: number;
  activeUsers: number;
  totalSponsors: number;
  openTickets: number;
  completedAssessments: number;
  avgResponseTime: number;
};

// --- ADMIN PAGE COMPONENT ---
export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [practitioners, setPractitioners] = useState<PractitionerDetails[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
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

      // Fetch practitioners with sponsor info
      const { data: practitionerData, error: practitionerError } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          created_at,
          last_sign_in_at
        `);
      
      if (practitionerError) throw practitionerError;
      
      // Fetch sponsor connections
      const { data: connections, error: connectionsError } = await supabase
        .from('sponsor_connections')
        .select(`
          practitioner_user_id,
          sponsor_user_id,
          status,
          profiles!sponsor_connections_sponsor_user_id_fkey(full_name)
        `);
      
      if (connectionsError) throw connectionsError;
      
      // Merge data
      const practitionersWithSponsors = practitionerData?.map(p => {
        const connection = connections?.find(c => c.practitioner_user_id === p.id && c.status === 'active');
        return {
          ...p,
          connection_id: connection ? 1 : null,
          sponsor_name: connection?.profiles?.full_name || null
        };
      }) || [];
      
      setPractitioners(practitionersWithSponsors);
      
      // Fetch support tickets
      const { data: ticketData, error: ticketError } = await supabase
        .from('support_tickets')
        .select(`
          *,
          profiles(full_name, email)
        `)
        .order('created_at', { ascending: false });
      
      if (ticketError) throw ticketError;
      
      const formattedTickets = ticketData?.map(t => ({
        ...t,
        user_full_name: t.profiles?.full_name || 'Unknown',
        user_email: t.profiles?.email || 'Unknown'
      })) || [];
      
      setSupportTickets(formattedTickets);
      
      // Calculate stats
      const totalUsers = practitionerData?.length || 0;
      const activeUsers = practitionerData?.filter(p => {
        const lastSignIn = new Date(p.last_sign_in_at || p.created_at);
        const daysSince = (Date.now() - lastSignIn.getTime()) / (1000 * 60 * 60 * 24);
        return daysSince <= 7;
      }).length || 0;
      
      const totalSponsors = connections?.filter(c => c.status === 'active').length || 0;
      const openTickets = formattedTickets.filter(t => t.status === 'Open').length;
      
      const { count: assessmentCount } = await supabase
        .from('user_assessment_results')
        .select('*', { count: 'exact', head: true });
      
      setStats({
        totalUsers,
        activeUsers,
        totalSponsors,
        openTickets,
        completedAssessments: assessmentCount || 0,
        avgResponseTime: 2.3 // Placeholder - would need actual monitoring
      });

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

      {/* Stats Dashboard */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeUsers} active this week
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Sponsors</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSponsors}</div>
              <p className="text-xs text-muted-foreground">
                {Math.round((stats.totalSponsors / stats.totalUsers) * 100)}% connection rate
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.openTickets}</div>
              <p className="text-xs text-muted-foreground">
                {supportTickets.length} total tickets
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assessments</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedAssessments}</div>
              <p className="text-xs text-muted-foreground">
                Avg response: {stats.avgResponseTime}s
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="practitioners">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="practitioners">Users</TabsTrigger>
          <TabsTrigger value="support">Support</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
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
                    <TableHead>User</TableHead>
                    <TableHead>Sponsor</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {practitioners.length > 0 ? practitioners.map((p) => {
                    const lastActive = new Date(p.last_sign_in_at || p.created_at);
                    const daysSince = Math.floor((Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
                    const isActive = daysSince <= 7;
                    
                    return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-medium">{p.full_name}</div>
                            <div className="text-sm text-gray-500">{p.email}</div>
                          </div>
                          {isActive && <Badge variant="secondary" className="text-xs">Active</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>{p.sponsor_name || <span className="text-gray-400">None</span>}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {daysSince === 0 ? 'Today' : `${daysSince}d ago`}
                        </div>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {p.connection_id && (
                           <Button variant="outline" size="sm" onClick={() => handleRemoveSponsor(p.connection_id!)}>
                             Remove Sponsor
                           </Button>
                        )}
                        <Button variant="destructive" size="sm" onClick={() => handleRemovePractitioner(p.id)}>
                          Delete User
                        </Button>
                      </TableCell>
                    </TableRow>
                  )}) : (
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
        
        <TabsContent value="monitoring">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>System Performance</CardTitle>
                <CardDescription>Monitor application health and performance metrics.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <div>
                      <div className="font-medium">Database Status</div>
                      <div className="text-sm text-gray-600">All connections healthy</div>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">Online</Badge>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <div>
                      <div className="font-medium">AI Response Time</div>
                      <div className="text-sm text-gray-600">Average: {stats?.avgResponseTime || 0}s (Target: &lt;2s)</div>
                    </div>
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Warning</Badge>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <div>
                      <div className="font-medium">Active Sessions</div>
                      <div className="text-sm text-gray-600">{stats?.activeUsers || 0} users online this week</div>
                    </div>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">Normal</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest user actions and system events.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-500 text-center py-8">
                  Activity monitoring coming soon...
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

