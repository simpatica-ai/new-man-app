'use client'

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignIn = async () => {
    if (!email || !password) {
      alert('Please enter both email and password.');
      return;
    }
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      alert('Signed in successfully!');
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password) {
      alert('Please enter both email and password to sign up.');
      return;
    }
    try {
      setLoading(true);
      const payload = {
        email,
        password,
        options: {
          data: {},
          emailRedirectTo: 'http://localhost:3000' // Match your app's URL
        }
      };
      console.log('Sign-up payload:', payload);
      const { data, error } = await supabase.auth.signUp(payload);
      if (error) throw error;
      console.log('Sign-up response:', data);
      alert('Check your email for the confirmation link! (or account created if confirmation disabled)');
    } catch (error) {
      if (error instanceof Error) {
        console.error('Sign-up error:', error.message, error.details, error.status);
        alert(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
      if (error) throw error;
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-sm mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Authentication</CardTitle>
          <CardDescription>
            Enter your email and password to sign in or create an account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Button onClick={handleSignIn} className="w-full" disabled={loading}>
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
              <Button onClick={handleSignUp} className="w-full" variant="outline" disabled={loading}>
                {loading ? '...' : 'Sign Up'}
              </Button>
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>
            <Button variant="outline" className="w-full" onClick={signInWithGoogle} disabled={loading}>
              Sign In with Google
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}