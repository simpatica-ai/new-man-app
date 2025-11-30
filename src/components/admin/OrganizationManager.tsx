'use client'

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Users, UserPlus, Settings, Trash2 } from 'lucide-react';


interface Organization {
  id: string;
  name: string;
  slug: string;
  member_count: number;
  created_at: string;
  logo_url?: string;
}

interface IndividualUser {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
  organization_id?: string;
}

interface OrganizationRequest {
  id: string;
  organization_name: string;
  organization_description: string;
  contact_name: string;
  contact_email: string;
  use_case: string;
  estimated_users: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export default function OrganizationManager() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [individualUsers, setIndividualUsers] = useState<IndividualUser[]>([]);
  const [pendingRequests, setPendingRequests] = useState<OrganizationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedOrganization, setSelectedOrganization] = useState<string>('');




  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch organizations - table exists, so let's use it properly
      const { data: orgsData, error: orgsError } = await supabase
        .from('organizations' as any)
        .select('id, name, slug, created_at, logo_url, active_user_count');

      console.log('Organizations query result:', { orgsData, orgsError });

      if (!orgsError && orgsData) {
        setOrganizations(orgsData.map((org: any) => ({
          ...org,
          member_count: org.active_user_count || 0
        })));
      } else if (orgsError) {
        console.error('Error fetching organizations:', orgsError);
      }

      // Fetch individual users (users without organization_id)
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, full_name, created_at, organization_id')
        .is('organization_id', null);

      console.log('Individual users query result:', { usersData, usersError });

      if (!usersError && usersData) {
        // For individual users, we'll show them without emails for now
        // In production, we'd use a server-side API to get emails
        const usersWithPlaceholderEmails = usersData.map(user => ({
          ...user,
          email: 'user@example.com' // Placeholder - would be fetched server-side in production
        }));
        
        setIndividualUsers(usersWithPlaceholderEmails);
      } else if (usersError) {
        console.error('Error fetching individual users:', usersError);
      }

      // Fetch pending organization requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('organization_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      console.log('Pending requests query result:', { requestsData, requestsError });

      if (!requestsError && requestsData) {
        setPendingRequests(requestsData);
      } else if (requestsError) {
        console.error('Error fetching pending requests:', requestsError);
      }

    } catch (error) {
      console.error('Error fetching organization data:', error);
    } finally {
      setLoading(false);
    }
  };



  const moveUserToOrganization = async () => {
    if (!selectedUser || !selectedOrganization) return;

    try {
      // Update user's profile to include organization_id
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          organization_id: selectedOrganization,
          roles: ['practitioner'] // Default role
        })
        .eq('id', selectedUser);

      if (profileError) throw profileError;

      // TODO: Migrate sponsor relationships to practitioner assignments
      // This would be done in a more complex migration function

      setSelectedUser('');
      setSelectedOrganization('');
      fetchData();
      alert('User moved to organization successfully!');
    } catch (error) {
      console.error('Error moving user to organization:', error);
      alert('Failed to move user to organization');
    }
  };

  const approveOrganizationRequest = async (requestId: string) => {
    try {
      const request = pendingRequests.find(r => r.id === requestId);
      if (!request) {
        alert('Request not found');
        return;
      }

      const { data, error } = await supabase
        .rpc('approve_organization_request', {
          request_id: requestId,
          admin_notes: 'Approved by system administrator'
        });

      if (error) throw error;

      const result = data[0];
      if (result.success) {
        // Send invitation email
        try {
          const emailResponse = await fetch('/api/send-org-admin-invitation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              organizationName: request.organization_name,
              contactName: request.contact_name,
              contactEmail: request.contact_email,
              organizationSlug: `org-${Date.now()}`, // Simple slug for now
              userExists: result.admin_user_id !== null
            })
          });

          if (emailResponse.ok) {
            alert(`✅ ${result.message}\n\n📧 Invitation email sent to ${request.contact_email}`);
          } else {
            alert(`✅ ${result.message}\n\n⚠️ Organization created but email notification failed. Please contact ${request.contact_email} manually.`);
          }
        } catch (emailError) {
          console.error('Email sending failed:', emailError);
          alert(`✅ ${result.message}\n\n⚠️ Organization created but email notification failed. Please contact ${request.contact_email} manually.`);
        }

        fetchData(); // Refresh data
      } else {
        alert(`❌ Failed to approve request: ${result.message}`);
      }
    } catch (error) {
      console.error('Error approving request:', error);
      alert(`❌ Failed to approve request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const rejectOrganizationRequest = async (requestId: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      const { data, error } = await supabase
        .rpc('reject_organization_request', {
          request_id: requestId,
          rejection_reason: reason
        });

      if (error) throw error;

      const result = data[0];
      if (result.success) {
        alert('Request rejected successfully');
        fetchData(); // Refresh data
      } else {
        alert(`Failed to reject request: ${result.message}`);
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert(`Failed to reject request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const checkIfUserExists = async (email: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, organization_id')
        .eq('email', email)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error checking user:', error);
      return null;
    }
  };

  const deleteOrganization = async (org: Organization) => {
    const confirmMessage = `⚠️ DANGER: This will permanently delete the organization "${org.name}" and ALL ${org.member_count} users in it.\n\nThis action cannot be undone!\n\nType "DELETE" to confirm:`;
    
    const confirmation = prompt(confirmMessage);
    
    if (confirmation !== 'DELETE') {
      alert('Organization deletion cancelled.');
      return;
    }

    try {
      console.log('Calling delete function with:', { org_id: org.id, admin_confirmation: 'DELETE_WITH_USERS' });
      
      const { data, error } = await supabase
        .rpc('delete_organization_with_users', {
          org_id: org.id,
          admin_confirmation: 'DELETE_WITH_USERS'
        });

      console.log('Function response:', { data, error });

      if (error) {
        console.error('Supabase RPC error:', error);
        throw error;
      }

      // Handle the response - it might be an array or single object
      const result = Array.isArray(data) ? data[0] : data;
      
      if (!result) {
        throw new Error('No response from delete function');
      }

      if (result.success) {
        alert(`✅ ${result.message}`);
        fetchData(); // Refresh data
      } else {
        alert(`❌ Failed to delete organization: ${result.message}`);
      }
    } catch (error) {
      console.error('Error deleting organization:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = JSON.stringify(error);
      }
      
      alert(`❌ Failed to delete organization: ${errorMessage}`);
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Loading organization data...</div>;
  }

  // Check if organizational features are available
  if (organizations.length === 0 && individualUsers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Organization Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-amber-50 rounded-lg">
            <h4 className="font-medium text-amber-900 mb-2">🚧 Organizational Features Not Available</h4>
            <p className="text-sm text-amber-800 mb-3">
              The organizational model has not been deployed to production yet. 
              After migration, this panel will allow you to:
            </p>
            <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
              <li>View and manage all organizations</li>
              <li>Move individual users into organizations</li>
              <li>Create new organizations</li>
              <li>Manage organization settings and member limits</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Organization Requests */}
      {pendingRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Pending Organization Requests ({pendingRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <div key={request.id} className="p-4 border rounded-lg bg-blue-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-lg">{request.organization_name}</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                        <div>
                          <span className="font-medium">Contact:</span> {request.contact_name}
                        </div>
                        <div>
                          <span className="font-medium">Email:</span> {request.contact_email}
                        </div>
                        <div>
                          <span className="font-medium">Estimated Users:</span> {request.estimated_users}
                        </div>
                        <div>
                          <span className="font-medium">Requested:</span> {new Date(request.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="mt-3">
                        <span className="font-medium text-sm">Details:</span>
                        <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">{request.organization_description}</p>
                      </div>
                      {request.use_case && (
                        <div className="mt-3">
                          <span className="font-medium text-sm">Use Case:</span>
                          <p className="text-sm text-gray-600 mt-1">{request.use_case}</p>
                        </div>
                      )}
                      <div className="mt-3">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={async () => {
                            const user = await checkIfUserExists(request.contact_email);
                            if (user) {
                              alert(`User already exists: ${user.full_name}\nOrganization: ${user.organization_id ? 'Already in an organization' : 'Individual user'}`);
                            } else {
                              alert('No existing account found for this email address.');
                            }
                          }}
                          className="mr-2"
                        >
                          Check if User Exists
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button 
                        size="sm" 
                        onClick={() => approveOrganizationRequest(request.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Approve
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => rejectOrganizationRequest(request.id)}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Organizations List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Organizations ({organizations.length})
            </CardTitle>

          </div>
        </CardHeader>
        <CardContent>
          {organizations.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizations.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {org.logo_url && (
                          <img src={org.logo_url} alt="" className="h-6 w-6 rounded" />
                        )}
                        <div>
                          <div className="font-medium">{org.name}</div>
                          <div className="text-sm text-gray-500">{org.slug}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {org.member_count}/40 members
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(org.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(`/organization/manage/${org.id}`, '_blank')}
                        >
                          <Settings className="h-4 w-4 mr-1" />
                          Manage
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => deleteOrganization(org)}
                          title={`Delete ${org.name} and all ${org.member_count} users`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center text-gray-500 py-8">
              No organizations created yet.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Individual Users Migration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Move Individual Users to Organizations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Select User</Label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose user" />
                  </SelectTrigger>
                  <SelectContent>
                    {individualUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Select Organization</Label>
                <Select value={selectedOrganization} onValueChange={setSelectedOrganization}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button 
                  onClick={moveUserToOrganization}
                  disabled={!selectedUser || !selectedOrganization}
                  className="w-full"
                >
                  Move User
                </Button>
              </div>
            </div>

            {individualUsers.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Individual Users ({individualUsers.length})</h4>
                <div className="max-h-40 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {individualUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.full_name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>


    </div>
  );
}