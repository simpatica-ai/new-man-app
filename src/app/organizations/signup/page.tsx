'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  Building2,
  User,
  Mail,
  AlertCircle
} from 'lucide-react';
import PublicHeader from '@/components/PublicHeader';
import Footer from '@/components/Footer';

interface SignupFormData {
  // Organization details
  organizationName: string;
  organizationType: string;
  organizationSize: string;
  organizationDescription: string;
  
  // Admin user details
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  adminPasswordConfirm: string;
  
  // Subscription
  subscriptionTier: 'basic' | 'premium';
  
  // Agreement
  agreeToTerms: boolean;
  agreeToPrivacy: boolean;
}

export default function OrganizationSignupPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<SignupFormData>({
    organizationName: '',
    organizationType: '',
    organizationSize: '',
    organizationDescription: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    adminPasswordConfirm: '',
    subscriptionTier: 'basic',
    agreeToTerms: false,
    agreeToPrivacy: false,
  });

  const updateFormData = (updates: Partial<SignupFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.organizationName && formData.organizationType && formData.organizationSize);
      case 2:
        return !!(formData.adminName && formData.adminEmail && formData.adminPassword && 
                 formData.adminPassword === formData.adminPasswordConfirm);
      case 3:
        return !!(formData.subscriptionTier && formData.agreeToTerms && formData.agreeToPrivacy);
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
      setError('');
    } else {
      setError('Please fill in all required fields');
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
    setError('');
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) {
      setError('Please complete all required fields and accept the terms');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/organizations/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create organization');
      }

      const result = await response.json();
      
      // Redirect to success page or organization dashboard
      router.push(`/organizations/welcome?org=${result.organizationId}`);
      
    } catch (error) {
      console.error('Error creating organization:', error);
      setError(error instanceof Error ? error.message : 'Failed to create organization');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Building2 className="h-12 w-12 text-amber-600 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-stone-800">Tell us about your organization</h2>
        <p className="text-stone-600">We'll customize the experience for your community</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="organizationName">Organization Name *</Label>
          <Input
            id="organizationName"
            value={formData.organizationName}
            onChange={(e) => updateFormData({ organizationName: e.target.value })}
            placeholder="Your organization name"
            required
          />
        </div>

        <div>
          <Label htmlFor="organizationType">Organization Type *</Label>
          <Select value={formData.organizationType} onValueChange={(value) => updateFormData({ organizationType: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select organization type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="treatment-center">Treatment Center</SelectItem>
              <SelectItem value="sober-living">Sober Living Home</SelectItem>
              <SelectItem value="recovery-coaching">Recovery Coaching Practice</SelectItem>
              <SelectItem value="outpatient-program">Outpatient Program</SelectItem>
              <SelectItem value="therapy-center">Therapy & Wellness Center</SelectItem>
              <SelectItem value="nonprofit">Non-Profit Recovery Organization</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="organizationSize">Expected Number of Users *</Label>
          <Select value={formData.organizationSize} onValueChange={(value) => updateFormData({ organizationSize: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select organization size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1-10">1-10 users</SelectItem>
              <SelectItem value="11-25">11-25 users</SelectItem>
              <SelectItem value="26-40">26-40 users</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="organizationDescription">Description (Optional)</Label>
          <Textarea
            id="organizationDescription"
            value={formData.organizationDescription}
            onChange={(e) => updateFormData({ organizationDescription: e.target.value })}
            placeholder="Tell us more about your organization and goals..."
            rows={3}
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <User className="h-12 w-12 text-amber-600 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-stone-800">Create your admin account</h2>
        <p className="text-stone-600">You'll be the organization administrator with full access</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="adminName">Full Name *</Label>
          <Input
            id="adminName"
            value={formData.adminName}
            onChange={(e) => updateFormData({ adminName: e.target.value })}
            placeholder="Your full name"
            required
          />
        </div>

        <div>
          <Label htmlFor="adminEmail">Email Address *</Label>
          <Input
            id="adminEmail"
            type="email"
            value={formData.adminEmail}
            onChange={(e) => updateFormData({ adminEmail: e.target.value })}
            placeholder="your@email.com"
            required
          />
        </div>

        <div>
          <Label htmlFor="adminPassword">Password *</Label>
          <Input
            id="adminPassword"
            type="password"
            value={formData.adminPassword}
            onChange={(e) => updateFormData({ adminPassword: e.target.value })}
            placeholder="Create a secure password"
            required
          />
        </div>

        <div>
          <Label htmlFor="adminPasswordConfirm">Confirm Password *</Label>
          <Input
            id="adminPasswordConfirm"
            type="password"
            value={formData.adminPasswordConfirm}
            onChange={(e) => updateFormData({ adminPasswordConfirm: e.target.value })}
            placeholder="Confirm your password"
            required
          />
          {formData.adminPassword && formData.adminPasswordConfirm && 
           formData.adminPassword !== formData.adminPasswordConfirm && (
            <p className="text-sm text-red-600 mt-1">Passwords do not match</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <CheckCircle className="h-12 w-12 text-amber-600 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-stone-800">Choose your plan</h2>
        <p className="text-stone-600">Select the plan that best fits your organization</p>
      </div>

      <div className="grid gap-4">
        <Card 
          className={`cursor-pointer transition-all ${
            formData.subscriptionTier === 'basic' 
              ? 'border-amber-500 ring-2 ring-amber-200' 
              : 'border-stone-200 hover:border-amber-300'
          }`}
          onClick={() => updateFormData({ subscriptionTier: 'basic' })}
        >
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Basic Organization</CardTitle>
                <CardDescription>Perfect for small teams and communities</CardDescription>
              </div>
              <div className="text-2xl font-bold text-amber-600">
                $49.99<span className="text-sm font-normal text-stone-600">/month</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm text-stone-600">
              <li>• Up to 40 active users</li>
              <li>• Basic progress reporting</li>
              <li>• Organization branding</li>
              <li>• Coach assignments</li>
              <li>• Email support</li>
            </ul>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all ${
            formData.subscriptionTier === 'premium' 
              ? 'border-amber-500 ring-2 ring-amber-200' 
              : 'border-stone-200 hover:border-amber-300'
          }`}
          onClick={() => updateFormData({ subscriptionTier: 'premium' })}
        >
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Premium Organization</CardTitle>
                <CardDescription>Advanced features for larger organizations</CardDescription>
              </div>
              <div className="text-2xl font-bold text-amber-600">
                $149.99<span className="text-sm font-normal text-stone-600">/month</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm text-stone-600">
              <li>• Everything in Basic</li>
              <li>• Advanced analytics dashboard</li>
              <li>• Therapist role support</li>
              <li>• Custom virtue definitions</li>
              <li>• Priority support</li>
              <li>• API access</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4 pt-4 border-t border-stone-200">
        <div className="flex items-start space-x-2">
          <Checkbox
            id="agreeToTerms"
            checked={formData.agreeToTerms}
            onCheckedChange={(checked) => updateFormData({ agreeToTerms: !!checked })}
          />
          <Label htmlFor="agreeToTerms" className="text-sm">
            I agree to the <Link href="/terms" className="text-amber-600 hover:underline">Terms of Service</Link>
          </Label>
        </div>

        <div className="flex items-start space-x-2">
          <Checkbox
            id="agreeToPrivacy"
            checked={formData.agreeToPrivacy}
            onCheckedChange={(checked) => updateFormData({ agreeToPrivacy: !!checked })}
          />
          <Label htmlFor="agreeToPrivacy" className="text-sm">
            I agree to the <Link href="/privacy" className="text-amber-600 hover:underline">Privacy Policy</Link>
          </Label>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-amber-50">
      <PublicHeader />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Progress indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-stone-600">Step {currentStep} of 3</span>
              <Link href="/organizations" className="text-sm text-amber-600 hover:underline">
                ← Back to Organizations
              </Link>
            </div>
            <div className="w-full bg-stone-200 rounded-full h-2">
              <div 
                className="bg-amber-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 3) * 100}%` }}
              />
            </div>
          </div>

          <Card>
            <CardContent className="p-8">
              {error && (
                <Alert className="mb-6 border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}

              <div className="flex justify-between mt-8 pt-6 border-t border-stone-200">
                {currentStep > 1 ? (
                  <Button variant="outline" onClick={handleBack}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                ) : (
                  <div />
                )}

                {currentStep < 3 ? (
                  <Button onClick={handleNext} className="bg-amber-600 hover:bg-amber-700 text-white">
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button 
                    onClick={handleSubmit} 
                    disabled={isSubmitting}
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    {isSubmitting ? 'Creating Organization...' : 'Create Organization'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}