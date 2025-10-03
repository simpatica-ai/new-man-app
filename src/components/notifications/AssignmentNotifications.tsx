'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, CheckCircle, UserPlus, UserMinus, RefreshCw, X } from 'lucide-react';

interface AssignmentNotification {
  id: string;
  type: 'assignment_created' | 'assignment_removed' | 'assignment_reassigned';
  title: string;
  message: string;
  practitioner_name: string;
  supervisor_name: string;
  supervisor_role: 'coach' | 'therapist';
  created_at: string;
  read: boolean;
  organization_id: string;
}

interface AssignmentNotificationsProps {
  userId: string;
  organizationId?: string;
}

export default function AssignmentNotifications({ 
  userId, 
  organizationId 
}: AssignmentNotificationsProps) {
  const [notifications, setNotifications] = useState<AssignmentNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
  }, [userId, organizationId]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      
      // TODO: Replace with actual API call once notification system is implemented
      // For now, this is a placeholder implementation
      
      // Mock notifications for demonstration
      const mockNotifications: AssignmentNotification[] = [
        {
          id: 'notif1',
          type: 'assignment_created',
          title: 'New Assignment',
          message: 'You have been assigned as a coach to John Practitioner',
          practitioner_name: 'John Practitioner',
          supervisor_name: 'You',
          supervisor_role: 'coach',
          created_at: new Date().toISOString(),
          read: false,
          organization_id: organizationId || ''
        },
        {
          id: 'notif2',
          type: 'assignment_reassigned',
          title: 'Assignment Updated',
          message: 'Jane Practitioner has been reassigned to Dr. Smith',
          practitioner_name: 'Jane Practitioner',
          supervisor_name: 'Dr. Smith',
          supervisor_role: 'therapist',
          created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          read: true,
          organization_id: organizationId || ''
        }
      ];
      
      setNotifications(mockNotifications);
      setUnreadCount(mockNotifications.filter(n => !n.read).length);
      
    } catch (error) {
      console.error('Error loading assignment notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      // TODO: Replace with actual API call
      console.log('Marking notification as read:', notificationId);
      
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
      
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const dismissNotification = async (notificationId: string) => {
    try {
      // TODO: Replace with actual API call
      console.log('Dismissing notification:', notificationId);
      
      const notification = notifications.find(n => n.id === notificationId);
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'assignment_created':
        return <UserPlus className="h-4 w-4 text-green-600" />;
      case 'assignment_removed':
        return <UserMinus className="h-4 w-4 text-red-600" />;
      case 'assignment_reassigned':
        return <RefreshCw className="h-4 w-4 text-blue-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'assignment_created':
        return 'border-l-green-500 bg-green-50';
      case 'assignment_removed':
        return 'border-l-red-500 bg-red-50';
      case 'assignment_reassigned':
        return 'border-l-blue-500 bg-blue-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Assignment Notifications</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Assignment Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="bg-red-100 text-red-800">
                {unreadCount} new
              </Badge>
            )}
          </div>
        </CardTitle>
        <CardDescription>
          Stay updated on practitioner assignment changes
        </CardDescription>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No notifications</p>
            <p className="text-sm text-gray-400 mt-1">
              Assignment notifications will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border-l-4 rounded-r-lg ${getNotificationColor(notification.type)} ${
                  !notification.read ? 'shadow-sm' : 'opacity-75'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900">
                          {notification.title}
                        </h4>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 mt-1">
                        {notification.message}
                      </p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(notification.created_at)}
                        </span>
                        <Badge 
                          variant="outline" 
                          className={
                            notification.supervisor_role === 'coach'
                              ? 'text-blue-700 border-blue-200'
                              : 'text-purple-700 border-purple-200'
                          }
                        >
                          {notification.supervisor_role}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1 ml-2">
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(notification.id)}
                        className="h-8 w-8 p-0"
                        title="Mark as read"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => dismissNotification(notification.id)}
                      className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                      title="Dismiss"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}