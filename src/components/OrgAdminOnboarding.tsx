'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Users, 
  Settings, 
  UserPlus, 
  Rocket,
  ArrowRight,
  Building2,
  Shield,
  Heart
} from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: string;
  completed?: boolean;
}

export default function OrgAdminOnboarding() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Show onboarding if the onboarding parameter is present
    if (searchParams.get('onboarding') === 'true') {
      setIsOpen(true);
      // Remove the parameter from URL without triggering a reload
      const url = new URL(window.location.href);
      url.searchParams.delete('onboarding');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams]);

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Your Organization!',
      description: 'Congratulations! You\'re now the administrator of your organization on New Man App. You have full control over settings, team members, and organizational features.',
      icon: <Building2 className="h-8 w-8 text-purple-600" />
    },
    {
      id: 'setup',
      title: 'Configure Organization Settings',
      description: 'Customize your organization\'s profile, branding, and basic settings. This helps create a cohesive experience for your team.',
      icon: <Settings className="h-8 w-8 text-blue-600" />,
      action: 'Go to Settings Tab'
    },
    {
      id: 'team',
      title: 'Invite Your Support Team',
      description: 'Start by inviting coaches and therapists who will support your practitioners. They need to be set up before adding practitioners.',
      icon: <Shield className="h-8 w-8 text-green-600" />,
      action: 'Invite Team Members'
    },
    {
      id: 'practitioners',
      title: 'Add Practitioners',
      description: 'Once your support team is ready, invite practitioners who will use the virtue development program.',
      icon: <Users className="h-8 w-8 text-orange-600" />,
      action: 'Invite Practitioners'
    },
    {
      id: 'launch',
      title: 'You\'re Ready to Launch!',
      description: 'Your organization is set up and ready. Monitor progress, manage members, and support your team\'s virtue development journey.',
      icon: <Rocket className="h-8 w-8 text-red-600" />
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepAction = () => {
    const step = steps[currentStep];
    
    switch (step.id) {
      case 'setup':
        // Switch to Settings tab but keep modal open
        const settingsTab = document.querySelector('[data-value="Settings"]') as HTMLElement;
        if (settingsTab) {
          settingsTab.click();
        }
        // Continue to next step after a brief delay
        setTimeout(() => {
          handleNext();
        }, 500);
        break;
      case 'team':
      case 'practitioners':
        // Switch to Members tab but keep modal open
        const membersTab = document.querySelector('[data-value="Members"]') as HTMLElement;
        if (membersTab) {
          membersTab.click();
        }
        // Continue to next step after a brief delay
        setTimeout(() => {
          handleNext();
        }, 500);
        break;
      default:
        handleNext();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const currentStepData = steps[currentStep];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-red-500" />
            Organization Setup Guide
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Progress indicator */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${index <= currentStep 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                  }
                `}>
                  {index < currentStep ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`
                    w-12 h-0.5 mx-2
                    ${index < currentStep ? 'bg-blue-600' : 'bg-gray-200'}
                  `} />
                )}
              </div>
            ))}
          </div>

          {/* Current step content */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                {currentStepData.icon}
                <div>
                  <CardTitle>{currentStepData.title}</CardTitle>
                  <CardDescription className="mt-1">
                    Step {currentStep + 1} of {steps.length}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">
                {currentStepData.description}
              </p>
              
              {currentStep === 0 && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">As an Organization Administrator, you can:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Manage all organization members and their roles</li>
                    <li>• Customize organization branding and settings</li>
                    <li>• View comprehensive progress reports and analytics</li>
                    <li>• Invite and manage coaches, therapists, and practitioners</li>
                    <li>• Monitor engagement and virtue development progress</li>
                  </ul>
                </div>
              )}

              {currentStep === 1 && (
                <div className="mt-4 p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">Organization Settings Include:</h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Organization name and description</li>
                    <li>• Logo and brand colors</li>
                    <li>• Contact information and website</li>
                    <li>• Member limits and permissions</li>
                  </ul>
                </div>
              )}

              {currentStep === 2 && (
                <div className="mt-4 p-4 bg-orange-50 rounded-lg">
                  <h4 className="font-semibold text-orange-900 mb-2">Recommended Team Structure:</h4>
                  <ul className="text-sm text-orange-800 space-y-1">
                    <li>• <strong>Coaches:</strong> Provide direct guidance and support to practitioners</li>
                    <li>• <strong>Therapists:</strong> Have oversight access for therapeutic purposes</li>
                    <li>• <strong>Admins:</strong> Manage organization settings and all members</li>
                  </ul>
                </div>
              )}

              {currentStep === 4 && (
                <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-semibold text-purple-900 mb-2">Next Steps:</h4>
                  <ul className="text-sm text-purple-800 space-y-1">
                    <li>• Monitor member engagement in the Members tab</li>
                    <li>• Review progress reports in the Reports tab</li>
                    <li>• Adjust settings as your organization grows</li>
                    <li>• Reach out to support if you need assistance</li>
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation buttons */}
          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              Previous
            </Button>
            
            <div className="flex gap-2">
              <Button variant="ghost" onClick={handleClose}>
                Skip Guide
              </Button>
              
              {currentStepData.action ? (
                <Button onClick={handleStepAction} className="flex items-center gap-2">
                  {currentStepData.action}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : currentStep === steps.length - 1 ? (
                <Button onClick={handleClose} className="flex items-center gap-2">
                  Get Started
                  <Rocket className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleNext}>
                  Next
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}