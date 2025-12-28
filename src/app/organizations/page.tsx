'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  CheckCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import Footer from '@/components/Footer';
import PublicHeader from '@/components/PublicHeader';
import heroBackgroundOrg from '@/assets/hero-background-org.jpg';

export default function OrganizationsPage() {
  const [demoFormData, setDemoFormData] = useState({
    name: '',
    email: '',
    password: '',
    organization: '',
    organizationType: '',
    message: ''
  });
  const [useGoogleAuth, setUseGoogleAuth] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const signInWithGoogle = async () => {
    setIsSubmitting(true);
    
    // Store organization data in localStorage for after auth
    localStorage.setItem('pendingOrgData', JSON.stringify({
      name: demoFormData.name,
      organization: demoFormData.organization,
      organizationType: demoFormData.organizationType,
      message: demoFormData.message
    }));
    
    const redirectUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000/organizations/welcome' 
      : `${window.location.origin}/organizations/welcome`;
    
    const { error } = await supabase.auth.signInWithOAuth({ 
      provider: 'google',
      options: {
        redirectTo: redirectUrl
      }
    });
    
    if (error) {
      console.error('Google auth error:', error);
      alert('Failed to authenticate with Google. Please try again.');
      setIsSubmitting(false);
    }
  };
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleDemoRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (useGoogleAuth) {
      await signInWithGoogle();
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/organization-demo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...demoFormData,
          useGoogleAuth: false
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create organization');
      }

      // If we have a login URL, redirect immediately
      if (result.loginUrl) {
        window.location.href = result.loginUrl;
        return;
      }

      // Fallback to success message if no login URL
      setSubmitSuccess(true);
      setDemoFormData({
        name: '',
        email: '',
        password: '',
        organization: '',
        organizationType: '',
        message: ''
      });
    } catch (error) {
      console.error('Error creating organization:', error);
      alert(error instanceof Error ? error.message : 'Failed to create organization. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="min-h-screen relative bg-cover bg-center"
      style={{ backgroundImage: `url(${heroBackgroundOrg.src})` }}
    >
      <div className="absolute inset-0 bg-white/65"></div>
      
      <div className="relative z-10">
        <PublicHeader />
        <main className="container mx-auto p-4 sm:p-6 lg:p-8">
          <div className="min-h-screen flex items-center justify-center">
            <div className="w-full">
              <h1 className="text-4xl md:text-5xl font-light leading-tight mb-8 text-center text-stone-800">
                Expand Your Recovery Programming Through Virtue Development
              </h1>
              
              <div className="grid md:grid-cols-2 gap-12 lg:gap-24 items-center">
                
                <div className="text-stone-800 text-left">
                  <div className="space-y-4 text-stone-700">
                    <p>
                      Support lasting recovery with evidence-based virtue development programming. 
                      Help individuals build character alongside sobriety through structured assessment, 
                      daily practice, and professional coaching support.
                    </p>
                    
                    <div className="space-y-3">
                      <h3 className="font-semibold text-stone-800">Organizational Features:</h3>
                      <ul className="space-y-2 text-sm">
                        <li className="flex"><span className="mr-2">•</span><span><strong>Multi-Role Support</strong> - Coordinate care between counselors, sponsors, therapists, and recovery coaches with role-based access</span></li>
                        <li className="flex"><span className="mr-2">•</span><span><strong>Recovery Analytics</strong> - Track virtue development progress alongside traditional recovery metrics for holistic assessment</span></li>
                        <li className="flex"><span className="mr-2">•</span><span><strong>Privacy & Security</strong> - Secure platform with robust data protection for sensitive recovery information</span></li>
                        <li className="flex"><span className="mr-2">•</span><span><strong>Integrated Coaching</strong> - Connect individuals with virtue-focused coaching that complements traditional recovery support</span></li>
                        <li className="flex"><span className="mr-2">•</span><span><strong>Custom Branding</strong> - Apply your organization&apos;s logo, colors, and messaging throughout the platform experience</span></li>
                        <li className="flex"><span className="mr-2">•</span><span><strong>Progress Tracking</strong> - Comprehensive reporting and engagement metrics for individual and group progress</span></li>
                      </ul>
                    </div>
                    
                    <p>
                      Whether you&apos;re a treatment center, sober living home, or recovery coaching practice, 
                      New Man App provides the tools to integrate virtue development into your existing programming 
                      and support long-term character growth.
                    </p>
                    
                    <p className="font-semibold text-amber-800">
                      Ready to enhance your recovery programming? This service is still in early development 
                      and there is no charge at this time. We&apos;d love to work with you to see how 
                      virtue development can complement your existing services and support lasting transformation.
                    </p>
                  </div>
                </div>
                
                <div>
                  {submitSuccess ? (
                    <Card className="border-green-200 bg-green-50">
                      <CardContent className="pt-6 text-center">
                        <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-green-800 mb-2">Organization Created Successfully!</h3>
                        <p className="text-green-700">
                          Your organization has been set up and you&apos;ve been assigned as the administrator. Check your email for login credentials and setup instructions.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardHeader>
                        <CardTitle>Create Your Organization</CardTitle>
                        <CardDescription>
                          Set up your organization account instantly. You&apos;ll receive login credentials and can start inviting team members immediately.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleDemoRequest} className="space-y-4">
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="name">Full Name *</Label>
                              <Input
                                id="name"
                                required
                                value={demoFormData.name}
                                onChange={(e) => setDemoFormData({...demoFormData, name: e.target.value})}
                                placeholder="Your full name"
                              />
                            </div>
                            <div>
                              <Label htmlFor="email">Email Address *</Label>
                              <Input
                                id="email"
                                type="email"
                                required
                                value={demoFormData.email}
                                onChange={(e) => setDemoFormData({...demoFormData, email: e.target.value})}
                                placeholder="your@email.com"
                              />
                            </div>
                          </div>
                          
                          {!useGoogleAuth && (
                            <div>
                              <Label htmlFor="password">Password *</Label>
                              <div className="relative">
                                <Input
                                  id="password"
                                  type={showPassword ? "text" : "password"}
                                  required
                                  value={demoFormData.password}
                                  onChange={(e) => setDemoFormData({...demoFormData, password: e.target.value})}
                                  placeholder="Create a password"
                                  className="pr-10"
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
                          )}
                          
                          <div>
                            <Label htmlFor="organization">Organization Name *</Label>
                            <Input
                              id="organization"
                              required
                              value={demoFormData.organization}
                              onChange={(e) => setDemoFormData({...demoFormData, organization: e.target.value})}
                              placeholder="Your organization name"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="organizationType">Organization Type</Label>
                            <Input
                              id="organizationType"
                              value={demoFormData.organizationType}
                              onChange={(e) => setDemoFormData({...demoFormData, organizationType: e.target.value})}
                              placeholder="e.g., Treatment Center, Sober Living, Recovery Coaching, etc."
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="message">Tell us about your needs</Label>
                            <Textarea
                              id="message"
                              value={demoFormData.message}
                              onChange={(e) => setDemoFormData({...demoFormData, message: e.target.value})}
                              placeholder="Tell us about your organization: How many clients/residents do you serve? What recovery programming do you currently offer? How do you envision virtue development fitting into your services?"
                              rows={4}
                            />
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id="useGoogle"
                                checked={useGoogleAuth}
                                onChange={(e) => setUseGoogleAuth(e.target.checked)}
                                className="rounded border-stone-300"
                              />
                              <Label htmlFor="useGoogle" className="text-sm">
                                Use Google Authentication instead
                              </Label>
                            </div>
                            
                            {useGoogleAuth && (
                              <p className="text-sm text-stone-600">
                                You&apos;ll be redirected to Google to sign in, then returned to complete your organization setup.
                              </p>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-3 gap-3">
                            <div></div>
                            <div></div>
                            <button 
                              type="submit" 
                              className="bg-stone-700 hover:bg-stone-800 text-white text-base py-3 rounded-lg disabled:opacity-50 font-medium transition-colors"
                              disabled={isSubmitting}
                            >
                              {isSubmitting ? 'Creating Organization...' : useGoogleAuth ? 'Continue with Google' : 'Create Organization Now'}
                            </button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  )}
                </div>

              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}