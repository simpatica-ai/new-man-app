'use client'

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import Dashboard from '@/components/Dashboard';

export default function Home() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLogin, setIsLogin] = useState(!session); // Initialize based on session
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const router = useRouter();

  useEffect(() => {
    async function checkSession() {
      console.log('Checking session...');
      let sessionData;
      try {
        const response = await supabase.auth.getSession();
        console.log('getSession response:', response);
        sessionData = response.data;
        if (sessionData.error) {
          console.error('Session fetch error:', sessionData.error.message);
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }
      } catch (networkError) {
        console.error('Network error fetching session:', networkError instanceof Error ? networkError.message : 'Unknown error');
        setLoading(false);
        return;
      }
      setSession(sessionData.session);
      console.log('Session fetched:', sessionData.session ? 'Valid' : 'None');
      if (sessionData.session?.user) {
        console.log('User found, fetching profile for:', sessionData.session.user.id);
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', sessionData.session.user.id)
            .single();
          if (profileError) {
            if (profileError.code === 'PGRST116') {
              console.warn('No profile found for user:', sessionData.session.user.id);
            } else if (profileError.status === 406) {
              console.error('Profile fetch 406 error:', profileError.message);
            } else {
              console.error('Profile fetch error:', profileError.message);
            }
          } else if (profile) {
            console.log('Profile found:', profile.full_name);
          }
        } catch (fetchError) {
          console.error('Profile fetch failed:', fetchError.message);
        }
      }
      console.log('Setting loading to false');
      setLoading(false);
      setIsLogin(!sessionData.session); // Update isLogin based on session
    }

    checkSession();

    const handleAuthStateChange = async (_event: string, session: any) => {
      console.log('Handling auth state change:', _event);
      setSession(session);
      if (session?.user) {
        try {
          const { data: userData, error: userError } = await supabase.auth.getUser();
          if (userError) {
            console.error('getUser error:', userError.message);
            return;
          }
          if (userData.user) {
            const fullName = session.user.user_metadata?.name || session.user.user_metadata?.full_name || '';
            if (fullName) {
              const { error } = await supabase
                .from('profiles')
                .update({ full_name: fullName })
                .eq('id', session.user.id);
              if (error) {
                console.error('Profile update error:', error.message);
              } else {
                console.log('Profile updated successfully for:', session.user.id);
              }
            }
            if (_event === 'SIGNED_IN') {
              router.push('/');
            }
          } else {
            console.warn('User not fully authenticated, skipping profile update');
          }
        } catch (error) {
          console.error('Auth state change error:', error instanceof Error ? error.message : 'Unknown error');
        }
      }
      if (!session) {
        console.log('User signed out');
        setIsLogin(true); // Reset to login form on sign-out
      } else {
        setIsLogin(false); // Switch to Dashboard on sign-in
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.push('/');
    } catch (error) {
      if (error instanceof Error) setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        email,
        password,
        options: { data: { full_name: fullName }, emailRedirectTo: 'http://localhost:3000' }
      };
      console.log('Sign-up payload:', payload);
      const { data, error } = await supabase.auth.signUp(payload);
      if (error) throw error;
      console.log('Sign-up response:', data);
      if (data.user) {
        console.log('Updating profile for user:', data.user.id);
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ full_name: fullName, phone_number: phoneNumber || null })
          .eq('id', data.user.id);
        if (updateError) {
          console.error('Profile update error:', updateError.message);
          throw updateError;
        }
        console.log('Profile updated, re-checking session');
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        if (session) {
          router.push('/');
        } else {
          console.error('Session not available after sign-up');
          router.push('/');
        }
      }
    } catch (error) {
      if (error instanceof Error) setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'http://localhost:3000'
        }
      });
      if (error) throw error;
    } catch (error) {
      if (error instanceof Error) setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Loading...</div>;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      {session ? (
        <Dashboard session={session} />
      ) : (
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">Welcome</CardTitle>
            <CardDescription>
              {isLogin ? 'Sign in to your account' : 'Create a new account'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLogin ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="m@example.com"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing In...' : 'Login'}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={signInWithGoogle}
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Login with Google'}
                </Button>
                <div className="text-center text-sm">
                  Don’t have an account?{' '}
                  <button
                    className="text-blue-600 hover:underline"
                    onClick={() => setIsLogin(false)}
                  >
                    Create Account
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="m@example.com"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="signup-fullname">Full Name</Label>
                  <Input
                    id="signup-fullname"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Full Name"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="signup-phone">Phone Number (Optional)</Label>
                  <Input
                    id="signup-phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="e.g., 123-456-7890"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Account'}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={signInWithGoogle}
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Sign Up with Google'}
                </Button>
                <div className="text-center text-sm">
                  Already have an account?{' '}
                  <button
                    className="text-blue-600 hover:underline"
                    onClick={() => setIsLogin(true)}
                  >
                    Login
                  </button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      )}
      {error && <p className="text-red-500 text-center mt-2">{error}</p>}
    </div>
  );
}