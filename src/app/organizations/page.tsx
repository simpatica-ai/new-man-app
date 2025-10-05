'use client';

import { useState } from 'react';
import Link from 'next/link';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  CheckCircle, 
  ArrowRight
} from 'lucide-react';
import Footer from '@/components/Footer';
import PublicHeader from '@/components/PublicHeader';
import heroBackgroundOrg from '@/assets/hero-background-org.jpg';

export default function OrganizationsPage() {
  const [demoFormData, setDemoFormData] = useState({
    name: '',
    email: '',
    organization: '',
    organizationType: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleDemoRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/organization-demo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(demoFormData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit demo request');
      }

      setSubmitSuccess(true);
      setDemoFormData({
        name: '',
        email: '',
        organization: '',
        organizationType: '',
        message: ''
      });
    } catch (error) {
      console.error('Error submitting demo request:', error);
      // TODO: Show error message to user
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
                        <li className="flex"><span className="mr-2">•</span><span><strong>Custom Branding</strong> - Apply your organization's logo, colors, and messaging throughout the platform experience</span></li>
                        <li className="flex"><span className="mr-2">•</span><span><strong>Progress Tracking</strong> - Comprehensive reporting and engagement metrics for individual and group progress</span></li>
                      </ul>
                    </div>
                    
                    <p>
                      Whether you're a treatment center, sober living home, or recovery coaching practice, 
                      New Man App provides the tools to integrate virtue development into your existing programming 
                      and support long-term character growth.
                    </p>
                    
                    <p className="font-semibold text-amber-800">
                      Ready to enhance your recovery programming? This service is still in early development 
                      and there is no charge at this time. We'd love to work with you to see how 
                      virtue development can complement your existing services and support lasting transformation.
                    </p>
                  </div>
                </div>
                
                <div>
                  {submitSuccess ? (
                    <Card className="border-green-200 bg-green-50">
                      <CardContent className="pt-6 text-center">
                        <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-green-800 mb-2">Application Submitted!</h3>
                        <p className="text-green-700">
                          Thank you for your interest. We'll review your information and send you an invitation link to set up your organizational account within 24 hours.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardHeader>
                        <CardTitle>Get Started with Your Organization</CardTitle>
                        <CardDescription>
                          Tell us about your organization and we'll review your information to set up your account and send you an invitation to begin.
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
                          
                          <div className="grid grid-cols-3 gap-3">
                            <div></div>
                            <div></div>
                            <button 
                              type="submit" 
                              className="bg-stone-700 hover:bg-stone-800 text-white text-base py-3 rounded-lg disabled:opacity-50 font-medium transition-colors"
                              disabled={isSubmitting}
                            >
                              {isSubmitting ? 'Submitting...' : 'Get Started Now'}
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