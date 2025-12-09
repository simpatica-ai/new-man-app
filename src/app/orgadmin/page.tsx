'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  UserPlus, 
  Settings, 
  Activity, 
  Upload,
  Download,
  Eye,
  UserX,
  RefreshCw,
  Calendar,
  TrendingUp,
  AlertCircle,
  Save,
  RotateCcw,
  CreditCard,
  Mail,
  X,
  Clock
} from 'lucide-react';
import {
  getCurrentUserOrganization,
  getOrganizationMembers,
  getOrganizationActivityOverview,
  updateOrganizationLogo,
  updateOrganizationInfo,
  formatLastActivity,
  getRoleBadgeColor,
  isCurrentUserAdmin,
  type Organization,
  type OrganizationMember,
  type ActivityOverview
} from '@/lib/organizationService';
import {
  createInvitation,
  getOrganizationInvitations,
  type OrganizationInvitation,
  type CreateInvitationData
} from '@/lib/invitationService';
import { supabase } from '@/lib/supabaseClient';

export default function OrgAdminDashboard() {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [activityOverview, setActivityOverview] = useState<ActivityOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [savingInfo, setSavingInfo] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [orgInfo, setOrgInfo] = useState({
    name: '',
    website_url: '',
    phone_number: '',
    description: ''
  });
  const [invitations, setInvitations] = useState<OrganizationInvitation[]>([]);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'practitioner' as 'admin' | 'coach' | 'therapist' | 'practitioner'
  });
  const [sendingInvite, setSendingInvite] = useState(false);
  const [invitationSystemAvailable, setInvitationSystemAvailable] = useState(true);

  useEffect(() => {
    loadOrganizationData();
  }, []);

  const loadOrganizationData = async () => {
    try {
      // Check if user is admin
      const adminStatus = await isCurrentUserAdmin();
      setIsAdmin(adminStatus);

      if (!adminStatus) {
        setLoading(false);
        return;
      }

      // Load organization details
      const orgData = await getCurrentUserOrganization();
      if (!orgData) {
        setLoading(false);
        return;
      }
      console.log('Loaded organization data:', orgData);
      setOrganization(orgData);
      
      // Initialize form data
      setOrgInfo({
        name: orgData.name || '',
        website_url: orgData.website_url || '',
        phone_number: orgData.phone_number || '',
        description: orgData.description || ''
      });

      // Load organization members
      const membersData = await getOrganizationMembers(orgData.id);
      console.log('Loaded members data:', membersData);
      setMembers(membersData);

      // Load activity overview
      const overview = await getOrganizationActivityOverview(orgData.id);
      setActivityOverview(overview);

      // Load pending invitations (gracefully handle if table doesn't exist)
      try {
        const invitationsData = await getOrganizationInvitations(orgData.id);
        setInvitations(invitationsData);
        setInvitationSystemAvailable(true);
      } catch (invitationError: unknown) {
        // If invitation table doesn't exist, just log and continue
        const error = invitationError as { code?: string };
        if (error?.code === 'PGRST205') {
          console.log('Invitation system not yet available - table does not exist');
          setInvitations([]);
          setInvitationSystemAvailable(false);
        } else {
          console.error('Error loading invitations:', invitationError);
          setInvitations([]);
          setInvitationSystemAvailable(true); // Assume available but errored
        }
      }
    } catch (error) {
      console.error('Error loading organization data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !organization) return;

    setUploadingLogo(true);
    try {
      console.log('Uploading logo file:', file.name, file.type, file.size);
      const logoUrl = await updateOrganizationLogo(organization.id, file);
      console.log('Logo upload result:', logoUrl);
      if (logoUrl) {
        setOrganization({ ...organization, logo_url: logoUrl });
        console.log('Updated organization with logo URL:', logoUrl);
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSaveOrganizationInfo = async () => {
    if (!organization) return;

    setSavingInfo(true);
    try {
      const success = await updateOrganizationInfo(organization.id, {
        website_url: orgInfo.website_url,
        phone_number: orgInfo.phone_number,
        description: orgInfo.description
      });

      if (success) {
        // Update the organization state with new values
        setOrganization({
          ...organization,
          website_url: orgInfo.website_url,
          phone_number: orgInfo.phone_number,
          description: orgInfo.description
        });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000); // Hide success message after 3 seconds
        console.log('Organization information updated successfully');
      }
    } catch (error) {
      console.error('Error updating organization information:', error);
    } finally {
      setSavingInfo(false);
    }
  };

  const handleSendInvitation = async () => {
    if (!organization || !inviteForm.email) return;

    setSendingInvite(true);
    try {
      // Get current user ID for invitedBy field
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const invitation = await createInvitation({
        organizationId: organization.id,
        email: inviteForm.email,
        roles: [inviteForm.role],
        invitedBy: user.id
      });

      if (invitation) {
        // Refresh invitations list
        try {
          const updatedInvitations = await getOrganizationInvitations(organization.id);
          setInvitations(updatedInvitations);
        } catch (refreshError: unknown) {
          // If table doesn't exist, just continue
          const err = refreshError as { code?: string };
          if (err?.code !== 'PGRST205') {
            console.error('Error refreshing invitations:', refreshError);
          }
        }
        
        // Reset form and hide it
        setInviteForm({ email: '', role: 'practitioner' });
        setShowInviteForm(false);
        console.log('Invitation sent successfully');
      }
    } catch (error: unknown) {
      console.error('Error sending invitation:', error);
      // Show user-friendly error message
      const err = error as { code?: string };
      if (err?.code === 'PGRST205') {
        alert('Invitation system is not yet available. Please run the database migrations first.');
      } else {
        alert('Failed to send invitation. Please try again.');
      }
    } finally {
      setSendingInvite(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-amber-100 p-8">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-stone-600" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-amber-100 p-8">
        <div className="container mx-auto max-w-6xl">
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-amber-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-stone-800 mb-2">Access Denied</h2>
              <p className="text-stone-600">You need admin privileges to access this dashboard.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-amber-100 p-8">
        <div className="container mx-auto max-w-6xl">
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-amber-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-stone-800 mb-2">No Organization Found</h2>
              <p className="text-stone-600">You don&apos;t appear to be part of an organization yet.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const activeMembers = members.filter(m => m.is_active);
  const inactiveMembers = members.filter(m => !m.is_active);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-amber-100 p-8">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-light text-stone-800">
                {organization.name}
                <span className="block text-xl font-medium text-amber-900 mt-1">
                  Organization Dashboard
                </span>
              </h1>
              <div className="w-24 h-0.5 bg-gradient-to-r from-amber-600 to-stone-600 mt-3"></div>
            </div>
            {organization.logo_url && (
              <div className="flex items-center space-x-4">
                <img 
                  src={organization.logo_url} 
                  alt={`${organization.name} logo`}
                  className="h-16 w-auto object-contain"
                />
              </div>
            )}
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activityOverview?.activeMembers || 0}</div>
              <p className="text-xs text-muted-foreground">
                of {organization.max_users} maximum
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recently Active</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activityOverview?.recentlyActive || 0}</div>
              <p className="text-xs text-muted-foreground">
                active in last 7 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Archived Users</CardTitle>
              <UserX className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activityOverview?.archivedMembers || 0}</div>
              <p className="text-xs text-muted-foreground">
                can be reactivated
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Engagement</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {activityOverview?.engagementRate || 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                weekly engagement
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="members" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Organization Members</CardTitle>
                  <CardDescription>
                    Manage your organization&apos;s members and their roles
                  </CardDescription>
                </div>
                {invitationSystemAvailable && (
                  <Button 
                    onClick={() => setShowInviteForm(!showInviteForm)}
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite Member
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {invitationSystemAvailable && showInviteForm && (
                  <div className="mb-6 p-4 border rounded-lg bg-amber-50">
                    <h4 className="font-medium mb-3">Invite New Member</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Email Address</Label>
                        <Input
                          type="email"
                          placeholder="member@example.com"
                          value={inviteForm.email}
                          onChange={(e) => setInviteForm({...inviteForm, email: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label>Role</Label>
                        <select
                          className="w-full p-2 border rounded-md"
                          value={inviteForm.role}
                          onChange={(e) => setInviteForm({...inviteForm, role: e.target.value as any})}
                        >
                          <option value="practitioner">Practitioner</option>
                          <option value="coach">Coach</option>
                          <option value="therapist">Therapist</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                      <div className="flex items-end space-x-2">
                        <Button
                          onClick={handleSendInvitation}
                          disabled={sendingInvite || !inviteForm.email}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {sendingInvite ? (
                            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Mail className="h-4 w-4 mr-2" />
                          )}
                          Send Invite
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setShowInviteForm(false)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <h4 className="font-medium text-stone-800">Active Members</h4>
                  {activeMembers.filter(member => member.id).map((member, index) => (
                    <div key={`member-${member.id || index}`} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div>
                            <h4 className="font-medium">{member.full_name || member.email}</h4>
                            <p className="text-sm text-muted-foreground">{member.email}</p>
                          </div>
                          <div className="flex space-x-1">
                            {member.roles?.map((role, roleIndex) => (
                              <Badge key={`${member.id || index}-role-${roleIndex}`} className={getRoleBadgeColor(member.roles)}>
                                {role}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          Last active: {formatLastActivity(member.last_activity)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Virtue {member.current_virtue_id || 1}, Stage {member.current_stage || 1}
                        </p>
                      </div>
                    </div>
                  ))}

                  {invitationSystemAvailable && invitations.length > 0 && (
                    <>
                      <h4 className="font-medium text-stone-800 mt-6">Pending Invitations</h4>
                      {invitations.map((invitation) => (
                        <div key={invitation.id} className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <div>
                                <h4 className="font-medium">{invitation.email}</h4>
                                <p className="text-sm text-muted-foreground">
                                  Invited as {invitation.roles.join(', ')}
                                </p>
                              </div>
                              <Badge variant="outline" className="bg-yellow-100">
                                <Clock className="h-3 w-3 mr-1" />
                                Pending
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">
                              Invited {new Date(invitation.created_at).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Expires {new Date(invitation.expires_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </>
                  )}

                  {!invitationSystemAvailable && (
                    <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
                      <h4 className="font-medium text-amber-800 mb-2">Invitation System Coming Soon</h4>
                      <p className="text-sm text-amber-700">
                        The member invitation system will be available after running the complete database migration. 
                        Currently showing existing members only.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Organization Branding</CardTitle>
                <CardDescription>
                  Upload your organization&apos;s logo for use in reports and branding
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Label htmlFor="logo-upload">Organization Logo</Label>
                  <div className="flex items-center space-x-4">
                    {organization.logo_url ? (
                      <div className="flex items-center space-x-4">
                        <img 
                          src={organization.logo_url} 
                          alt="Current logo"
                          className="h-20 w-auto object-contain border rounded-lg p-2"
                        />
                        <div>
                          <p className="text-sm text-muted-foreground">Current logo</p>
                          <p className="text-xs text-muted-foreground">
                            This logo will appear on all reports and branded materials
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="h-20 w-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                        <Upload className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-4">
                    <Input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={uploadingLogo}
                      className="max-w-xs"
                    />
                    {uploadingLogo && (
                      <RefreshCw className="h-4 w-4 animate-spin text-stone-600" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Recommended: PNG or JPG format, maximum 2MB. Logo will be used in PDF reports and email templates.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Organization Information</CardTitle>
                <CardDescription>
                  Basic organization details and contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Organization Name</Label>
                    <Input value={organization.name} disabled />
                    <p className="text-xs text-muted-foreground mt-1">
                      Contact support to change organization name
                    </p>
                  </div>
                  <div>
                    <Label>Organization Slug</Label>
                    <Input value={organization.slug} disabled />
                    <p className="text-xs text-muted-foreground mt-1">
                      Used in URLs and cannot be changed
                    </p>
                  </div>
                  <div>
                    <Label>Website URL</Label>
                    <Input 
                      value={orgInfo.website_url} 
                      placeholder="https://your-organization.com"
                      onChange={(e) => setOrgInfo({...orgInfo, website_url: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Phone Number</Label>
                    <Input 
                      value={orgInfo.phone_number} 
                      placeholder="+1 (555) 123-4567"
                      onChange={(e) => setOrgInfo({...orgInfo, phone_number: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Active Users</Label>
                    <Input value={`${organization.active_user_count} / ${organization.max_users}`} disabled />
                  </div>
                  <div>
                    <Label>Created</Label>
                    <Input value={new Date(organization.created_at).toLocaleDateString()} disabled />
                  </div>
                </div>
                <div>
                  <Label>Organization Description</Label>
                  <textarea 
                    className="w-full p-2 border rounded-md resize-none"
                    rows={3}
                    value={orgInfo.description}
                    placeholder="Brief description of your organization for reports and public information"
                    onChange={(e) => setOrgInfo({...orgInfo, description: e.target.value})}
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <Button 
                    onClick={handleSaveOrganizationInfo}
                    disabled={savingInfo}
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    {savingInfo ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Changes
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setOrgInfo({
                      name: organization.name || '',
                      website_url: organization.website_url || '',
                      phone_number: organization.phone_number || '',
                      description: organization.description || ''
                    })}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                  {saveSuccess && (
                    <div className="flex items-center text-green-600 text-sm">
                      <div className="h-2 w-2 bg-green-600 rounded-full mr-2"></div>
                      Changes saved successfully
                    </div>
                  )}
                </div>
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-800 mb-2">Report Information</h4>
                  <p className="text-sm text-blue-700">
                    The website URL, phone number, and description will be included in generated reports 
                    to provide complete organization contact information and professional branding.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Billing Information</span>
                </CardTitle>
                <CardDescription>
                  Billing details for subscription management (Stripe integration coming soon)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Billing Email</Label>
                    <Input 
                      placeholder="billing@your-organization.com"
                      disabled
                    />
                  </div>
                  <div>
                    <Label>Tax ID / VAT Number</Label>
                    <Input 
                      placeholder="123-45-6789"
                      disabled
                    />
                  </div>
                  <div>
                    <Label>Billing Address</Label>
                    <Input 
                      placeholder="123 Main St"
                      disabled
                    />
                  </div>
                  <div>
                    <Label>City</Label>
                    <Input 
                      placeholder="San Francisco"
                      disabled
                    />
                  </div>
                  <div>
                    <Label>State/Province</Label>
                    <Input 
                      placeholder="CA"
                      disabled
                    />
                  </div>
                  <div>
                    <Label>Postal Code</Label>
                    <Input 
                      placeholder="94105"
                      disabled
                    />
                  </div>
                </div>
                <div>
                  <Label>Country</Label>
                  <Input 
                    placeholder="United States"
                    disabled
                  />
                </div>
                <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <h4 className="font-medium text-amber-800 mb-2">Coming Soon</h4>
                  <p className="text-sm text-amber-700">
                    Billing information management will be available when Stripe integration is implemented. 
                    This will enable subscription management, invoicing, and payment processing.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Organization Reports</CardTitle>
                <CardDescription>
                  Generate and download reports for your organization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                      <Download className="h-6 w-6" />
                      <span>Member Activity Report</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                      <Download className="h-6 w-6" />
                      <span>Progress Summary Report</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                      <Download className="h-6 w-6" />
                      <span>Engagement Analytics</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                      <Download className="h-6 w-6" />
                      <span>Custom Report Builder</span>
                    </Button>
                  </div>
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-800 mb-2">Report Branding</h4>
                    <p className="text-sm text-blue-700">
                      All generated reports will include your organization&apos;s logo and branding. 
                      {organization.logo_url 
                        ? " Your current logo will be used automatically." 
                        : " Upload a logo in the Settings tab to brand your reports."
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}