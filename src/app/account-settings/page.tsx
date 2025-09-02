'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';

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
      .rpc('get_practitioner_connection_details', { practitioner_id_param: currentUser.id });

    const [profileResult, connectionResult] = await Promise.all([profilePromise, connectionPromise]);

    if (profileResult.error && profileResult.error.code !== 'PGRST116') {
        throw profileResult.error;
    }
    if (profileResult.data) {
        setFullName(profileResult.data.full_name || '');
        setPhoneNumber(profileResult.data.phone_number || '');
    }

    if (connectionResult.error) throw connectionResult.error;
    if (connectionResult.data && connectionResult.data.length > 0) {
        setConnection(connectionResult.data[0]);
    }

  }, []);

  useEffect(() => {
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
    setIsSubmittingInvite(true);
    setMessage(null);
    try {
        const { error } = await supabase.functions.invoke('invite-sponsor', {
            body: { sponsor_email: sponsorEmail }
        });
        if (error) throw error;
        setMessage({ type: 'success', content: 'Sponsor invitation sent successfully!' });
        fetchAllData(user!);
    } catch (error) {
        if (error instanceof Error) setMessage({ type: 'error', content: error.message });
    } finally {
        setIsSubmittingInvite(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading settings...</div>;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 py-12">
      <div className="w-full max-w-2xl mx-auto p-4">
        <Link href="/" className="mb-4 inline-block">
          <Button variant="outline">&larr; Back to Dashboard</Button>
        </Link>
        <div className="space-y-8">
            <Card>
            <CardHeader>
                <CardTitle className="text-2xl">Account Settings</CardTitle>
                <CardDescription>Manage your profile information and sponsor connection.</CardDescription>
            </CardHeader>
            <CardContent>
                {message && (
                <div className={`p-4 rounded-md text-sm mb-6 ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {message.content}
                </div>
                )}
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                <h3 className="font-semibold border-b pb-2">Profile Information</h3>
                <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={user?.email || ''} disabled />
                    <p className="text-xs text-gray-500">Your email address cannot be changed.</p>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input 
                        id="phone" 
                        type="tel" 
                        value={phoneNumber} 
                        onChange={handlePhoneChange} 
                        placeholder="(123) 456-7890"
                        maxLength={14}
                    />
                </div>
                <Button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Profile'}
                </Button>
                </form>
            </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Sponsor Connection</CardTitle>
                    <CardDescription>Manage your connection with your sponsor.</CardDescription>
                </CardHeader>
                <CardContent>
                {connection ? (
                    <div>
                    <p>Your sponsor is: <strong>{connection.sponsor_name || 'Sponsor'}</strong></p>
                    <p>Status: <span className="font-semibold capitalize">{connection.status}</span></p>
                    </div>
                ) : (
                    <div className="space-y-4">
                    <p>You are not currently connected with a sponsor. Enter your sponsor&apos;s email address below to invite them.</p>
                    <Label htmlFor="sponsorEmail">Sponsor&apos;s Email</Label>
                    <Input
                        id="sponsorEmail"
                        type="email"
                        placeholder="sponsor@example.com"
                        value={sponsorEmail}
                        onChange={(e) => setSponsorEmail(e.target.value)}
                    />
                    <Button onClick={handleInviteSponsor} disabled={isSubmittingInvite}>
                        {isSubmittingInvite ? 'Sending Invite...' : 'Invite Sponsor'}
                    </Button>
                    </div>
                )}
                </CardContent>
            </Card>
            
            {isPasswordUser && (
                <Card>
                    <CardHeader>
                        <CardTitle>Change Password</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleUpdatePassword} className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="password">New Password</Label>
                            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password (leave blank to keep)" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" />
                        </div>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Updating...' : 'Update Password'}
                        </Button>
                        </form>
                    </CardContent>
                </Card>
            )}
        </div>
      </div>
    </div>
  );
}

