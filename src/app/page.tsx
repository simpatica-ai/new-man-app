'use client'

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import Dashboard from '@/components/Dashboard';
import { Session } from '@supabase/supabase-js';

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLogin, setIsLogin] = useState(!session);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const router = useRouter();

  // ## Handles the phone number formatting
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 1. Get only the digits from the input
    const digits = e.target.value.replace(/\D/g, '');
    let formattedNumber = '';

    // 2. Apply the (XXX) XXX-XXXX format
    if (digits.length > 0) {
      formattedNumber = `(${digits.substring(0, 3)}`;
    }
    if (digits.length >= 4) {
      formattedNumber += `) ${digits.substring(3, 6)}`;
    }
    if (digits.length >= 7) {
      formattedNumber += `-${digits.substring(6, 10)}`;
    }

    // 3. Update the state
    setPhoneNumber(formattedNumber);
  };

  useEffect(() => {
    async function checkSession() {
      console.log('Checking session...');
      let sessionData;
      try {
        const response = await supabase.auth.getSession();
        console.log('getSession response:', response);
        sessionData = response.data;
        if (response.error) {
          console.error('Session fetch error:', response.error.message);
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
            .select(`
              id,
              full_name,
              role,
              user_data:users (
                email
              )
            `)
            .eq('id', sessionData.session.user.id)
            .single();
          if (profileError) {
            if (profileError.code === 'PGRST116') {
              console.warn('No profile found for user:', sessionData.session.user.id);
              const { error: insertError } = await supabase
                .from('profiles')
                .insert({
                  id: sessionData.session.user.id,
                  full_name: sessionData.session.user.user_metadata?.full_name || 'Unknown User'
                });
              if (insertError) {
                console.error('Profile creation error:', insertError.message);
              } else {
                const { data: newProfile } = await supabase
                  .from('profiles')
                  .select(`
                    id,
                    full_name,
                    role,
                    user_data:users (
                      email
                    )
                  `)
                  .eq('id', sessionData.session.user.id)
                  .single();
                if (newProfile) console.log('New profile found:', newProfile);
              }
            } else {
              console.error('Profile fetch error:', profileError.message, profileError.details);
            }
          } else if (profile) {
            console.log('Profile found:', profile);
            const profileWithEmail = {
              ...profile,
              email: profile.user_data?.email || null
            };
            delete profileWithEmail.user_data;
            console.log('Profile with email:', profileWithEmail);
          }
        } catch (fetchError) {
            if (fetchError instanceof Error)
          console.error('Profile fetch failed:', fetchError.message);
        }
      }
      console.log('Setting loading to false');
      setLoading(false);
      setIsLogin(!sessionData.session);
    }

    checkSession();

    const handleAuthStateChange = async (_event: string, session: Session | null) => {
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
          } else {
            console.warn('User not fully authenticated, skipping profile update');
          }
        } catch (error) {
          console.error('Auth state change error:', error instanceof Error ? error.message : 'Unknown error');
        }
      }
      if (!session) {
        console.log('User signed out');
        setIsLogin(true);
      } else {
        setIsLogin(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    return () => subscription.unsubscribe();
  }, [router]);

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
        options: {
          data: {
            full_name: fullName,
            // ## Send only the digits to the backend
            phone_number: phoneNumber.replace(/\D/g, '') || null
          },
          emailRedirectTo: 'http://localhost:3000'
        }
      };
      console.log('Sign-up payload:', payload);

      const { data, error } = await supabase.auth.signUp(payload);
      console.log('Sign-up response:', { data, error });

      if (error) {
        console.error('Sign-up error details:', error.message, error.name, error.status);
        throw error;
      }

      if (data.user) {
        alert('Sign-up successful! Please check your email to confirm your account.');
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
                    type="button"
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
                    // ## Use the new formatting handler
                    onChange={handlePhoneChange}
                    placeholder="(123) 456-7890"
                    maxLength={14}
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
                    type="button"
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