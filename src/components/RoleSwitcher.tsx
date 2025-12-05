'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  getRoleContext, 
  type RoleContext, 
  type UserRole 
} from '@/lib/rbacService';
import { 
  ChevronDown, 
  Shield, 
  UserCog, 
  Users, 
  User,
  Crown,
  Stethoscope,
  MessageCircle
} from 'lucide-react';

interface RoleSwitcherProps {
  userId: string;
  onRoleChange?: (role: UserRole) => void;
  className?: string;
}

const ROLE_CONFIG: Record<UserRole, {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description: string;
}> = {
  admin: {
    label: 'Administrator',
    icon: Crown,
    color: 'bg-red-100 text-red-800 border-red-200',
    description: 'Full organization management access'
  },
  therapist: {
    label: 'Therapist',
    icon: Stethoscope,
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    description: 'Clinical oversight and therapeutic guidance'
  },
  coach: {
    label: 'Coach',
    icon: MessageCircle,
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Practitioner guidance and support'
  },
  practitioner: {
    label: 'Practitioner',
    icon: User,
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    description: 'Personal virtue development journey'
  }
};

export default function RoleSwitcher({ 
  userId, 
  onRoleChange, 
  className = '' 
}: RoleSwitcherProps) {
  const [roleContext, setRoleContext] = useState<RoleContext | null>(null);
  const [activeRole, setActiveRole] = useState<UserRole>('practitioner');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRoleContext();
  }, [userId]);

  const loadRoleContext = async () => {
    try {
      setLoading(true);
      const context = await getRoleContext(userId);
      
      if (context) {
        setRoleContext(context);
        setActiveRole(context.activeRole);
      }
    } catch (error) {
      console.error('Error loading role context:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (role: UserRole) => {
    setActiveRole(role);
    onRoleChange?.(role);
  };

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="animate-pulse bg-gray-200 h-8 w-32 rounded"></div>
      </div>
    );
  }

  if (!roleContext || roleContext.availableRoles.length <= 1) {
    // Single role or no roles - show simple badge
    const config = ROLE_CONFIG[activeRole];
    const Icon = config.icon;
    
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Badge variant="outline" className={config.color}>
          <Icon className="h-3 w-3 mr-1" />
          {config.label}
        </Badge>
      </div>
    );
  }

  // Multi-role user - show dropdown
  const activeConfig = ROLE_CONFIG[activeRole];
  const ActiveIcon = activeConfig.icon;

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            className={`${activeConfig.color} border hover:bg-opacity-80`}
          >
            <ActiveIcon className="h-3 w-3 mr-2" />
            {activeConfig.label}
            <ChevronDown className="h-3 w-3 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Switch Role</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {roleContext.availableRoles.map((role) => {
            const config = ROLE_CONFIG[role];
            const Icon = config.icon;
            const isActive = role === activeRole;
            
            return (
              <DropdownMenuItem
                key={role}
                onClick={() => handleRoleChange(role)}
                className={`cursor-pointer ${isActive ? 'bg-gray-50' : ''}`}
              >
                <div className="flex items-start space-x-3 w-full">
                  <Icon className="h-4 w-4 mt-0.5 text-gray-600" />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{config.label}</span>
                      {isActive && (
                        <Badge variant="secondary" className="text-xs">
                          Active
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {config.description}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}