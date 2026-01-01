'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowRight, 
  ArrowLeft, 
  Search, 
  Users, 
  Building2,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface User {
  id: string;
  full_name: string;
  email: string;
  organization_id: string | null;
  organization_name: string | null;
  roles: string[];
  created_at: string;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  active_user_count: number;
  max_users: number;
}

export default function PractitionerMigration() {
  const [users, setUsers] = useState<User[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch users and organizations
      const [usersResponse, orgsResponse] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/organizations')
      ]);
      
      const usersData = await usersResponse.json();
      const orgsData = await orgsResponse.json();
      
      setUsers(usersData.users || []);
      setOrganizations(orgsData.organizations || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage({ type: 'error', text: 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  };

  const searchUser = () => {
    if (!searchEmail.trim()) {
      setMessage({ type: 'error', text: 'Please enter an email address' });
      return;
    }
    
    const user = users.find(u => u.email?.toLowerCase() === searchEmail.toLowerCase());
    if (user) {
      setSelectedUser(user);
      setMessage(null);
    } else {
      setMessage({ type: 'error', text: 'User not found' });
      setSelectedUser(null);
    }
  };

  const migrateToOrganization = async () => {
    if (!selectedUser || !selectedOrgId) {
      setMessage({ type: 'error', text: 'Please select a user and organization' });
      return;
    }

    if (selectedUser.organization_id === selectedOrgId) {
      setMessage({ type: 'error', text: 'User is already in this organization' });
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch('/api/admin/migrate-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          organizationId: selectedOrgId,
          action: 'join'
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'User successfully migrated to organization' });
        fetchData(); // Refresh data
        setSelectedUser(null);
        setSearchEmail('');
        setSelectedOrgId('');
      } else {
        setMessage({ type: 'error', text: result.error || 'Migration failed' });
      }
    } catch (error) {
      console.error('Migration error:', error);
      setMessage({ type: 'error', text: 'Migration failed' });
    } finally {
      setLoading(false);
    }
  };

  const migrateToIndividual = async () => {
    if (!selectedUser || !selectedUser.organization_id) {
      setMessage({ type: 'error', text: 'User is not in an organization' });
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch('/api/admin/migrate-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          organizationId: null,
          action: 'leave'
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'User successfully converted to individual practitioner' });
        fetchData(); // Refresh data
        setSelectedUser(null);
        setSearchEmail('');
      } else {
        setMessage({ type: 'error', text: result.error || 'Migration failed' });
      }
    } catch (error) {
      console.error('Migration error:', error);
      setMessage({ type: 'error', text: 'Migration failed' });
    } finally {
      setLoading(false);
    }
  };

  const individualUsers = users.filter(u => !u.organization_id);
  const organizationUsers = users.filter(u => u.organization_id);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5 text-blue-600" />
            Practitioner Migration
          </CardTitle>
          <CardDescription>
            Transfer practitioners between individual accounts and organizations. 
            Use this for support requests to move existing users.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Search and Select User */}
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="email">Search User by Email</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="email"
                      type="email"
                      placeholder="user@example.com"
                      value={searchEmail}
                      onChange={(e) => setSearchEmail(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && searchUser()}
                    />
                    <Button onClick={searchUser} disabled={loading}>
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Selected User Display */}
              {selectedUser && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{selectedUser.full_name}</h4>
                        <p className="text-sm text-gray-600">{selectedUser.email}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant={selectedUser.organization_id ? "default" : "secondary"}>
                            {selectedUser.organization_id ? 'Organization User' : 'Individual User'}
                          </Badge>
                          {selectedUser.organization_name && (
                            <Badge variant="outline">
                              {selectedUser.organization_name}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          Created: {new Date(selectedUser.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-500">
                          Roles: {selectedUser.roles.join(', ')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Migration Actions */}
              {selectedUser && (
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Move to Organization */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Building2 className="h-5 w-5 text-green-600" />
                        Move to Organization
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="organization">Select Organization</Label>
                        <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose organization..." />
                          </SelectTrigger>
                          <SelectContent>
                            {organizations.map(org => (
                              <SelectItem key={org.id} value={org.id}>
                                {org.name} ({org.active_user_count}/{org.max_users} users)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button 
                        onClick={migrateToOrganization}
                        disabled={loading || !selectedOrgId || selectedUser.organization_id === selectedOrgId}
                        className="w-full"
                      >
                        <ArrowRight className="h-4 w-4 mr-2" />
                        Move to Organization
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Move to Individual */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Users className="h-5 w-5 text-orange-600" />
                        Convert to Individual
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-gray-600">
                        Remove user from their current organization and convert to individual practitioner.
                      </p>
                      <Button 
                        onClick={migrateToIndividual}
                        disabled={loading || !selectedUser.organization_id}
                        variant="outline"
                        className="w-full"
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Convert to Individual
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Status Message */}
              {message && (
                <div className={`p-4 rounded-lg flex items-center gap-2 ${
                  message.type === 'success' 
                    ? 'bg-green-50 text-green-800 border border-green-200' 
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {message.type === 'success' ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5" />
                  )}
                  {message.text}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Overview */}
      <Tabs defaultValue="individual">
        <TabsList>
          <TabsTrigger value="individual">Individual Users ({individualUsers.length})</TabsTrigger>
          <TabsTrigger value="organization">Organization Users ({organizationUsers.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="individual">
          <Card>
            <CardHeader>
              <CardTitle>Individual Practitioners</CardTitle>
              <CardDescription>Users not associated with any organization</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {individualUsers.map(user => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.full_name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedUser(user);
                            setSearchEmail(user.email || '');
                          }}
                        >
                          Select for Migration
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="organization">
          <Card>
            <CardHeader>
              <CardTitle>Organization Users</CardTitle>
              <CardDescription>Users associated with organizations</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organizationUsers.map(user => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.full_name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.organization_name}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {user.roles.map(role => (
                            <Badge key={role} variant="secondary" className="text-xs">
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedUser(user);
                            setSearchEmail(user.email || '');
                          }}
                        >
                          Select for Migration
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}