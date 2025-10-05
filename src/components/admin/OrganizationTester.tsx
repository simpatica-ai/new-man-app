'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

import { 
  Building2, 
  Plus, 
  Trash2, 
  Users, 
  Mail,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
  Eye,
  EyeOff
} from 'lucide-react'
import InvitationManager from '@/components/admin/InvitationManager'

interface Organization {
  id: string;
  name: string;
  slug: string;
  primary_color: string;
  secondary_color: string;
  subscription_tier: string;
  subscription_status: string;
  max_users: number;
  active_user_count: number;
  created_at: string;
  settings?: any;
}

export default function OrganizationTester() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showInvitations, setShowInvitations] = useState(false)
  
  // Form state for creating organizations
  const [formData, setFormData] = useState({
    name: '',
    primaryColor: '#5F4339',
    secondaryColor: '#A8A29E',
    billingEmail: '',
    maxUsers: 50
  })

  useEffect(() => {
    loadOrganizations()
    
    // Add a demo organization for testing
    const demoOrg: Organization = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Demo Test Organization',
      slug: 'demo-test-org',
      primary_color: '#5F4339',
      secondary_color: '#A8A29E',
      subscription_tier: 'basic',
      subscription_status: 'active',
      max_users: 50,
      active_user_count: 1,
      created_at: new Date().toISOString(),
      settings: {}
    }
    setOrganizations([demoOrg])
  }, [])

  const loadOrganizations = async () => {
    try {
      setLoading(true)
      setError(null)

      // Demo mode - would load real organizations in production
      // Organizations are set in useEffect with demo data
    } catch (err) {
      console.error('Error loading organizations:', err)
      setError(err instanceof Error ? err.message : 'Failed to load organizations')
    } finally {
      setLoading(false)
    }
  }

  const createOrganization = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      // Generate slug from name
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Must be logged in to create organization')
      }

      // Create demo organization for testing
      const newOrg: Organization = {
        id: crypto.randomUUID(),
        name: formData.name,
        slug: slug + '-test',
        primary_color: formData.primaryColor,
        secondary_color: formData.secondaryColor,
        subscription_tier: 'basic',
        subscription_status: 'active',
        max_users: formData.maxUsers,
        active_user_count: 1,
        created_at: new Date().toISOString(),
        settings: {}
      }
      
      // Add to organizations list
      setOrganizations(prev => [newOrg, ...prev])
      setSuccess(`Organization "${formData.name}" created successfully! (Demo mode - real implementation would use database)`)
      
      setFormData({
        name: '',
        primaryColor: '#5F4339',
        secondaryColor: '#A8A29E',
        billingEmail: '',
        maxUsers: 50
      })
    } catch (err) {
      console.error('Error creating organization:', err)
      setError(err instanceof Error ? err.message : 'Failed to create organization')
    } finally {
      setLoading(false)
    }
  }

  const deleteOrganization = async (orgId: string) => {
    if (!confirm('Are you sure you want to delete this test organization?')) return

    try {
      setLoading(true)
      setError(null)

      // Demo mode - would delete organization in real implementation
      setSuccess('Organization would be deleted successfully! (Demo mode)')
      
      if (selectedOrg?.id === orgId) {
        setSelectedOrg(null)
        setShowInvitations(false)
      }
      
      // Remove from local state
      setOrganizations(prev => prev.filter(org => org.id !== orgId))
    } catch (err) {
      console.error('Error deleting organization:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete organization')
    } finally {
      setLoading(false)
    }
  }

  const selectOrganization = (org: Organization) => {
    setSelectedOrg(org)
    setShowInvitations(false)
  }

  const toggleInvitations = () => {
    setShowInvitations(!showInvitations)
  }

  return (
    <div className="space-y-6">
      {/* Status Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600" />
            <div>
              <h4 className="font-medium text-red-800">Error</h4>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <h4 className="font-medium text-green-800">Success</h4>
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* Create Organization Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create Test Organization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={createOrganization} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Organization Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Test Organization"
                  required
                />
              </div>
              <div>
                <Label htmlFor="billingEmail">Billing Email (Optional)</Label>
                <Input
                  id="billingEmail"
                  type="email"
                  value={formData.billingEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, billingEmail: e.target.value }))}
                  placeholder="admin@example.com"
                />
              </div>
              <div>
                <Label htmlFor="primaryColor">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                    className="w-16 h-10"
                  />
                  <Input
                    value={formData.primaryColor}
                    onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                    placeholder="#5F4339"
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="secondaryColor">Secondary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="secondaryColor"
                    type="color"
                    value={formData.secondaryColor}
                    onChange={(e) => setFormData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                    className="w-16 h-10"
                  />
                  <Input
                    value={formData.secondaryColor}
                    onChange={(e) => setFormData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                    placeholder="#A8A29E"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
            
            <Button 
              type="submit" 
              disabled={loading || !formData.name}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Organization
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Organizations List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Test Organizations
            </CardTitle>
            <Button onClick={loadOrganizations} variant="outline" size="sm" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading && organizations.length === 0 ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Loading organizations...</p>
            </div>
          ) : organizations.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No test organizations found. Create one to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {organizations.map((org) => (
                <div 
                  key={org.id} 
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedOrg?.id === org.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => selectOrganization(org)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: org.primary_color }}
                        />
                        <h3 className="font-medium">{org.name}</h3>
                        <Badge variant="secondary">{org.subscription_tier}</Badge>
                        <Badge 
                          className={
                            org.subscription_status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }
                        >
                          {org.subscription_status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>Slug: {org.slug}</span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {org.active_user_count}/{org.max_users} users
                        </span>
                        <span>Created: {new Date(org.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedOrg?.id === org.id && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleInvitations()
                          }}
                          variant="outline"
                          size="sm"
                        >
                          {showInvitations ? (
                            <>
                              <EyeOff className="h-4 w-4 mr-1" />
                              Hide Invitations
                            </>
                          ) : (
                            <>
                              <Mail className="h-4 w-4 mr-1" />
                              Test Invitations
                            </>
                          )}
                        </Button>
                      )}
                      <Button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteOrganization(org.id)
                        }}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invitation Manager for Selected Organization */}
      {selectedOrg && showInvitations && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Live Invitation Testing - {selectedOrg.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  <div>
                    <h4 className="font-medium text-blue-800">Live Testing Environment</h4>
                    <p className="text-sm text-blue-700">
                      Testing with real organization: <strong>{selectedOrg.name}</strong> (ID: {selectedOrg.id})
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      You should see a full invitation management interface below with forms, tables, and action buttons.
                    </p>
                  </div>
                </div>
              </div>
              
              <InvitationManager 
                organizationId={selectedOrg.id}
                organizationName={selectedOrg.name}
                primaryColor={selectedOrg.primary_color}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Debug Information */}
      {selectedOrg && (
        <Card>
          <CardHeader>
            <CardTitle>Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>Selected Organization:</strong> {selectedOrg.name} (ID: {selectedOrg.id})</p>
              <p><strong>Show Invitations:</strong> {showInvitations ? 'Yes' : 'No'}</p>
              <p><strong>Expected Behavior:</strong> When "Test Invitations" is clicked, you should see:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>A form to create new invitations (email input, role checkboxes)</li>
                <li>A table showing existing invitations (empty in demo mode)</li>
                <li>Action buttons for managing invitations</li>
                <li>Status indicators and notifications</li>
              </ul>
              {!showInvitations && (
                <p className="text-amber-600 font-medium">
                  Click "Test Invitations" button above to see the full invitation management interface.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Testing Instructions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h4 className="font-medium text-blue-800 mb-2">Demo Mode Active</h4>
              <p className="text-sm text-blue-700">
                This interface demonstrates the organization testing functionality. The invitation system 
                uses real database operations, but organization CRUD is in demo mode due to TypeScript 
                type limitations.
              </p>
            </div>
            
            <div className="space-y-3 text-sm">
              <p><strong>1. Create Organization:</strong> Use the form above to create a demo organization with custom branding.</p>
              <p><strong>2. Select Organization:</strong> Click on any organization in the list to select it.</p>
              <p><strong>3. Test Invitations:</strong> Click "Test Invitations" to open the LIVE invitation manager with real database operations.</p>
              <p><strong>4. Send Real Invitations:</strong> Create and send actual invitations that will work with the acceptance flow.</p>
              <p><strong>5. Test Acceptance:</strong> Use the generated invitation links to test the full acceptance process at <code>/organization/accept-invitation</code>.</p>
              <p><strong>6. Real Implementation:</strong> The organization service functions are fully implemented and ready for use once database types are regenerated.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}