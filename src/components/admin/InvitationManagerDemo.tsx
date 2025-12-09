'use client'

import { useState } from 'react'
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

interface InvitationManagerDemoProps {
  organizationId: string;
  organizationName: string;
  primaryColor?: string;
}

export default function InvitationManagerDemo({ 
  organizationId, 
  organizationName,
  primaryColor = '#5F4339'
}: InvitationManagerDemoProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showExpired, setShowExpired] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    roles: [] as string[]
  })

  const availableRoles = [
    { id: 'admin', label: 'Admin', description: 'Full organization management access' },
    { id: 'coach', label: 'Coach', description: 'Guide and support practitioners' },
    { id: 'therapist', label: 'Therapist', description: 'Clinical oversight and guidance' },
    { id: 'practitioner', label: 'Practitioner', description: 'Access to virtue development tools' }
  ]

  // Mock invitation data
  const mockInvitations = [
    {
      id: '1',
      email: 'john.doe@example.com',
      roles: ['coach'],
      expires_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      accepted_at: null,
      profiles: { full_name: 'Admin User' }
    },
    {
      id: '2',
      email: 'jane.smith@example.com',
      roles: ['therapist', 'coach'],
      expires_at: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      accepted_at: null,
      profiles: { full_name: 'Admin User' }
    },
    {
      id: '3',
      email: 'bob.wilson@example.com',
      roles: ['admin'],
      expires_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago (expired)
      created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago
      accepted_at: null,
      profiles: { full_name: 'Admin User' }
    },
    {
      id: '4',
      email: 'alice.brown@example.com',
      roles: ['practitioner'],
      expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      accepted_at: new Date().toISOString(), // accepted
      profiles: { full_name: 'Admin User' }
    }
  ]

  const filteredInvitations = showExpired 
    ? mockInvitations 
    : mockInvitations.filter(inv => !inv.accepted_at && new Date(inv.expires_at) > new Date())

  // Mock handlers
  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault()
    setToast({ message: 'Demo: Invitation would be created and sent', type: 'success' })
    setShowCreateDialog(false)
    setFormData({ email: '', roles: [] })
  }

  const handleResendInvitation = async (invitationId: string) => {
    setToast({ message: 'Demo: Invitation would be resent', type: 'success' })
  }

  const handleCancelInvitation = async (invitationId: string) => {
    setToast({ message: 'Demo: Invitation would be cancelled', type: 'success' })
  }

  const handleCopyInvitationLink = async (invitationId: string) => {
    const mockLink = `${window.location.origin}/organization/accept-invitation?token=demo-token-${invitationId}`
    try {
      await navigator.clipboard.writeText(mockLink)
      setToast({ message: 'Demo invitation link copied to clipboard', type: 'success' })
    } catch (error) {
      setToast({ message: 'Failed to copy link', type: 'error' })
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
  const getInvitationStatus = (invitation: any) => {
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
    <div className="space-y-6">
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

      {/* Demo Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <div>
            <h4 className="font-medium text-amber-800">Demo Mode</h4>
            <p className="text-sm text-amber-700">
              This is a demonstration of the invitation system. Database tables are not yet migrated, 
              so this shows mock data and simulated functionality.
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
                Organization Invitations (Demo)
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
                        disabled={formData.roles.length === 0}
                        style={{ backgroundColor: primaryColor }}
                      >
                        Send Invitation (Demo)
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredInvitations.length === 0 ? (
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
                {filteredInvitations.map((invitation) => {
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