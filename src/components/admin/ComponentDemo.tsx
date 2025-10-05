'use client'

import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle, Database } from 'lucide-react'

interface ComponentDemoProps {
  componentName: string;
  description: string;
  children?: React.ReactNode;
}

export default function ComponentDemo({ componentName, description, children }: ComponentDemoProps) {
  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-amber-600" />
          <div>
            <h4 className="font-medium text-amber-800">{componentName} - Demo Mode</h4>
            <p className="text-sm text-amber-700">
              {description} This component requires organizational database tables to be migrated.
            </p>
          </div>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              Database Migration Required
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              This component will be fully functional once the organizational model database tables 
              are migrated. The implementation is complete and ready for testing.
            </p>
            {children && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-2">Component Preview:</p>
                {children}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}