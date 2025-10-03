'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  getOrganizationActivity,
  archiveUser,
  type UserActivity 
} from '@/lib/userArchivalService';
import { 
  AlertCircle, 
  Archive, 
  Calendar, 
  TrendingUp, 
  BookOpen, 
  FileText, 
  Target,
  User
} from 'lucide-react';

interface UserActivityOverviewProps {
  organizationId: string;
  currentUserId: string;
}

export default function UserActivityOverview({ 
  organizationId, 
  currentUserId 
}: UserActivityOverviewProps) {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [archiving, setArchiving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadActivities();
  }, [organizationId]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getOrganizationActivity(organizationId);
      setActivities(data);
    } catch (err) {
      console.error('Error loading user activities:', err);
      setError(err instanceof Error ? err.message : 'Failed to load user activities');
    } finally {
      setLoading(false);
    }
  };

  const handleArchiveUser = async (userId: string) => {
    if (userId === currentUserId) {
      setError('You cannot archive yourself');
      return;
    }

    try {
      setArchiving(userId);
      setError(null);
      
      await archiveUser(userId, currentUserId, organizationId);
      
      // Reload activities to reflect changes
      await loadActivities();
    } catch (err) {
      console.error('Error archiving user:', err);
      setError(err instanceof Error ? err.message : 'Failed to archive user');
    } finally {
      setArchiving(null);
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks}w ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getEngagementColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getEngagementBadge = (score: number) => {
    if (score >= 80) return { label: 'High', color: 'bg-green-100 text-green-800' };
    if (score >= 60) return { label: 'Medium', color: 'bg-yellow-100 text-yellow-800' };
    if (score >= 40) return { label: 'Low', color: 'bg-orange-100 text-orange-800' };
    return { label: 'Inactive', color: 'bg-red-100 text-red-800' };
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Activity Overview</CardTitle>
          <CardDescription>Loading user activity data...</CardDescription>
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

      {/* Activity Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>User Activity Overview</span>
          </CardTitle>
          <CardDescription>
            Monitor user engagement and activity patterns across your organization.
            Users are sorted by engagement score.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <div className="text-center py-8">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No active users found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => {
                const engagementBadge = getEngagementBadge(activity.engagementScore);
                
                return (
                  <div
                    key={activity.userId}
                    className="p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* User Header */}
                        <div className="flex items-center space-x-3 mb-3">
                          <div>
                            <h4 className="font-medium text-gray-900">
                              User {activity.userId.slice(0, 8)}...
                            </h4>
                            <p className="text-sm text-gray-500">
                              Last active: {formatDate(activity.lastLogin)}
                            </p>
                          </div>
                          <Badge
                            variant="secondary"
                            className={engagementBadge.color}
                          >
                            {engagementBadge.label}
                          </Badge>
                        </div>

                        {/* Current Virtue Progress */}
                        {activity.currentVirtue && (
                          <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                            <div className="flex items-center space-x-2 mb-2">
                              <Target className="h-4 w-4 text-blue-600" />
                              <span className="font-medium text-blue-900">
                                Current Focus: {activity.currentVirtue.name}
                              </span>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-blue-700">
                              <span>Stage {activity.currentVirtue.stage}</span>
                              <span>•</span>
                              <span>Started {formatDate(activity.currentVirtue.stageStarted)}</span>
                            </div>
                          </div>
                        )}

                        {/* Activity Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4 text-gray-500" />
                            <div>
                              <p className="text-sm font-medium">Journal Entries</p>
                              <p className="text-lg font-bold text-gray-900">
                                {activity.recentActivity.journalEntries}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <BookOpen className="h-4 w-4 text-gray-500" />
                            <div>
                              <p className="text-sm font-medium">Assessments</p>
                              <p className="text-lg font-bold text-gray-900">
                                {activity.recentActivity.assessmentsCompleted}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Target className="h-4 w-4 text-gray-500" />
                            <div>
                              <p className="text-sm font-medium">Stages Completed</p>
                              <p className="text-lg font-bold text-gray-900">
                                {activity.recentActivity.stagesCompleted}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <TrendingUp className="h-4 w-4 text-gray-500" />
                            <div>
                              <p className="text-sm font-medium">Engagement</p>
                              <p className={`text-lg font-bold ${getEngagementColor(activity.engagementScore)}`}>
                                {activity.engagementScore}%
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Engagement Progress Bar */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700">
                              Engagement Score
                            </span>
                            <span className={`text-sm font-medium ${getEngagementColor(activity.engagementScore)}`}>
                              {activity.engagementScore}%
                            </span>
                          </div>
                          <Progress 
                            value={activity.engagementScore} 
                            className="h-2"
                          />
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2 ml-4">
                        {activity.userId !== currentUserId && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleArchiveUser(activity.userId)}
                            disabled={archiving === activity.userId}
                            className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                          >
                            <Archive className="h-4 w-4" />
                            <span>
                              {archiving === activity.userId ? 'Archiving...' : 'Archive'}
                            </span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}