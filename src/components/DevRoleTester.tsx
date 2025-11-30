'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Users, 
  UserCheck, 
  Stethoscope, 
  Building2,
  RefreshCw,
  Eye,
  EyeOff,
  Shield
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { getUserSafely } from '@/lib/authUtils';

interface DevRoleTesterProps {
  onRoleChange?: () => void;
}

export default function DevRoleTester({ onRoleChange }: DevRoleTesterProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentRoles, setCurrentRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Only show in development
  const isDev = process.env.NODE_ENV === 'development';

  useEffect(() => {
    if (isDev) {
      loadCurrentUser();
    }
  }, [isDev]);

  const loadCurrentUser = async () => {
    try {
      const { user } = await getUserSafely();
      if (user) {
        setUserId(user.id);
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('roles')
          .eq('id', user.id)
          .single();
          
        if (profile) {
          setCurrentRoles(profile.roles || []);
        }
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const updateUserRoles = async (newRoles: string[]) => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ roles: newRoles })
        .eq('id', userId);

      if (error) {
        console.error('Error updating roles:', error);
        alert('Failed to update roles');
        return;
      }

      setCurrentRoles(newRoles);
      onRoleChange?.();
      
      // Refresh the page to apply new roles
      window.location.reload();
    } catch (error) {
      console.error('Error updating roles:', error);
      alert('Failed to update roles');
    } finally {
      setLoading(false);
    }
  };

  const rolePresets = [
    {
      name: 'Practitioner Only',
      roles: ['org-practitioner'],
      icon: UserCheck,
      color: 'bg-gray-100 text-gray-800',
      description: 'Basic practitioner access'
    },
    {
      name: 'Coach Only',
      roles: ['org-coach'],
      icon: Users,
      color: 'bg-blue-100 text-blue-800',
      description: 'Staff coach - manage practitioners only'
    },
    {
      name: 'Coach + Practitioner',
      roles: ['org-coach', 'org-practitioner'],
      icon: Users,
      color: 'bg-blue-200 text-blue-900',
      description: 'Coach with own virtue journey'
    },
    {
      name: 'Therapist Only',
      roles: ['org-therapist'],
      icon: Stethoscope,
      color: 'bg-purple-100 text-purple-800',
      description: 'Staff therapist - monitor only'
    },
    {
      name: 'Therapist + Practitioner',
      roles: ['org-therapist', 'org-practitioner'],
      icon: Stethoscope,
      color: 'bg-purple-200 text-purple-900',
      description: 'Therapist with own virtue journey'
    },
    {
      name: 'Admin + All Roles',
      roles: ['org-admin', 'org-therapist', 'org-coach', 'org-practitioner'],
      icon: Building2,
      color: 'bg-red-100 text-red-800',
      description: 'Full organization management'
    },
    {
      name: 'System Administrator',
      roles: ['sys-admin'],
      icon: Shield,
      color: 'bg-orange-100 text-orange-800',
      description: 'Global system administration'
    }
  ];

  if (!isDev) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isVisible ? (
        <Button
          onClick={() => setIsVisible(true)}
          className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg"
          size="sm"
        >
          <Settings className="h-4 w-4 mr-2" />
          Dev Tools
        </Button>
      ) : (
        <Card className="w-80 shadow-xl border-orange-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center">
                <Settings className="h-4 w-4 mr-2 text-orange-600" />
                Role Tester (Dev Only)
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(false)}
              >
                <EyeOff className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-stone-600 mb-2">Current Roles:</p>
              <div className="flex flex-wrap gap-1">
                {currentRoles.map((role) => (
                  <Badge key={role} variant="outline" className="text-xs">
                    {role.replace('org-', '')}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-stone-600 font-medium">Quick Role Switch:</p>
              {rolePresets.map((preset) => {
                const Icon = preset.icon;
                const isActive = JSON.stringify(currentRoles.sort()) === JSON.stringify(preset.roles.sort());
                
                return (
                  <Button
                    key={preset.name}
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    className={`w-full justify-start text-xs ${isActive ? preset.color : ''}`}
                    onClick={() => updateUserRoles(preset.roles)}
                    disabled={loading || isActive}
                  >
                    {loading ? (
                      <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                    ) : (
                      <Icon className="h-3 w-3 mr-2" />
                    )}
                    <div className="text-left">
                      <div className="font-medium">{preset.name}</div>
                      <div className="text-xs opacity-70">{preset.description}</div>
                    </div>
                  </Button>
                );
              })}
            </div>

            <div className="pt-2 border-t">
              <p className="text-xs text-orange-600 font-medium">
                ⚠️ Changes require page refresh
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}