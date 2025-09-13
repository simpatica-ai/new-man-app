'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { AlertTriangle, Database, Wifi, Users, HardDrive } from 'lucide-react'

interface UsageMetric {
  name: string
  current: number
  limit: number
  unit: string
  icon: React.ReactNode
  color: string
}

export default function SupabaseUsageMonitor() {
  const [metrics, setMetrics] = useState<UsageMetric[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsageData()
  }, [])

  const fetchUsageData = async () => {
    try {
      // Get database size
      const { data: dbSize } = await supabase.rpc('get_database_size')
      
      // Get table counts for user activity estimation
      const { data: userCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
      
      const { data: assessmentCount } = await supabase
        .from('user_assessments')
        .select('id', { count: 'exact', head: true })

      // Estimate API usage based on assessments (rough calculation)
      const estimatedApiCalls = (assessmentCount?.length || 0) * 50 // ~50 calls per assessment

      const usageMetrics: UsageMetric[] = [
        {
          name: 'Database Size',
          current: dbSize || 0,
          limit: 500,
          unit: 'MB',
          icon: <Database className="h-4 w-4" />,
          color: 'bg-blue-500'
        },
        {
          name: 'Monthly Active Users',
          current: userCount?.length || 0,
          limit: 50000,
          unit: 'users',
          icon: <Users className="h-4 w-4" />,
          color: 'bg-green-500'
        },
        {
          name: 'API Requests (Est.)',
          current: estimatedApiCalls,
          limit: 500000,
          unit: 'requests',
          icon: <Wifi className="h-4 w-4" />,
          color: 'bg-purple-500'
        },
        {
          name: 'Storage Usage',
          current: 0, // Would need file storage queries
          limit: 1000,
          unit: 'MB',
          icon: <HardDrive className="h-4 w-4" />,
          color: 'bg-orange-500'
        }
      ]

      setMetrics(usageMetrics)
    } catch (error) {
      console.error('Failed to fetch usage data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getUsagePercentage = (current: number, limit: number) => {
    return Math.min((current / limit) * 100, 100)
  }

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600'
    if (percentage >= 75) return 'text-yellow-600'
    return 'text-green-600'
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 75) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Supabase Usage Monitor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Supabase Usage Monitor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {metrics.map((metric) => {
          const percentage = getUsagePercentage(metric.current, metric.limit)
          const isWarning = percentage >= 75
          
          return (
            <div key={metric.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {metric.icon}
                  <span className="font-medium">{metric.name}</span>
                  {isWarning && (
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  )}
                </div>
                <span className={`text-sm font-mono ${getStatusColor(percentage)}`}>
                  {metric.current.toLocaleString()} / {metric.limit.toLocaleString()} {metric.unit}
                </span>
              </div>
              
              <div className="space-y-1">
                <Progress 
                  value={percentage} 
                  className="h-2"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{percentage.toFixed(1)}% used</span>
                  <span className={getStatusColor(percentage)}>
                    {percentage >= 90 ? 'Critical' : 
                     percentage >= 75 ? 'Warning' : 'Good'}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
        
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">Free Plan Limits</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <div>• Database: 500 MB</div>
            <div>• Bandwidth: 5 GB/month</div>
            <div>• Users: 50,000 MAU</div>
            <div>• API: 500,000 requests/month</div>
            <div>• Storage: 1 GB</div>
          </div>
          <div className="mt-3 text-xs text-gray-500">
            <button 
              onClick={fetchUsageData}
              className="text-blue-600 hover:text-blue-800"
            >
              Refresh Data
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
