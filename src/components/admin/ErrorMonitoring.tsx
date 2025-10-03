'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, RefreshCw, TrendingUp, Users, Clock, Code } from 'lucide-react'
import { getErrorStats, getErrorSummary, type ErrorLog } from '@/lib/errorLogging'

export default function ErrorMonitoring() {
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([])
  const [errorSummary, setErrorSummary] = useState<{ error_message: string; count: number; latest_occurrence: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState(7)
  const [tableExists, setTableExists] = useState(true)

  const loadErrorData = async () => {
    setLoading(true)
    try {
      const [logs, summary] = await Promise.all([
        getErrorStats(timeRange),
        getErrorSummary(timeRange)
      ])
      setErrorLogs(logs)
      setErrorSummary(summary)
    } catch (error) {
      console.error('Failed to load error data:', error)
      // Handle missing table gracefully
      if (error?.code === 'PGRST205' || error?.message?.includes('error_logs')) {
        setErrorLogs([])
        setErrorSummary([])
        setTableExists(false)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadErrorData()
  }, [timeRange])

  const totalErrors = errorLogs.length
  const uniqueUsers = new Set(errorLogs.filter(log => log.user_id).map(log => log.user_id)).size
  const topErrors = errorSummary.slice(0, 5)

  const getSeverityColor = (context: string) => {
    if (context.includes('Assessment') || context.includes('Database')) return 'destructive'
    if (context.includes('Network') || context.includes('API')) return 'secondary'
    return 'outline'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-stone-800">Error Monitoring</h2>
          <p className="text-stone-600">Track application errors and user experience issues</p>
        </div>
        <div className="flex items-center gap-2">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(Number(e.target.value))}
            className="px-3 py-2 border rounded-md"
          >
            <option value={1}>Last 24 hours</option>
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
          </select>
          <Button onClick={loadErrorData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {!tableExists ? (
        <Card className="col-span-full">
          <CardContent className="text-center py-8">
            <div className="mx-auto mb-4 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Code className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-stone-800 mb-2">Error Monitoring Setup Required</h3>
            <p className="text-stone-600 mb-4">
              The error_logs table needs to be created in your database to enable error monitoring.
            </p>
            <div className="bg-stone-100 p-4 rounded-lg text-left max-w-2xl mx-auto">
              <p className="text-sm font-medium text-stone-700 mb-2">Run this SQL in your Supabase SQL Editor:</p>
              <code className="text-xs text-stone-600 block whitespace-pre-wrap">
{`CREATE TABLE error_logs (
  id SERIAL PRIMARY KEY,
  error_message TEXT NOT NULL,
  error_code VARCHAR(50),
  context VARCHAR(100) NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  user_agent TEXT,
  url TEXT,
  stack_trace TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_error_logs_created_at ON error_logs(created_at DESC);`}
              </code>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Errors</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalErrors}</div>
            <p className="text-xs text-stone-500">Last {timeRange} days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Affected Users</CardTitle>
            <Users className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{uniqueUsers}</div>
            <p className="text-xs text-stone-500">Unique users with errors</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {totalErrors > 0 ? (totalErrors / timeRange).toFixed(1) : '0'}
            </div>
            <p className="text-xs text-stone-500">Errors per day</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Errors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            Most Common Errors
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-stone-500">Loading error data...</div>
          ) : topErrors.length === 0 ? (
            <div className="text-center py-8 text-green-600">
              🎉 No errors found in the selected time range!
            </div>
          ) : (
            <div className="space-y-3">
              {topErrors.map((error, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={getSeverityColor(error.context)}>
                        {error.context}
                      </Badge>
                      <span className="text-sm font-mono text-stone-600">{error.error_code}</span>
                    </div>
                    <p className="text-sm text-stone-700 truncate max-w-md">
                      {error.error_message}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-red-600">{error.count}</div>
                    <div className="text-xs text-stone-500">occurrences</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Errors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Errors
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-stone-500">Loading recent errors...</div>
          ) : errorLogs.length === 0 ? (
            <div className="text-center py-8 text-green-600">
              No recent errors found!
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {errorLogs.slice(0, 20).map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-3 bg-stone-50 rounded-lg text-sm">
                  <div className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={getSeverityColor(log.context)} className="text-xs">
                        {log.context}
                      </Badge>
                      <span className="text-xs text-stone-500">
                        {new Date(log.created_at!).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-stone-700 truncate">{log.error_message}</p>
                    {log.url && (
                      <p className="text-xs text-stone-500 truncate mt-1">
                        URL: {log.url}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      </>
      )}
    </div>
  )
}
