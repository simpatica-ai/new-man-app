'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Users, 
  UserCheck, 
  Building2, 
  Stethoscope,
  ChevronDown 
} from 'lucide-react';

interface SimpleRoleSwitcherProps {
  userRoles: string[];
  currentRole: string;
  organizationSlug?: string;
}

export default function SimpleRoleSwitcher({ userRoles, currentRole, organizationSlug }: SimpleRoleSwitcherProps) {
  const router = useRouter();
  
  const roleConfig = {
    'org-practitioner': {
      label: 'Practitioner',
      icon: UserCheck,
      path: '/',
      description: 'Your virtue journey'
    },
    'org-coach': {
      label: 'Coach',
      icon: Users,
      path: '/practitioners',
      description: 'Manage practitioners'
    },
    'org-therapist': {
      label: 'Therapist',
      icon: Stethoscope,
      path: '/practitioners',
      description: 'Organization oversight'
    },
    'org-admin': {
      label: 'Admin',
      icon: Building2,
      path: '/practitioners',
      description: 'Organization management'
    }
  };

  // Filter roles to only show ones the user has
  const availableRoles = userRoles.filter(role => roleConfig[role as keyof typeof roleConfig]);

  // Don't show switcher if user only has one role
  if (availableRoles.length <= 1) {
    return null;
  }

  const currentRoleConfig = roleConfig[currentRole as keyof typeof roleConfig];
  const CurrentIcon = currentRoleConfig?.icon || Users;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center space-x-2">
          <CurrentIcon className="h-4 w-4" />
          <span>{currentRoleConfig?.label || 'Switch Role'}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {availableRoles.map((role) => {
          const config = roleConfig[role as keyof typeof roleConfig];
          const Icon = config.icon;
          const isActive = role === currentRole;
          
          return (
            <DropdownMenuItem
              key={role}
              onClick={() => router.push(config.path)}
              className={`flex items-center space-x-3 ${isActive ? 'bg-amber-50' : ''}`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-amber-600' : 'text-stone-600'}`} />
              <div className="flex-1">
                <div className={`font-medium ${isActive ? 'text-amber-800' : 'text-stone-800'}`}>
                  {config.label}
                </div>
                <div className="text-xs text-stone-600">
                  {config.description}
                </div>
              </div>
              {isActive && (
                <div className="w-2 h-2 bg-amber-600 rounded-full" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}