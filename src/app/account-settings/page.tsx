'use client'

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';

// The unused 'Profile' type that caused the warning has been removed.

export default function AccountSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; content: string } | null>(null);
  const router = useRouter();

  const fetchProfile = useCallback(async (currentUser: User) => {
    // UPDATED: Using the 'profile_with_email' view for consistency
    const { data, error } = await supabase
      .from('profile_with_email')
      .select('full_name')
      .eq('id', currentUser.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      setMessage({ type: 'error', content: 'Could not load your profile data.' });
    } else if (data) {
      setFullName(data.full_name || '');
    }
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        setEmail(user.email || '');
        await fetchProfile(user);
      } else {
        router.push('/');
      }
      setLoading(false);
    };
    checkUser();
  }, [router, fetchProfile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setMessage(null);

    // This still updates the 'profiles' table directly, which is correct.
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
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

  if (loading) {
    return <div className="p-8 text-center">Loading settings...</div>;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-2xl mx-auto p-4">
        <Link href="/" className="mb-4 inline-block">
          <Button variant="outline">&larr; Back to Dashboard</Button>
        </Link>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Account Settings</CardTitle>
            <CardDescription>Manage your profile information and password.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {message && (
              <div className={`p-4 rounded-md text-sm ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {message.content}
              </div>
            )}

            {/* Profile Information Form */}
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <h3 className="font-semibold border-b pb-2">Profile Information</h3>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} disabled />
                 <p className="text-xs text-gray-500">Your email address cannot be changed.</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Profile'}
              </Button>
            </form>

            {/* Change Password Form */}
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <h3 className="font-semibold border-b pb-2">Change Password</h3>
               <div className="grid gap-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New password (leave blank to keep current)"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

