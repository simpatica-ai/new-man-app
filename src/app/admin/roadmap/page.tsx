'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Circle, Clock, DollarSign, Users, Building } from 'lucide-react'

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-amber-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-stone-800 mb-2">New Man App - Development Roadmap</h1>
          <p className="text-stone-600">Technical and business development plan - Updated {new Date().toLocaleDateString()}</p>
        </div>

        <Tabs defaultValue="technical" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="technical">Technical Plan</TabsTrigger>
            <TabsTrigger value="business">Business Model</TabsTrigger>
            <TabsTrigger value="organizations">Organizations</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          <TabsContent value="technical" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Circle className="h-5 w-5 text-red-500" />
                  Immediate Technical Priorities
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="p-4 bg-red-50 rounded-lg">
                    <h4 className="font-semibold text-red-800 mb-2">Code Quality & Architecture</h4>
                    <ul className="text-sm text-red-700 space-y-1">
                      <li>• Break down large components (Dashboard: 20k+ lines, Assessment: 59k+ lines)</li>
                      <li>• Add comprehensive error handling with user-friendly messages</li>
                      <li>• Implement proper loading states for all async operations</li>
                      <li>• Add input validation on both client and server sides</li>
                      <li>• Centralize constants (defects array duplicated across files)</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <h4 className="font-semibold text-yellow-800 mb-2">User Experience</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• Improve mobile responsiveness for charts and assessments</li>
                      <li>• Add accessibility features (ARIA labels, keyboard navigation)</li>
                      <li>• Implement better error boundaries</li>
                      <li>• Add performance optimizations (memoization, lazy loading)</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">Security & Data</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Add server-side input validation for all API routes</li>
                      <li>• Implement rate limiting on AI-powered endpoints</li>
                      <li>• Enhance data sanitization for user inputs</li>
                      <li>• Add comprehensive logging and monitoring</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Database Schema Changes Required</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm font-mono">
                  <pre>{`-- Organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#5F4339',
  secondary_color TEXT DEFAULT '#A8A29E',
  subscription_tier TEXT DEFAULT 'basic',
  subscription_status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update profiles table
ALTER TABLE profiles ADD COLUMN organization_id UUID REFERENCES organizations(id);
ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'practitioner';

-- Virtue resources table
CREATE TABLE virtue_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  virtue_name TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  source_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`}</pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="business" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Subscription Tiers & Pricing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 border rounded-lg bg-gray-50">
                    <h4 className="font-semibold text-gray-800 mb-2">Individual</h4>
                    <p className="text-2xl font-bold text-green-600 mb-2">$9.99/mo</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Single user access</li>
                      <li>• Basic virtue assessments</li>
                      <li>• Standard reports</li>
                      <li>• Limited journal entries (50/month)</li>
                    </ul>
                  </div>
                  <div className="p-4 border rounded-lg bg-blue-50">
                    <h4 className="font-semibold text-blue-800 mb-2">Organization Basic</h4>
                    <p className="text-2xl font-bold text-blue-600 mb-2">$49.99/mo</p>
                    <ul className="text-sm text-blue-600 space-y-1">
                      <li>• Up to 25 users</li>
                      <li>• Custom branding on reports</li>
                      <li>• Unlimited assessments</li>
                      <li>• Basic analytics dashboard</li>
                    </ul>
                  </div>
                  <div className="p-4 border rounded-lg bg-purple-50">
                    <h4 className="font-semibold text-purple-800 mb-2">Organization Premium</h4>
                    <p className="text-2xl font-bold text-purple-600 mb-2">$149.99/mo</p>
                    <ul className="text-sm text-purple-600 space-y-1">
                      <li>• Up to 100 users</li>
                      <li>• Full white-label branding</li>
                      <li>• Advanced analytics</li>
                      <li>• Custom virtue resources</li>
                      <li>• Priority support</li>
                    </ul>
                  </div>
                  <div className="p-4 border rounded-lg bg-amber-50">
                    <h4 className="font-semibold text-amber-800 mb-2">Enterprise</h4>
                    <p className="text-2xl font-bold text-amber-600 mb-2">Custom</p>
                    <ul className="text-sm text-amber-600 space-y-1">
                      <li>• Unlimited users</li>
                      <li>• API access</li>
                      <li>• Custom integrations</li>
                      <li>• Dedicated support</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Projections</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Target Metrics (Year 1)</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>100 Individual users:</span>
                        <span className="font-semibold">$999/month</span>
                      </div>
                      <div className="flex justify-between">
                        <span>20 Basic organizations:</span>
                        <span className="font-semibold">$999/month</span>
                      </div>
                      <div className="flex justify-between">
                        <span>10 Premium organizations:</span>
                        <span className="font-semibold">$1,499/month</span>
                      </div>
                      <div className="flex justify-between">
                        <span>2 Enterprise clients:</span>
                        <span className="font-semibold">$2,000/month</span>
                      </div>
                      <div className="border-t pt-2 flex justify-between font-bold">
                        <span>Total Monthly Recurring Revenue:</span>
                        <span className="text-green-600">~$5,500</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg">
                        <span>Annual Revenue Potential:</span>
                        <span className="text-green-600">~$66,000</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Growth Strategy</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Target recovery centers and treatment facilities</li>
                      <li>• Partner with life coaches and therapists</li>
                      <li>• Corporate wellness programs</li>
                      <li>• Religious and spiritual organizations</li>
                      <li>• Educational institutions</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="organizations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-blue-600" />
                  Organizational Structure
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-3">Organization Admin</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Manage organization settings</li>
                      <li>• Configure branding</li>
                      <li>• Invite/remove users</li>
                      <li>• View analytics dashboard</li>
                      <li>• Manage billing</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-3">Sponsors</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• View assigned practitioners</li>
                      <li>• Access practitioner reports</li>
                      <li>• Send messages/guidance</li>
                      <li>• Track progress over time</li>
                      <li>• Generate group reports</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-lg">
                    <h4 className="font-semibold text-amber-800 mb-3">Practitioners</h4>
                    <ul className="text-sm text-amber-700 space-y-1">
                      <li>• Take virtue assessments</li>
                      <li>• Access virtue resources</li>
                      <li>• Maintain journal entries</li>
                      <li>• Communicate with sponsor</li>
                      <li>• View personal progress</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Branding & Customization Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Visual Branding</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Custom logo on reports and pages</li>
                      <li>• Organization color scheme</li>
                      <li>• Custom footer information</li>
                      <li>• Branded email templates</li>
                      <li>• Custom domain (enterprise)</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Content Customization</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Custom virtue resource library</li>
                      <li>• Organization-specific assessments</li>
                      <li>• Branded welcome messages</li>
                      <li>• Custom report templates</li>
                      <li>• Tailored virtue definitions</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-purple-600" />
                  Development Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="border-l-4 border-red-500 pl-4">
                    <h4 className="font-semibold text-red-800 mb-2">Phase 1: Foundation (Weeks 1-4)</h4>
                    <ul className="text-sm space-y-1">
                      <li className="flex items-center gap-2">
                        <Circle className="h-3 w-3 text-red-500" />
                        Refactor large components into smaller modules
                      </li>
                      <li className="flex items-center gap-2">
                        <Circle className="h-3 w-3 text-red-500" />
                        Add comprehensive error handling
                      </li>
                      <li className="flex items-center gap-2">
                        <Circle className="h-3 w-3 text-red-500" />
                        Implement database schema changes
                      </li>
                      <li className="flex items-center gap-2">
                        <Circle className="h-3 w-3 text-red-500" />
                        Create organization signup flow
                      </li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-yellow-500 pl-4">
                    <h4 className="font-semibold text-yellow-800 mb-2">Phase 2: Organizations (Weeks 5-8)</h4>
                    <ul className="text-sm space-y-1">
                      <li className="flex items-center gap-2">
                        <Circle className="h-3 w-3 text-yellow-500" />
                        Build organization management interface
                      </li>
                      <li className="flex items-center gap-2">
                        <Circle className="h-3 w-3 text-yellow-500" />
                        Implement role-based access control
                      </li>
                      <li className="flex items-center gap-2">
                        <Circle className="h-3 w-3 text-yellow-500" />
                        Add basic branding customization
                      </li>
                      <li className="flex items-center gap-2">
                        <Circle className="h-3 w-3 text-yellow-500" />
                        Create virtue resources management
                      </li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-semibold text-blue-800 mb-2">Phase 3: Payments & Advanced Features (Weeks 9-12)</h4>
                    <ul className="text-sm space-y-1">
                      <li className="flex items-center gap-2">
                        <Circle className="h-3 w-3 text-blue-500" />
                        Integrate Stripe for subscription management
                      </li>
                      <li className="flex items-center gap-2">
                        <Circle className="h-3 w-3 text-blue-500" />
                        Build analytics dashboard
                      </li>
                      <li className="flex items-center gap-2">
                        <Circle className="h-3 w-3 text-blue-500" />
                        Implement advanced branding features
                      </li>
                      <li className="flex items-center gap-2">
                        <Circle className="h-3 w-3 text-blue-500" />
                        Add mobile app optimization
                      </li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-green-500 pl-4">
                    <h4 className="font-semibold text-green-800 mb-2">Phase 4: Launch & Scale (Weeks 13-16)</h4>
                    <ul className="text-sm space-y-1">
                      <li className="flex items-center gap-2">
                        <Circle className="h-3 w-3 text-green-500" />
                        Beta testing with select organizations
                      </li>
                      <li className="flex items-center gap-2">
                        <Circle className="h-3 w-3 text-green-500" />
                        Marketing website and materials
                      </li>
                      <li className="flex items-center gap-2">
                        <Circle className="h-3 w-3 text-green-500" />
                        Customer support infrastructure
                      </li>
                      <li className="flex items-center gap-2">
                        <Circle className="h-3 w-3 text-green-500" />
                        Public launch and user acquisition
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
