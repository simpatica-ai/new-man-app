'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  History, 
  UserPlus, 
  UserMinus, 
  RefreshCw, 
  Calendar,
  User,
  MessageSquare,
  Stethoscope
} from 'lucide-react';
import { getAssignmentHistory } from '@/lib/practitionerAssignmentService';
import type { AssignmentHistory as AssignmentHistoryType } from '@/lib/practitionerAssignmentService';

interface AssignmentHistoryProps {
  practitionerId: string;
  practitionerName?: string;
}

export default function AssignmentHistory({ 
  practitionerId, 
  practitionerName 
}: AssignmentHistoryProps) {
  const [history, setHistory] = useState<AssignmentHistoryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, [practitionerId]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const historyData = await getAssignmentHistory(practitionerId);
      setHistory(historyData);
      
    } catch (err) {
      console.error('Error loading assignment history:', err);
      setError(err instanceof Error ? err.message : 'Failed to load assignment history');
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (hasRemovedAt: boolean) => {
    if (hasRemovedAt) {
      return <UserMinus className="h-4 w-4 text-red-600" />;
    }
    return <UserPlus className="h-4 w-4 text-green-600" />;
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'coach':
        return <MessageSquare className="h-3 w-3" />;
      case 'therapist':
        return <Stethoscope className="h-3 w-3" />;
      default:
        return <User className="h-3 w-3" />;
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateDuration = (startDate: string, endDate?: string | null) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const diffInDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays < 1) return 'Less than a day';
    if (diffInDays === 1) return '1 day';
    if (diffInDays < 30) return `${diffInDays} days`;
    
    const months = Math.floor(diffInDays / 30);
    if (months === 1) return '1 month';
    if (months < 12) return `${months} months`;
    
    const years = Math.floor(months / 12);
    return years === 1 ? '1 year' : `${years} years`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <History className="h-5 w-5" />
            <span>Assignment History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <History className="h-5 w-5" />
            <span>Assignment History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600">{error}</p>
            <Button 
              variant="outline" 
              onClick={loadHistory}
              className="mt-4"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <History className="h-5 w-5" />
          <span>Assignment History</span>
        </CardTitle>
        <CardDescription>
          Complete assignment history for {practitionerName || 'this practitioner'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center py-8">
            <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No assignment history</p>
            <p className="text-sm text-gray-400 mt-1">
              Assignment changes will be tracked here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((entry, index) => (
              <div
                key={entry.id}
                className="relative flex items-start space-x-4 pb-4"
              >
                {/* Timeline line */}
                {index < history.length - 1 && (
                  <div className="absolute left-4 top-8 w-0.5 h-full bg-gray-200"></div>
                )}
                
                {/* Action icon */}
                <div className="flex-shrink-0 w-8 h-8 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center">
                  {getActionIcon(!!entry.removed_at)}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-900">
                        {entry.removed_at ? 'Assignment Removed' : 'Assignment Created'}
                      </h4>
                      <Badge
                        variant="outline"
                        className={getRoleColor(entry.supervisor_role)}
                      >
                        {getRoleIcon(entry.supervisor_role)}
                        <span className="ml-1 capitalize">{entry.supervisor_role}</span>
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(entry.assigned_at)}</span>
                    </div>
                  </div>
                  
                  <div className="mt-2 space-y-2">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Supervisor:</span> Supervisor {entry.supervisor_id.slice(0, 8)}...
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Duration:</span> {calculateDuration(entry.assigned_at, entry.removed_at)}
                      {!entry.removed_at && <span className="text-green-600 ml-1">(Active)</span>}
                    </div>
                    
                    {entry.reason && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Reason:</span> {entry.reason}
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500">
                      {entry.removed_at ? (
                        <>Removed on {formatDate(entry.removed_at)} by User {entry.removed_by?.slice(0, 8)}...</>
                      ) : (
                        <>Assigned by User {entry.assigned_by.slice(0, 8)}...</>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Database Migration Notice */}
        {history.length === 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Assignment history tracking requires database migration to be fully functional.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}