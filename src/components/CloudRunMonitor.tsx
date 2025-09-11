'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DollarSign, Activity, AlertTriangle, TrendingUp } from 'lucide-react';

interface CloudRunMetrics {
  monthlySpend: number;
  dailyRequests: number;
  monthlyRequests: number;
  errorRate: number;
  avgResponseTime: number;
  costPerRequest: number;
}

export default function CloudRunMonitor() {
  const [metrics, setMetrics] = useState<CloudRunMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/admin/cloud-run-metrics');
      if (!response.ok) throw new Error('Failed to fetch metrics');
      const data = await response.json();
      setMetrics(data);
      setError(null);
    } catch (err) {
      setError('Unable to fetch Cloud Run metrics');
      console.error('Metrics fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            AI Service Monitoring
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-stone-200 rounded w-3/4"></div>
            <div className="h-4 bg-stone-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const isHighSpend = metrics && metrics.monthlySpend > 100;
  const isHighErrorRate = metrics && metrics.errorRate > 5;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            AI Service Monitoring
          </CardTitle>
          <CardDescription>
            Real-time metrics from Google Cloud Run services
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Spend Alert */}
      {isHighSpend && (
        <Alert variant="destructive">
          <DollarSign className="h-4 w-4" />
          <AlertDescription>
            Monthly AI spend is ${metrics?.monthlySpend.toFixed(2)} - consider reviewing usage patterns
          </AlertDescription>
        </Alert>
      )}

      {/* Error Rate Alert */}
      {isHighErrorRate && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            High error rate detected: {metrics?.errorRate.toFixed(1)}%
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Monthly Spend */}
        <Card className={isHighSpend ? "border-red-200 bg-red-50" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Monthly Spend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${metrics?.monthlySpend.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-stone-500 mt-1">
              ${metrics?.costPerRequest.toFixed(4) || '0.0000'} per request
            </p>
          </CardContent>
        </Card>

        {/* Request Volume */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Request Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.monthlyRequests.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-stone-500 mt-1">
              {metrics?.dailyRequests || '0'} today
            </p>
          </CardContent>
        </Card>

        {/* Performance */}
        <Card className={isHighErrorRate ? "border-red-200 bg-red-50" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.avgResponseTime.toFixed(0) || '0'}ms
            </div>
            <p className="text-xs text-stone-500 mt-1">
              {metrics?.errorRate.toFixed(1) || '0'}% error rate
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="text-xs text-stone-500 text-center">
            Last updated: {new Date().toLocaleTimeString()} • 
            Data refreshes every 5 minutes
          </div>
        </CardContent>
      </Card>
    </div>
  );
}