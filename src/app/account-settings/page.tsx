'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { AlertTriangle, User as UserIcon, Shield, Users, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AppHeader from '@/components/AppHeader';
import Footer from '@/components/Footer';

type ConnectionDetails = {
  id: number;
  status: string;
  sponsor_name: string | null;
};

export default function AccountSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isPasswordUser, setIsPasswordUser] = useState(false);
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [connection, setConnection] = useState<ConnectionDetails | null>(null);
  const [sponsorEmail, setSponsorEmail] = useState('');
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isCancellingInvite, setIsCancellingInvite] = useState(false);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; content: string } | null>(null);
  const router = useRouter();

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '');
    let formattedNumber = '';

    if (digits.length > 0) {
      formattedNumber = `(${digits.substring(0, 3)}`;
    }
    if (digits.length >= 4) {
      formattedNumber += `) ${digits.substring(3, 6)}`;
    }
    if (digits.length >= 7) {
      formattedNumber += `-${digits.substring(6, 10)}`;
    }
    setPhoneNumber(formattedNumber);
  };

  const fetchAllData = useCallback(async (currentUser: User) => {
    const isEmailProvider = currentUser.app_metadata.provider === 'email';
    setIsPasswordUser(isEmailProvider);

    const profilePromise = supabase
      .from('profiles')
      .select('full_name, phone_number')
      .eq('id', currentUser.id)
      .single();

    const connectionPromise = supabase
      .from('sponsor_relationships')
      .select(`
        id,
        status,
        profiles!sponsor_relationships_sponsor_id_fkey(full_name)
      `)
      .eq('practitioner_id', currentUser.id)
      .in('status', ['pending', 'active', 'email_sent'])
      .maybeSingle();

    const [profileResult, connectionResult] = await Promise.all([profilePromise, connectionPromise]);

    if (profileResult.error && profileResult.error.code !== 'PGRST116') {
        throw profileResult.error;
    }
    if (profileResult.data) {
        setFullName(profileResult.data.full_name || '');
        setPhoneNumber(profileResult.data.phone_number || '');
    }

    if (connectionResult.error) throw connectionResult.error;
    if (connectionResult.data) {
        setConnection({
          id: connectionResult.data.id,
          status: connectionResult.data.status,
          sponsor_name: connectionResult.data.profiles?.full_name || 'Your Sponsor'
        });
    }

  }, []);

  useEffect(() => {
    document.title = "New Man App: Account Settings";
    
    const checkUserAndFetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        try {
            await fetchAllData(user);
        } catch (error) {
            if (error instanceof Error) setMessage({ type: 'error', content: error.message });
        }
      } else {
        router.push('/');
      }
      setLoading(false);
    };
    checkUserAndFetchData();
  }, [router, fetchAllData]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setMessage(null);

    const { error } = await supabase
      .from('profiles')
      .update({ 
        full_name: fullName, 
        phone_number: phoneNumber.replace(/\D/g, '') // Strip formatting before saving
      })
      .eq('id', user.id);

    if (error) {
      setMessage({ type: 'error', content: `Failed to update profile: ${error.message}` });
    } else {
      setMessage({ type: 'success', content: 'Your profile has been updated successfully.' });
    }
    setLoading(false);
  };
  
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage({ type: 'error', content: 'Passwords do not match.' });
      return;
    }
    if (password.length > 0 && password.length < 6) {
        setMessage({ type: 'error', content: 'Password must be at least 6 characters long.' });
        return;
    }

    setLoading(true);
    setMessage(null);
    
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setMessage({ type: 'error', content: `Failed to update password: ${error.message}` });
    } else {
      setMessage({ type: 'success', content: 'Your password has been updated successfully.' });
      setPassword('');
      setConfirmPassword('');
    }
    setLoading(false);
  };

  const handleInviteSponsor = async () => {
    if (!sponsorEmail) {
      setMessage({ type: 'error', content: 'Please enter your sponsor\'s email address.' });
      return;
    }

    setIsSubmittingInvite(true);
    setMessage(null);
    
    try {
      // Check if practitioner already has a pending or active relationship
      const { data: existingRelationship } = await supabase
        .from('sponsor_relationships')
        .select('id')
        .eq('practitioner_id', user!.id)
        .in('status', ['pending', 'active', 'email_sent'])
        .maybeSingle();

      if (existingRelationship) {
        setMessage({ type: 'error', content: 'You already have a pending or active sponsor invitation.' });
        return;
      }

      // Check if sponsor email is already a sponsor for someone else
      const { data: existingSponsor } = await supabase
        .from('sponsor_relationships')
        .select('id')
        .eq('sponsor_email', sponsorEmail)
        .in('status', ['active', 'pending'])
        .maybeSingle();

      // Create invitation with email
      const { data: relationship, error: insertError } = await supabase
        .from('sponsor_relationships')
        .insert({
          practitioner_id: user!.id,
          sponsor_email: sponsorEmail,
          status: 'email_sent'
        })
        .select('invitation_token')
        .single();

      if (insertError) throw insertError;

      // Send email using our API
      const inviteUrl = `${window.location.origin}/sponsor/accept-invitation?token=${relationship.invitation_token}`;
      
      const emailResponse = await fetch('/api/send-sponsor-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sponsorEmail: sponsorEmail,
          practitionerName: fullName || user!.email || 'User',
          invitationLink: inviteUrl,
          isExistingSponsor: !!existingSponsor
        })
      });

      if (emailResponse.ok) {
        setMessage({ type: 'success', content: 'Invitation email sent successfully!' });
      } else {
        setMessage({ type: 'success', content: `Invitation created! Please share this link with your sponsor: ${inviteUrl}` });
      }

      setSponsorEmail('');
      
      // Refresh the connection data
      if (user) {
        await fetchAllData(user);
      }
    } catch (error) {
      if (error instanceof Error) {
        setMessage({ type: 'error', content: error.message });
      }
    } finally {
      setIsSubmittingInvite(false);
    }
  };

  const handleCancelInvitation = async () => {
    if (!connection) return;
    
    setIsCancellingInvite(true);
    setMessage(null);
    
    try {
      const { error } = await supabase
        .from('sponsor_relationships')
        .delete()
        .eq('id', connection.id);
        
      if (error) throw error;
      
      setMessage({ type: 'success', content: 'Invitation cancelled. You can now invite a different sponsor.' });
      setConnection(null);
      setSponsorEmail('');
    } catch (error) {
      if (error instanceof Error) {
        setMessage({ type: 'error', content: 'Failed to cancel invitation: ' + error.message });
      }
    } finally {
      setIsCancellingInvite(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE MY ACCOUNT') {
      setMessage({ type: 'error', content: 'Please type "DELETE MY ACCOUNT" to confirm.' });
      return;
    }

    setIsDeletingAccount(true);
    setMessage(null);

    try {
      // Delete user account (this will cascade delete related data due to foreign key constraints)
      const { error } = await supabase.auth.admin.deleteUser(user!.id);
      
      if (error) throw error;
      
      // Sign out and redirect
      await supabase.auth.signOut();
      router.push('/');
    } catch (error) {
      if (error instanceof Error) {
        setMessage({ type: 'error', content: `Failed to delete account: ${error.message}` });
      }
    } finally {
      setIsDeletingAccount(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-amber-100">
        <AppHeader />
        <div className="p-8 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-amber-200/60 rounded-lg w-64 mx-auto"></div>
            <div className="h-4 bg-stone-300/60 rounded-lg w-48 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-amber-100 relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgb(120,113,108)_1px,_transparent_0)] bg-[length:32px_32px]"></div>
      </div>
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-50/60 to-stone-100/80"></div>
      
      <div className="relative z-10">
        <AppHeader />
        <main className="container mx-auto p-4 md:p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-light text-stone-800 leading-tight">
              Account 
              <span className="block text-2xl font-medium text-amber-900 mt-2">Settings</span>
            </h1>
            <div className="w-24 h-0.5 bg-gradient-to-r from-amber-600 to-stone-600 mt-4"></div>
          </div>

          <div className="max-w-4xl mx-auto space-y-8">
            {message && (
              <Alert className={`border ${message.type === 'success' ? 'border-emerald-200 bg-emerald-50/60' : 'border-red-200 bg-red-50/60'} backdrop-blur-sm`}>
                <AlertTriangle className={`h-4 w-4 ${message.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`} />
                <AlertDescription className={`${message.type === 'success' ? 'text-emerald-800' : 'text-red-800'} whitespace-pre-wrap break-all`}>
                  {message.content}
                </AlertDescription>
              </Alert>
            )}

            {/* Profile Information */}
            <Card className="border-stone-200 bg-gradient-to-br from-white/80 via-amber-50/30 to-stone-50/60 backdrop-blur-sm shadow-lg shadow-amber-200/30">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <UserIcon className="h-6 w-6 text-amber-700" />
                  <div>
                    <CardTitle className="text-stone-800 text-xl font-medium">Profile Information</CardTitle>
                    <CardDescription className="text-stone-600 font-light">Manage your personal details and contact information</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="grid gap-3">
                    <Label htmlFor="email" className="text-stone-700 font-medium">Email Address</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={user?.email || ''} 
                      disabled 
                      className="bg-stone-100/60 border-stone-200/60"
                    />
                    <p className="text-xs text-stone-500 font-light">Your email address cannot be changed</p>
                  </div>
                  
                  <div className="grid gap-3">
                    <Label htmlFor="fullName" className="text-stone-700 font-medium">Full Name</Label>
                    <Input 
                      id="fullName" 
                      type="text" 
                      value={fullName} 
                      onChange={(e) => setFullName(e.target.value)} 
                      placeholder="Your full name"
                      className="bg-white/60 backdrop-blur-sm border-stone-200/60 transition-all duration-300 focus:bg-white/80"
                    />
                  </div>
                  
                  <div className="grid gap-3">
                    <Label htmlFor="phone" className="text-stone-700 font-medium">Phone Number</Label>
                    <Input 
                      id="phone" 
                      type="tel" 
                      value={phoneNumber} 
                      onChange={handlePhoneChange} 
                      placeholder="(123) 456-7890"
                      maxLength={14}
                      className="bg-white/60 backdrop-blur-sm border-stone-200/60 transition-all duration-300 focus:bg-white/80"
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white transition-all duration-300 shadow-lg shadow-amber-300/40"
                  >
                    {loading ? 'Saving...' : 'Save Profile'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Sponsor Connection */}
            <Card className="border-stone-200 bg-gradient-to-br from-white/80 via-amber-50/30 to-stone-50/60 backdrop-blur-sm shadow-lg shadow-amber-200/30">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <Users className="h-6 w-6 text-amber-700" />
                  <div>
                    <CardTitle className="text-stone-800 text-xl font-medium">Sponsor Connection</CardTitle>
                    <CardDescription className="text-stone-600 font-light">Manage your relationship with your mentor</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {connection ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/50 backdrop-blur-sm rounded-lg border border-stone-200/60">
                      <div>
                        <p className="text-stone-700 font-medium">Connected with: <span className="text-amber-800 font-semibold">{connection.sponsor_name || 'Your Sponsor'}</span></p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-stone-600 text-sm">Status:</span>
                          <Badge variant="secondary" className={
                            connection.status === 'active' 
                              ? 'bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 border-emerald-200'
                              : connection.status === 'email_sent'
                              ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-blue-200'
                              : 'bg-gradient-to-r from-amber-50 to-amber-100 text-amber-700 border-amber-200'
                          }>
                            {connection.status === 'email_sent' ? 'Invitation Sent' : connection.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    {connection.status === 'email_sent' && (
                      <div className="p-4 bg-blue-50/60 backdrop-blur-sm rounded-lg border border-blue-200/60">
                        <p className="text-blue-800 text-sm mb-3">
                          Your sponsor invitation is pending. If they haven't responded or you need to invite someone else, you can cancel this invitation.
                        </p>
                        <Button 
                          variant="outline"
                          onClick={handleCancelInvitation}
                          disabled={isCancellingInvite}
                          className="border-red-300 text-red-700 hover:bg-red-50 transition-all duration-300"
                        >
                          {isCancellingInvite ? 'Cancelling...' : 'Cancel Invitation'}
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="p-4 bg-amber-50/60 backdrop-blur-sm rounded-lg border border-amber-200/60">
                      <p className="text-stone-700 font-light">You are not currently connected with a sponsor. Enter your sponsor&apos;s email address below to invite them.</p>
                    </div>
                    
                    <div className="space-y-3">
                      <Label htmlFor="sponsorEmail" className="text-stone-700 font-medium">Sponsor&apos;s Email Address</Label>
                      <Input
                        id="sponsorEmail"
                        type="email"
                        placeholder="sponsor@example.com"
                        value={sponsorEmail}
                        onChange={(e) => setSponsorEmail(e.target.value)}
                        className="bg-white/60 backdrop-blur-sm border-stone-200/60 transition-all duration-300 focus:bg-white/80"
                      />
                      <Button 
                        onClick={handleInviteSponsor} 
                        disabled={isSubmittingInvite}
                        className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white transition-all duration-300 shadow-lg shadow-amber-300/40"
                      >
                        {isSubmittingInvite ? 'Sending Invite...' : 'Invite Sponsor'}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Password Change */}
            {isPasswordUser && (
              <Card className="border-stone-200 bg-gradient-to-br from-white/80 via-amber-50/30 to-stone-50/60 backdrop-blur-sm shadow-lg shadow-amber-200/30">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <Shield className="h-6 w-6 text-amber-700" />
                    <div>
                      <CardTitle className="text-stone-800 text-xl font-medium">Security Settings</CardTitle>
                      <CardDescription className="text-stone-600 font-light">Update your password to keep your account secure</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdatePassword} className="space-y-6">
                    <div className="grid gap-3">
                      <Label htmlFor="password" className="text-stone-700 font-medium">New Password</Label>
                      <Input 
                        id="password" 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        placeholder="Enter new password"
                        className="bg-white/60 backdrop-blur-sm border-stone-200/60 transition-all duration-300 focus:bg-white/80"
                      />
                    </div>
                    
                    <div className="grid gap-3">
                      <Label htmlFor="confirmPassword" className="text-stone-700 font-medium">Confirm New Password</Label>
                      <Input 
                        id="confirmPassword" 
                        type="password" 
                        value={confirmPassword} 
                        onChange={(e) => setConfirmPassword(e.target.value)} 
                        placeholder="Confirm new password"
                        className="bg-white/60 backdrop-blur-sm border-stone-200/60 transition-all duration-300 focus:bg-white/80"
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white transition-all duration-300 shadow-lg shadow-amber-300/40"
                    >
                      {loading ? 'Updating...' : 'Update Password'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Danger Zone - Account Deletion */}
            <Card className="border-red-200 bg-gradient-to-br from-red-50/60 via-white/60 to-red-50/40 backdrop-blur-sm shadow-lg shadow-red-200/30">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <Trash2 className="h-6 w-6 text-red-600" />
                  <div>
                    <CardTitle className="text-red-800 text-xl font-medium">Danger Zone</CardTitle>
                    <CardDescription className="text-red-600 font-light">Permanently delete your account and all associated data</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {!showDeleteConfirm ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-red-50/60 backdrop-blur-sm rounded-lg border border-red-200/60">
                      <p className="text-red-800 font-light text-sm">
                        <strong>Warning:</strong> This action cannot be undone. This will permanently delete your account, 
                        all your reflections, progress, and remove you from any sponsor connections.
                      </p>
                    </div>
                    <Button 
                      variant="outline"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="border-red-300 text-red-700 hover:bg-red-50 transition-all duration-300"
                    >
                      Close My Account
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="p-4 bg-red-100/60 backdrop-blur-sm rounded-lg border border-red-300/60">
                      <p className="text-red-800 font-medium text-sm mb-3">
                        Are you absolutely sure? This action cannot be undone.
                      </p>
                      <p className="text-red-700 text-sm font-light">
                        Type <strong>&quot;DELETE MY ACCOUNT&quot;</strong> below to confirm:
                      </p>
                    </div>
                    
                    <Input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="DELETE MY ACCOUNT"
                      className="bg-white/60 backdrop-blur-sm border-red-200/60 focus:border-red-400"
                    />
                    
                    <div className="flex gap-3">
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeleteConfirmText('');
                        }}
                        className="border-stone-300 text-stone-700 hover:bg-stone-50"
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleDeleteAccount}
                        disabled={isDeletingAccount || deleteConfirmText !== 'DELETE MY ACCOUNT'}
                        className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white transition-all duration-300"
                      >
                        {isDeletingAccount ? 'Deleting Account...' : 'Delete My Account'}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}