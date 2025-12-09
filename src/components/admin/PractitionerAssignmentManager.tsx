'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Users, 
  UserPlus, 
  AlertCircle, 
  CheckCircle, 
  UserCheck,
  MessageSquare,
  Stethoscope
} from 'lucide-react';

interface PractitionerAssignmentManagerProps {
  organizationId: string;
  currentUserId: string;
}

interface User {
  id: string;
  full_name: string | null;
  roles: string[];
  is_active: boolean;
}

interface Assignment {
  id: string;
  practitioner_id: string;
  supervisor_id: string;
  supervisor_role: 'coach' | 'therapist';
  assigned_at: string;
  assigned_by: string;
  active: boolean;
  practitioner_name: string;
  supervisor_name: string;
}

export default function PractitionerAssignmentManager({ 
  organizationId, 
  currentUserId 
}: PractitionerAssignmentManagerProps) {
  const [practitioners, setPractitioners] = useState<User[]>([]);
  const [supervisors, setSupervisors] = useState<User[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedPractitioner, setSelectedPractitioner] = useState<string>('');
  const [selectedSupervisor, setSelectedSupervisor] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<'coach' | 'therapist'>('coach');

  useEffect(() => {
    loadData();
  }, [organizationId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // TODO: Replace with actual API calls once database migration is complete
      // For now, this is a placeholder implementation
      
      // Mock data for demonstration
      setPractitioners([
        {
          id: 'user1',
          full_name: 'John Practitioner',
          roles: ['practitioner'],
          is_active: true
        },
        {
          id: 'user2', 
          full_name: 'Jane Practitioner',
          roles: ['practitioner'],
          is_active: true
        }
      ]);
      
      setSupervisors([
        {
          id: 'coach1',
          full_name: 'Dr. Smith',
          roles: ['coach'],
          is_active: true
        },
        {
          id: 'therapist1',
          full_name: 'Dr. Johnson',
          roles: ['therapist'],
          is_active: true
        }
      ]);
      
      setAssignments([
        {
          id: 'assign1',
          practitioner_id: 'user1',
          supervisor_id: 'coach1',
          supervisor_role: 'coach',
          assigned_at: new Date().toISOString(),
          assigned_by: currentUserId,
          active: true,
          practitioner_name: 'John Practitioner',
          supervisor_name: 'Dr. Smith'
        }
      ]);
      
    } catch (err) {
      console.error('Error loading assignment data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load assignment data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = async () => {
    if (!selectedPractitioner || !selectedSupervisor || !selectedRole) {
      setError('Please select a practitioner, supervisor, and role');
      return;
    }

    try {
      setIsAssigning(true);
      setError(null);
      
      // TODO: Replace with actual API call once database migration is complete
      console.log('Creating assignment:', {
        practitioner_id: selectedPractitioner,
        supervisor_id: selectedSupervisor,
        supervisor_role: selectedRole,
        organization_id: organizationId,
        assigned_by: currentUserId
      });
      
      // Mock success for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reset form
      setSelectedPractitioner('');
      setSelectedSupervisor('');
      setSelectedRole('coach');
      
      // Reload data
      await loadData();
      
    } catch (err) {
      console.error('Error creating assignment:', err);
      setError(err instanceof Error ? err.message : 'Failed to create assignment');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    try {
      setError(null);
      
      // TODO: Replace with actual API call once database migration is complete
      console.log('Removing assignment:', assignmentId);
      
      // Mock success for now
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Reload data
      await loadData();
      
    } catch (err) {
      console.error('Error removing assignment:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove assignment');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'coach':
        return <MessageSquare className="h-4 w-4" />;
      case 'therapist':
        return <Stethoscope className="h-4 w-4" />;
      default:
        return <UserCheck className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'coach':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'therapist':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Practitioner Assignments</CardTitle>
          <CardDescription>Loading assignment data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Assignment Creation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <UserPlus className="h-5 w-5" />
            <span>Create New Assignment</span>
          </CardTitle>
          <CardDescription>
            Assign practitioners to coaches or therapists for supervision and guidance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Practitioner
              </label>
              <Select value={selectedPractitioner} onValueChange={setSelectedPractitioner}>
                <SelectTrigger>
                  <SelectValue placeholder="Select practitioner" />
                </SelectTrigger>
                <SelectContent>
                  {practitioners.map((practitioner) => (
                    <SelectItem key={practitioner.id} value={practitioner.id}>
                      {practitioner.full_name || 'Unnamed User'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Supervisor
              </label>
              <Select value={selectedSupervisor} onValueChange={setSelectedSupervisor}>
                <SelectTrigger>
                  <SelectValue placeholder="Select supervisor" />
                </SelectTrigger>
                <SelectContent>
                  {supervisors.map((supervisor) => (
                    <SelectItem key={supervisor.id} value={supervisor.id}>
                      {supervisor.full_name || 'Unnamed User'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Role
              </label>
              <Select value={selectedRole} onValueChange={(value: 'coach' | 'therapist') => setSelectedRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="coach">Coach</SelectItem>
                  <SelectItem value="therapist">Therapist</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                onClick={handleCreateAssignment}
                disabled={isAssigning || !selectedPractitioner || !selectedSupervisor}
                className="w-full"
              >
                {isAssigning ? 'Creating...' : 'Create Assignment'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Assignments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Current Assignments</span>
          </CardTitle>
          <CardDescription>
            Active practitioner-supervisor relationships in your organization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No assignments found</p>
              <p className="text-sm text-gray-400 mt-1">
                Create assignments to connect practitioners with supervisors
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {assignment.practitioner_name}
                        </h4>
                        <p className="text-sm text-gray-500">
                          Assigned to {assignment.supervisor_name}
                        </p>
                        <p className="text-xs text-gray-400">
                          Since {new Date(assignment.assigned_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className={getRoleColor(assignment.supervisor_role)}
                      >
                        {getRoleIcon(assignment.supervisor_role)}
                        <span className="ml-1 capitalize">{assignment.supervisor_role}</span>
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                          Remove
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Remove Assignment</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to remove this assignment? The practitioner will no longer be supervised by this {assignment.supervisor_role}.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button variant="outline">Cancel</Button>
                          <Button 
                            variant="destructive"
                            onClick={() => handleRemoveAssignment(assignment.id)}
                          >
                            Remove Assignment
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Database Migration Notice */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Note:</strong> This interface is ready but requires database migration to be fully functional. 
          The practitioner_assignments table needs to be created first.
        </AlertDescription>
      </Alert>
    </div>
  );
}