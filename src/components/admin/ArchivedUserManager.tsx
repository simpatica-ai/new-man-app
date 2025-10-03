'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  getArchivedUsers, 
  reactivateUser, 
  getArchivalStats,
  type ArchivedUser 
} from '@/lib/userArchivalService';
import { AlertCircle, UserCheck, Calendar, User } from 'lucide-react';

interface ArchivedUserManagerProps {
  organizationId: string;
}

export default function ArchivedUserManager({ organizationId }: ArchivedUserManagerProps) {
  const [archivedUsers, setArchivedUsers] = useState<ArchivedUser[]>([]);
  const [stats, setStats] = useState({
    activeUsers: 0,
    archivedUsers: 0,
    totalUsers: 0,
    recentlyArchived: 0
  });
  const [loading, setLoading] = useState(true);
  const [reactivating, setReactivating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [organizationId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [usersData, statsData] = await Promise.all([
        getArchivedUsers(organizationId),
        getArchivalStats(organizationId)
      ]);
      
      setArchivedUsers(usersData);
      setStats(statsData);
    } catch (err) {
      console.error('Error loading archived users:', err);
      setError(err instanceof Error ? err.message : 'Failed to load archived users');
    } finally {
      setLoading(false);
    }
  };

  const handleReactivate = async (userId: string) => {
    try {
      setReactivating(userId);
      setError(null);
      
      await reactivateUser(userId, organizationId);
      
      // Reload data to reflect changes
      await loadData();
    } catch (err) {
      console.error('Error reactivating user:', err);
      setError(err instanceof Error ? err.message : 'Failed to reactivate user');
    } finally {
      setReactivating(null);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleBadgeColor = (roles: string[]) => {
    if (roles.includes('admin')) return 'bg-red-100 text-red-800';
    if (roles.includes('therapist')) return 'bg-purple-100 text-purple-800';
    if (roles.includes('coach')) return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Archived Users</CardTitle>
          <CardDescription>Loading archived user data...</CardDescription>
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
      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Archived Users</p>
                <p className="text-2xl font-bold text-orange-600">{stats.archivedUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Recently Archived</p>
                <p className="text-2xl font-bold text-red-600">{stats.recentlyArchived}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Archived Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Archived Users</CardTitle>
          <CardDescription>
            Users who have been archived but can be reactivated if needed.
            Archived users don't count toward your organization's user limit.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {archivedUsers.length === 0 ? (
            <div className="text-center py-8">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No archived users found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {archivedUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {user.full_name || 'Unnamed User'}
                        </h4>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                      <div className="flex space-x-1">
                        {user.roles.map((role) => (
                          <Badge
                            key={role}
                            variant="secondary"
                            className={getRoleBadgeColor(user.roles)}
                          >
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="mt-2 text-sm text-gray-500">
                      <p>Archived: {formatDate(user.archived_at)}</p>
                      {user.last_activity && (
                        <p>Last Activity: {formatDate(user.last_activity)}</p>
                      )}
                      {user.current_virtue_id && (
                        <p>
                          Last Virtue: Virtue {user.current_virtue_id}, Stage {user.current_stage || 1}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReactivate(user.id)}
                      disabled={reactivating === user.id}
                      className="flex items-center space-x-1"
                    >
                      <UserCheck className="h-4 w-4" />
                      <span>
                        {reactivating === user.id ? 'Reactivating...' : 'Reactivate'}
                      </span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}