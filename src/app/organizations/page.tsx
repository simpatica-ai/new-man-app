'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle,
  ArrowRight,
  Users,
  Building2,
  UserPlus
} from 'lucide-react';
import Footer from '@/components/Footer';
import PublicHeader from '@/components/PublicHeader';
import heroBackgroundOrg from '@/assets/hero-background-org.jpg';

export default function OrganizationsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    checkUser();
  }, []);

  const handleGetStarted = () => {
    if (user) {
      // User is logged in, go to create organization
      router.push('/create-organization');
    } else {
      // User needs to sign in first - redirect to home page which will show AuthCard
      router.push('/?login=true&redirect=create-organization');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

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
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-6 w-6 text-amber-600" />
                        Get Started with Your Organization
                      </CardTitle>
                      <CardDescription>
                        {user 
                          ? "You're signed in! Ready to create your organization." 
                          : "Sign in to your account, then set up your organization."
                        }
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {user ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <div>
                              <p className="font-medium text-green-800">Account Ready</p>
                              <p className="text-sm text-green-700">Signed in as {user.email}</p>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <h4 className="font-medium text-stone-800">Next: Create Your Organization</h4>
                            <p className="text-sm text-stone-600">
                              Set up your organization profile, invite team members, and start using virtue development tools.
                            </p>
                          </div>
                          
                          <Button 
                            onClick={handleGetStarted}
                            className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3"
                          >
                            Create Organization
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="space-y-3">
                            <h4 className="font-medium text-stone-800">Step 1: Sign In</h4>
                            <p className="text-sm text-stone-600">
                              Sign in to your existing account or create a new one if needed.
                            </p>
                          </div>
                          
                          <div className="space-y-3">
                            <h4 className="font-medium text-stone-800">Step 2: Set Up Organization</h4>
                            <p className="text-sm text-stone-600">
                              After signing in, you&apos;ll be able to create and manage your organization.
                            </p>
                          </div>
                          
                          <Button 
                            onClick={handleGetStarted}
                            className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3"
                          >
                            <UserPlus className="mr-2 h-4 w-4" />
                            Sign In & Get Started
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
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