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

  useEffect(() => {
    async function checkSession() {
      console.log('Checking session...');
      let sessionData;
      try {
        const response = await supabase.auth.getSession();
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
      
      if (sessionData.session?.user) {
        console.log('User found, fetching profile for:', sessionData.session.user.id);
        try {
          // ## UPDATED: Query the new 'profile_with_email' view
          const { data: profile, error: profileError } = await supabase
            .from('profile_with_email')
            .select('*') // The view gives us all the columns we need directly
            .eq('id', sessionData.session.user.id)
            .single();

          if (profileError) {
            // No need to handle PGRST116 separately anymore for creating a profile,
            // as the view will simply return no rows if the profile doesn't exist yet.
            // The trigger is the source of truth for profile creation.
            console.error('Profile fetch error:', profileError.message, profileError.details);
          } else if (profile) {
            // ## UPDATED: The 'profile' object is already flat, no need to process it
            console.log('Profile with email found:', profile);
          }
        } catch (fetchError) {
            if (fetchError instanceof Error)
          console.error('Profile fetch failed:', fetchError.message);
        }
      }
      setLoading(false);
      setIsLogin(!sessionData.session);
    }

    checkSession();

    const handleAuthStateChange = async (_event: string, session: Session | null) => {
      console.log('Handling auth state change:', _event);
      setSession(session);
      if (!session) {
        setIsLogin(true);
      } else {
        setIsLogin(false);
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
        options: {
          data: {
            full_name: fullName,
            phone_number: phoneNumber.replace(/\D/g, '') || null
          },
          emailRedirectTo: 'http://localhost:3000'
        }
      };
      
      const { data, error } = await supabase.auth.signUp(payload);

      if (error) {
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