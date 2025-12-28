'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Users, 
  Settings, 
  Mail,
  BarChart3,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import PublicHeader from '@/components/PublicHeader';
import Footer from '@/components/Footer';

function OrganizationWelcomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [isCreatingOrg, setIsCreatingOrg] = useState(false);
  const [creationError, setCreationError] = useState<string | null>(null);

  useEffect(() => {
    const handleGoogleAuthCompletion = async () => {
      // Check if there's pending organization data from Google auth
      const pendingOrgData = localStorage.getItem('pendingOrgData');
      if (pendingOrgData) {
        setIsCreatingOrg(true);
        try {
          const orgData = JSON.parse(pendingOrgData);
          
          // Get current authenticated user
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          if (userError || !user) {
            throw new Error('Authentication required. Please sign in again.');
          }

          // Complete organization creation with authenticated user's email
          const response = await fetch('/api/organization-demo', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: orgData.name,
              email: user.email, // Use authenticated user's email
              organization: orgData.organization,
              organizationType: orgData.organizationType,
              message: orgData.message,
              useGoogleAuth: false // Use regular flow but with Google user's email
            }),
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.error || 'Failed to create organization');
          }

          // Clear the pending data
          localStorage.removeItem('pendingOrgData');
          
          // Set the organization ID for display
          if (result.organization?.id) {
            setOrganizationId(result.organization.id);
          }
        } catch (error) {
          console.error('Error completing organization creation:', error);
          setCreationError(error instanceof Error ? error.message : 'Failed to create organization');
        } finally {
          setIsCreatingOrg(false);
        }
      } else {
        // Check URL params for existing organization
        const orgId = searchParams.get('org');
        if (orgId) {
          setOrganizationId(orgId);
        }
      }
    };

    handleGoogleAuthCompletion();
  }, [searchParams]);

  if (isCreatingOrg) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 to-amber-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-stone-800 mb-2">Creating Your Organization</h3>
            <p className="text-stone-600">Please wait while we set up your organization...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (creationError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 to-amber-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="text-red-600 mb-4">
              <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-stone-800 mb-2">Organization Creation Failed</h3>
            <p className="text-stone-600 mb-4">{creationError}</p>
            <Button onClick={() => router.push('/organizations')} className="bg-amber-600 hover:bg-amber-700">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const nextSteps = [
    {
      icon: Settings,
      title: 'Customize Your Organization',
      description: 'Add your logo, colors, and organization details',
      action: 'Set up branding',
      href: '/orgadmin'
    },
    {
      icon: Users,
      title: 'Invite Your Team',
      description: 'Add coaches, therapists, and practitioners to your organization',
      action: 'Invite users',
      href: '/orgadmin'
    },
    {
      icon: BarChart3,
      title: 'Explore Analytics',
      description: 'View progress tracking and engagement metrics',
      action: 'View dashboard',
      href: '/orgadmin'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-amber-50">
      <PublicHeader />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Success Header */}
          <div className="mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-4xl font-light text-stone-800 mb-4">
              Welcome to New Man App!
            </h1>
            <p className="text-xl text-stone-600 mb-6">
              Your organization has been successfully created and is ready to transform lives through virtue development.
            </p>
            <Badge className="bg-amber-100 text-amber-800 border-amber-200">
              <Sparkles className="mr-1 h-3 w-3" />
              Trial Period Active - 14 Days Free
            </Badge>
          </div>

          {/* What's Next Section */}
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-stone-800 mb-8">
              Let's get your organization set up
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {nextSteps.map((step, index) => (
                <Card key={index} className="border-stone-200 hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <step.icon className="h-8 w-8 text-amber-600 mb-2" />
                    <CardTitle className="text-lg">{step.title}</CardTitle>
                    <CardDescription>{step.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href={step.href}>
                      <Button variant="outline" className="w-full">
                        {step.action}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Quick Start Guide */}
          <Card className="text-left mb-12">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="mr-2 h-5 w-5 text-amber-600" />
                Check Your Email
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-stone-600 mb-4">
                We've sent you a welcome email with important information about your organization setup, 
                including your admin login credentials and next steps.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h4 className="font-semibold text-amber-800 mb-2">What's included in your trial:</h4>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>• Full access to all organizational features</li>
                  <li>• Up to 40 user accounts</li>
                  <li>• Custom branding and settings</li>
                  <li>• Progress tracking and analytics</li>
                  <li>• Coach and therapist role management</li>
                  <li>• Email support</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/orgadmin">
              <Button size="lg" className="bg-amber-600 hover:bg-amber-700 text-white">
                Go to Organization Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/get-support">
              <Button size="lg" variant="outline" className="border-stone-300 text-stone-700 hover:bg-stone-50">
                Get Help & Support
              </Button>
            </Link>
          </div>

          {/* Support Information */}
          <div className="mt-12 p-6 bg-white/50 rounded-lg border border-stone-200">
            <h3 className="text-lg font-semibold text-stone-800 mb-2">
              Need Help Getting Started?
            </h3>
            <p className="text-stone-600 mb-4">
              Our team is here to help you make the most of your New Man App organization. 
              We offer onboarding support, training sessions, and ongoing assistance.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button variant="ghost" className="text-amber-600 hover:text-amber-700 hover:bg-amber-50">
                Schedule Onboarding Call
              </Button>
              <Button variant="ghost" className="text-amber-600 hover:text-amber-700 hover:bg-amber-50">
                View Documentation
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default function OrganizationWelcomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <OrganizationWelcomeContent />
    </Suspense>
  );
}