'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  CheckCircle,
  Building2,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import Footer from '@/components/Footer';

export default function CreateOrganizationPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [orgFormData, setOrgFormData] = useState({
    organization: '',
    organizationType: '',
    message: ''
  });

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Redirect to home page with login prompt for existing users
        router.push('/?login=true&redirect=create-organization');
        return;
      }
      setUser(user);
      setLoading(false);
    };
    checkUser();
  }, [router]);

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      // Get the user's session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No valid session found');
      }

      const response = await fetch('/api/create-organization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          organization: orgFormData.organization,
          organizationType: orgFormData.organizationType,
          message: orgFormData.message
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create organization');
      }

      setSubmitSuccess(true);
      
      // Redirect to org admin dashboard after a short delay
      setTimeout(() => {
        router.push('/orgadmin?onboarding=true');
      }, 2000);

    } catch (error) {
      console.error('Error creating organization:', error);
      alert(error instanceof Error ? error.message : 'Failed to create organization. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-amber-100">
      <AppHeader />
      
      <div className="container mx-auto max-w-2xl p-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          <h1 className="text-3xl font-light text-stone-800 mb-2">Create Your Organization</h1>
          <p className="text-stone-600">
            Set up your organization to start managing virtue development programs for your team.
          </p>
        </div>

        {submitSuccess ? (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6 text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-green-800 mb-2">Organization Created Successfully!</h3>
              <p className="text-green-700 mb-4">
                Your organization has been set up and you&apos;ve been assigned as the administrator.
              </p>
              <p className="text-sm text-green-600">
                Redirecting to your organization dashboard...
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-6 w-6 text-amber-600" />
                Organization Details
              </CardTitle>
              <CardDescription>
                Signed in as {user.email}. This will become your organization admin account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateOrganization} className="space-y-6">
                <div>
                  <Label htmlFor="organization">Organization Name *</Label>
                  <Input
                    id="organization"
                    required
                    value={orgFormData.organization}
                    onChange={(e) => setOrgFormData({...orgFormData, organization: e.target.value})}
                    placeholder="Your organization name"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="organizationType">Organization Type</Label>
                  <Input
                    id="organizationType"
                    value={orgFormData.organizationType}
                    onChange={(e) => setOrgFormData({...orgFormData, organizationType: e.target.value})}
                    placeholder="e.g., Treatment Center, Sober Living, Recovery Coaching, etc."
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="message">Tell us about your organization</Label>
                  <Textarea
                    id="message"
                    value={orgFormData.message}
                    onChange={(e) => setOrgFormData({...orgFormData, message: e.target.value})}
                    placeholder="Tell us about your organization: How many clients/residents do you serve? What recovery programming do you currently offer? How do you envision virtue development fitting into your services?"
                    rows={4}
                    className="mt-1"
                  />
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">What happens next?</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Your account will be upgraded to organization administrator</li>
                    <li>• You&apos;ll get access to the organization dashboard</li>
                    <li>• You can invite team members and customize settings</li>
                    <li>• All organizational features will be unlocked</li>
                  </ul>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Organization...
                    </>
                  ) : (
                    <>
                      <Building2 className="mr-2 h-4 w-4" />
                      Create Organization
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
      
      <Footer />
    </div>
  );
}