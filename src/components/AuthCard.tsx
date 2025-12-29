'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';

export function AuthCard() {
  const searchParams = useSearchParams();
  const shouldShowLogin = searchParams.get('login') === 'true';
  const redirectPath = searchParams.get('redirect');
  
  const [loading, setLoading] = useState(false);
  const [isLoginView, setIsLoginView] = useState(shouldShowLogin); // Show login if parameter is set
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Listen for auth state changes to handle redirect after login/signup
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session && redirectPath) {
        // Redirect to the specified path after successful authentication
        window.location.href = `/${redirectPath}`;
      }
    });

    return () => subscription.unsubscribe();
  }, [redirectPath]);

  const handlePasswordReset = async () => {
    if (!email) {
      setMessage({ type: 'error', text: 'Please enter your email address first.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    // Always show success message for security (prevents email enumeration)
    setMessage({ 
      type: 'success', 
      text: 'If an account exists with this email, you will receive password reset instructions shortly.' 
    });

    // Only show error for actual system errors, not "user not found"
    if (error && !error.message.includes('User not found')) {
      console.error('Password reset error:', error);
      setMessage({ type: 'error', text: 'There was an issue sending the reset email. Please try again.' });
    }
    
    setLoading(false);
  };

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (isLoginView) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage({ type: 'error', text: error.message });
    } else {
      // Use custom signup function
      try {
        const response = await fetch('/api/supabase/functions/custom-signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            fullName: fullName,
            siteUrl: window.location.origin
          })
        })

        const result = await response.json()
        if (!response.ok) {
          setMessage({ type: 'error', text: result.error })
        } else {
          setMessage({ 
            type: 'success', 
            text: 'Account created! Please check your email to confirm your account.' 
          })
        }
      } catch (error) {
        setMessage({ type: 'error', text: error instanceof Error ? error.message : 'An error occurred' })
      }
    }
    setLoading(false);
  };

  // ## FUNCTION TO HANDLE GOOGLE SIGN-IN ##
  const signInWithGoogle = async () => {
    setLoading(true);
    
    // Build redirect URL with the redirect parameter if it exists
    const baseUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000' 
      : window.location.origin;
    
    const redirectUrl = redirectPath 
      ? `${baseUrl}/${redirectPath}`
      : baseUrl;
    
    const { error } = await supabase.auth.signInWithOAuth({ 
        provider: 'google',
        options: {
            redirectTo: redirectUrl // Redirect to the specified path after auth
        }
    });
    if (error) {
        setMessage({ type: 'error', text: error.message });
        setLoading(false);
    }
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl border-stone-200">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-semibold text-stone-800 tracking-tight">
          {isLoginView ? 'Welcome Back' : 'Start Your Journey'}
        </CardTitle>
        <CardDescription className="text-stone-600 pt-1">
          {isLoginView ? 'Continue your path of personal growth.' : 'Create your account to begin transforming your character.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleAuthAction} className="space-y-4">
          {!isLoginView && (
            <div className="grid gap-1.5">
              <Label htmlFor="fullName" className="text-stone-700">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                required
                className="bg-stone-50 border-stone-300"
              />
            </div>
          )}
          <div className="grid gap-1.5">
            <Label htmlFor="email" className="text-stone-700">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="bg-stone-50 border-stone-300"
            />
          </div>
          <div className="grid gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-stone-700">Password</Label>
              {isLoginView && (
                <button
                  type="button"
                  onClick={() => handlePasswordReset()}
                  className="text-xs text-stone-600 hover:text-stone-800 underline"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="bg-stone-50 border-stone-300 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-stone-500 hover:text-stone-700"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          {message && (
            <p className={`text-sm ${message.type === 'error' ? 'text-red-500' : 'text-green-600'}`}>
              {message.text}
            </p>
          )}
          <Button type="submit" className="w-full bg-stone-700 hover:bg-stone-800 text-white text-base py-6 rounded-lg" disabled={loading}>
            {loading ? 'Processing...' : (isLoginView ? 'Sign In' : 'Create Account')}
          </Button>
        </form>

        {/* ## SEPARATOR AND GOOGLE BUTTON ADDED HERE ## */}
        <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-stone-300" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white/0 backdrop-blur-sm px-2 text-stone-500">Or continue with</span>
            </div>
        </div>

        <Button 
          variant="outline" 
          className="w-full text-stone-700 border-stone-300 hover:bg-stone-50 text-base py-6 rounded-lg" 
          onClick={signInWithGoogle} 
          disabled={loading}
        >
            Sign In with Google
        </Button>

        <div className="mt-6 text-center text-sm text-stone-600">
          {isLoginView ? "New to your journey?" : "Already have an account?"}{' '}
          <button
            onClick={() => {
              setIsLoginView(!isLoginView);
              setMessage(null);
            }}
            className="font-semibold text-stone-800 hover:text-stone-900 underline"
          >
            {isLoginView ? 'Create Account' : 'Sign In Here'}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

