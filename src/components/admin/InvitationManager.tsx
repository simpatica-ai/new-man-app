'use client'

import { useState, useEffect } from 'react'
import { isClientDevelopmentMode } from '@/lib/testMode'
import { supabase } from '@/lib/supabaseClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  UserPlus, 
  Mail, 
  MoreHorizontal, 
  RefreshCw, 
  Trash2, 
  Clock,
  CheckCircle,
  XCircle,
  Copy,
  AlertTriangle
} from 'lucide-react'
// import { Toast } from '@/components/Toast'

interface OrganizationInvitation {
  id: string;
  email: string;
  roles: string[];
  expires_at: string;
  created_at: string;
  accepted_at?: string;
  profiles?: {
    full_name?: string;
  };
}

interface InvitationManagerProps {
  organizationId: string;
  organizationName: string;
  primaryColor?: string;
}

export default function InvitationManager({ 
  organizationId, 
  organizationName,
  primaryColor = '#5F4339'
}: InvitationManagerProps) {
  // Initialize with some mock invitations for demo purposes
  const [invitations, setInvitations] = useState<OrganizationInvitation[]>([
    {
      id: 'demo-1',
      email: 'john.doe@example.com',
      roles: ['coach'],
      expires_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      accepted_at: undefined,
      profiles: { full_name: 'Demo Admin' }
    },
    {
      id: 'demo-2',
      email: 'jane.smith@example.com',
      roles: ['therapist', 'coach'],
      expires_at: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      accepted_at: undefined,
      profiles: { full_name: 'Demo Admin' }
    }
  ])
  const [loading, setLoading] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showExpired, setShowExpired] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    roles: [] as string[]
  })
  const [formLoading, setFormLoading] = useState(false)

  const availableRoles = [
    { id: 'admin', label: 'Admin', description: 'Full organization management access' },
    { id: 'coach', label: 'Coach', description: 'Guide and support practitioners' },
    { id: 'therapist', label: 'Therapist', description: 'Clinical oversight and guidance' },
    { id: 'practitioner', label: 'Practitioner', description: 'Access to virtue development tools' }
  ]

  // Fetch invitations
  const fetchInvitations = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      // In development, allow test mode without authentication
      const isDevelopment = isClientDevelopmentMode()
      const headers: Record<string, string> = {}
      
      if (session) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      } else if (isDevelopment) {
        headers['x-test-mode'] = 'true'
      } else {
        return // No session and not in development mode
      }

      const response = await fetch(
        `/api/organization-invitations?organizationId=${organizationId}&includeExpired=${showExpired}`,
        { headers }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch invitations')
      }

      const result = await response.json()
      setInvitations(result.invitations || [])
    } catch (error) {
      console.error('Error fetching invitations:', error)
      setToast({ message: 'Failed to load invitations', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvitations()
  }, [organizationId, showExpired])

  // Create invitation
  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      // In development, allow test mode without authentication
      const isDevelopment = isClientDevelopmentMode()
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      
      if (session) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      } else if (isDevelopment) {
        headers['x-test-mode'] = 'true'
      } else {
        throw new Error('Not authenticated')
      }

      const response = await fetch('/api/organization-invitations', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email: formData.email,
          roles: formData.roles,
          organizationId
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create invitation')
      }

      // Add the new invitation to local state since API returns mock data
      if (result.invitation) {
        const newInvitation: OrganizationInvitation = {
          id: result.invitation.id,
          email: result.invitation.email,
          roles: result.invitation.roles,
          expires_at: result.invitation.expires_at,
          created_at: new Date().toISOString(),
          accepted_at: undefined,
          profiles: { full_name: 'Current User' }
        }
        setInvitations(prev => [newInvitation, ...prev])
      }

      setToast({ message: result.message, type: 'success' })
      setShowCreateDialog(false)
      setFormData({ email: '', roles: [] })
    } catch (error) {
      console.error('Error creating invitation:', error)
      setToast({ 
        message: error instanceof Error ? error.message : 'Failed to create invitation', 
        type: 'error' 
      })
    } finally {
      setFormLoading(false)
    }
  }

  // Resend invitation
  const handleResendInvitation = async (invitationId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      // In development, allow test mode without authentication
      const isDevelopment = isClientDevelopmentMode()
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      
      if (session) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      } else if (isDevelopment) {
        headers['x-test-mode'] = 'true'
      } else {
        throw new Error('Not authenticated')
      }

      const response = await fetch('/api/organization-invitations', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ invitationId })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to resend invitation')
      }

      setToast({ message: result.message, type: 'success' })
      fetchInvitations()
    } catch (error) {
      console.error('Error resending invitation:', error)
      setToast({ 
        message: error instanceof Error ? error.message : 'Failed to resend invitation', 
        type: 'error' 
      })
    }
  }

  // Cancel invitation
  const handleCancelInvitation = async (invitationId: string) => {
    if (!confirm('Are you sure you want to cancel this invitation?')) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      // In development, allow test mode without authentication
      const isDevelopment = isClientDevelopmentMode()
      const headers: Record<string, string> = {}
      
      if (session) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      } else if (isDevelopment) {
        headers['x-test-mode'] = 'true'
      } else {
        throw new Error('Not authenticated')
      }

      const response = await fetch(`/api/organization-invitations?invitationId=${invitationId}`, {
        method: 'DELETE',
        headers
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to cancel invitation')
      }

      setToast({ message: result.message, type: 'success' })
      fetchInvitations()
    } catch (error) {
      console.error('Error canceling invitation:', error)
      setToast({ 
        message: error instanceof Error ? error.message : 'Failed to cancel invitation', 
        type: 'error' 
      })
    }
  }

  // Copy invitation link
  const handleCopyInvitationLink = async (invitationId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      // In development, allow test mode without authentication
      const isDevelopment = isClientDevelopmentMode()
      const headers: Record<string, string> = {}
      
      if (session) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      } else if (isDevelopment) {
        headers['x-test-mode'] = 'true'
      } else {
        throw new Error('Not authenticated')
      }

      const response = await fetch(`/api/organization-invitations/${invitationId}/link`, {
        headers
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to get invitation link')
      }

      await navigator.clipboard.writeText(result.invitation_link)
      setToast({ message: 'Invitation link copied to clipboard', type: 'success' })
    } catch (error) {
      console.error('Error copying invitation link:', error)
      setToast({ 
        message: error instanceof Error ? error.message : 'Failed to copy link', 
        type: 'error' 
      })
    }
  }

  // Handle role selection
  const handleRoleChange = (roleId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      roles: checked 
        ? [...prev.roles, roleId]
        : prev.roles.filter(r => r !== roleId)
    }))
  }

  // Get invitation status
  const getInvitationStatus = (invitation: OrganizationInvitation) => {
    if (invitation.accepted_at) {
      return { status: 'accepted', color: 'bg-green-100 text-green-800', icon: CheckCircle }
    }
    
    const isExpired = new Date(invitation.expires_at) < new Date()
    if (isExpired) {
      return { status: 'expired', color: 'bg-red-100 text-red-800', icon: XCircle }
    }
    
    return { status: 'pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock }
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6 border-2 border-blue-300 rounded-lg p-4 bg-blue-50/30">
      {/* Header to make it clear this is the invitation manager */}
      <div className="text-center py-4 bg-blue-100 rounded-lg border-2 border-blue-400">
        <h2 className="text-2xl font-bold text-blue-800">🎯 INVITATION MANAGER INTERFACE</h2>
        <p className="text-blue-700 mt-1">This is what you should see when clicking "Test Invitations"</p>
      </div>

      {toast && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
          toast.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          <div className="flex items-center justify-between">
            <span>{toast.message}</span>
            <button 
              onClick={() => setToast(null)}
              className="ml-4 text-lg font-bold opacity-70 hover:opacity-100"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Demo Mode Notice */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <div>
            <h4 className="font-medium text-green-800">✅ Invitation Manager - Live Email Testing!</h4>
            <p className="text-sm text-green-700">
              This interface creates real invitations and sends actual emails via SMTP! 
              Database operations are simulated, but emails will be delivered to the specified addresses.
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Organization Invitations
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Manage user invitations for {organizationName}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-expired"
                  checked={showExpired}
                  onCheckedChange={(checked) => setShowExpired(checked === true)}
                />
                <Label htmlFor="show-expired" className="text-sm">
                  Show expired
                </Label>
              </div>
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button style={{ backgroundColor: primaryColor }}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite User to {organizationName}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateInvitation} className="space-y-4">
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="user@example.com"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label>Roles</Label>
                      <div className="space-y-3 mt-2">
                        {availableRoles.map(role => (
                          <div key={role.id} className="flex items-start space-x-3">
                            <Checkbox
                              id={role.id}
                              checked={formData.roles.includes(role.id)}
                              onCheckedChange={(checked) => handleRoleChange(role.id, checked as boolean)}
                            />
                            <div className="grid gap-1.5 leading-none">
                              <Label
                                htmlFor={role.id}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {role.label}
                              </Label>
                              <p className="text-xs text-muted-foreground">
                                {role.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      {formData.roles.length === 0 && (
                        <p className="text-sm text-red-600 mt-1">
                          Please select at least one role
                        </p>
                      )}
                    </div>
                    
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowCreateDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={formLoading || formData.roles.length === 0}
                        style={{ backgroundColor: primaryColor }}
                      >
                        {formLoading ? 'Sending...' : 'Send Invitation'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p>Loading invitations...</p>
            </div>
          ) : invitations.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No invitations found. Invite users to get started.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Invited</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((invitation) => {
                  const status = getInvitationStatus(invitation)
                  const StatusIcon = status.icon
                  
                  return (
                    <TableRow key={invitation.id}>
                      <TableCell className="font-medium">
                        {invitation.email}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {invitation.roles.map(role => (
                            <Badge key={role} variant="secondary" className="text-xs">
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {status.status}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(invitation.created_at)}
                        {invitation.profiles?.full_name && (
                          <div className="text-xs">by {invitation.profiles.full_name}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(invitation.expires_at)}
                      </TableCell>
                      <TableCell>
                        {!invitation.accepted_at && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleCopyInvitationLink(invitation.id)}
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                Copy Link
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleResendInvitation(invitation.id)}
                              >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Resend
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleCancelInvitation(invitation.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Cancel
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}