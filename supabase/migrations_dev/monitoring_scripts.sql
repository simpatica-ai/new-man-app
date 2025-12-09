-- Production Migration Monitoring Scripts
-- These scripts help monitor the organizational model after migration

-- Create monitoring views for ongoing system health checks
CREATE OR REPLACE VIEW organizational_health_dashboard AS
SELECT 
  'System Overview' as category,
  'Total Organizations' as metric,
  COUNT(*)::TEXT as value,
  CASE 
    WHEN COUNT(*) > 0 THEN 'healthy'
    ELSE 'warning'
  END as status
FROM organizations

UNION ALL

SELECT 
  'System Overview',
  'Total Active Users',
  COUNT(*)::TEXT,
  CASE 
    WHEN COUNT(*) > 0 THEN 'healthy'
    ELSE 'critical'
  END
FROM profiles 
WHERE is_active = true

UNION ALL

SELECT 
  'System Overview',
  'Active Coach Assignments',
  COUNT(*)::TEXT,
  CASE 
    WHEN COUNT(*) >= 0 THEN 'healthy'
    ELSE 'warning'
  END
FROM practitioner_assignments 
WHERE supervisor_role = 'coach' AND active = true

UNION ALL

SELECT 
  'Data Integrity',
  'Users Without Organization',
  COUNT(*)::TEXT,
  CASE 
    WHEN COUNT(*) = 0 THEN 'healthy'
    WHEN COUNT(*) < 5 THEN 'warning'
    ELSE 'critical'
  END
FROM profiles 
WHERE organization_id IS NULL

UNION ALL

SELECT 
  'Data Integrity',
  'Users Without Roles',
  COUNT(*)::TEXT,
  CASE 
    WHEN COUNT(*) = 0 THEN 'healthy'
    WHEN COUNT(*) < 5 THEN 'warning'
    ELSE 'critical'
  END
FROM profiles 
WHERE roles IS NULL OR array_length(roles, 1) = 0

UNION ALL

SELECT 
  'Performance',
  'Query Performance Monitoring',
  'Not available in Supabase',
  'info'

UNION ALL

SELECT 
  'User Activity',
  'Users Active Last 24h',
  COUNT(*)::TEXT,
  CASE 
    WHEN COUNT(*) > 0 THEN 'healthy'
    ELSE 'warning'
  END
FROM profiles 
WHERE last_activity > NOW() - INTERVAL '24 hours'
AND is_active = true;

-- Create function to check organizational model health
CREATE OR REPLACE FUNCTION check_organizational_health()
RETURNS TABLE(
  category TEXT,
  metric TEXT,
  value TEXT,
  status TEXT,
  details TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ohd.category,
    ohd.metric,
    ohd.value,
    ohd.status,
    CASE ohd.status
      WHEN 'critical' THEN 'Immediate attention required'
      WHEN 'warning' THEN 'Monitor closely'
      WHEN 'healthy' THEN 'Operating normally'
      ELSE 'Unknown status'
    END as details
  FROM organizational_health_dashboard ohd
  ORDER BY 
    CASE ohd.status 
      WHEN 'critical' THEN 1 
      WHEN 'warning' THEN 2 
      WHEN 'healthy' THEN 3 
    END,
    ohd.category,
    ohd.metric;
END;
$$ LANGUAGE plpgsql;

-- Create function to monitor user login patterns
CREATE OR REPLACE FUNCTION monitor_user_login_patterns()
RETURNS TABLE(
  time_period TEXT,
  total_logins BIGINT,
  unique_users BIGINT,
  success_rate NUMERIC,
  avg_response_time NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'Last Hour' as time_period,
    COUNT(*) as total_logins,
    COUNT(DISTINCT user_id) as unique_users,
    ROUND((COUNT(*) FILTER (WHERE success = true)::NUMERIC / COUNT(*)::NUMERIC) * 100, 2) as success_rate,
    ROUND(AVG(response_time_ms), 2) as avg_response_time
  FROM auth_logs 
  WHERE created_at > NOW() - INTERVAL '1 hour'
  
  UNION ALL
  
  SELECT 
    'Last 24 Hours',
    COUNT(*),
    COUNT(DISTINCT user_id),
    ROUND((COUNT(*) FILTER (WHERE success = true)::NUMERIC / COUNT(*)::NUMERIC) * 100, 2),
    ROUND(AVG(response_time_ms), 2)
  FROM auth_logs 
  WHERE created_at > NOW() - INTERVAL '24 hours'
  
  UNION ALL
  
  SELECT 
    'Last 7 Days',
    COUNT(*),
    COUNT(DISTINCT user_id),
    ROUND((COUNT(*) FILTER (WHERE success = true)::NUMERIC / COUNT(*)::NUMERIC) * 100, 2),
    ROUND(AVG(response_time_ms), 2)
  FROM auth_logs 
  WHERE created_at > NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Create function to monitor database performance for organizational queries
-- Note: pg_stat_statements not available in Supabase, so this provides basic info
CREATE OR REPLACE FUNCTION monitor_organizational_query_performance()
RETURNS TABLE(
  query_type TEXT,
  calls BIGINT,
  total_time NUMERIC,
  mean_time NUMERIC,
  max_time NUMERIC,
  performance_status TEXT
) AS $$
BEGIN
  -- Return a message indicating performance monitoring is not available
  RETURN QUERY
  SELECT 
    'Performance Monitoring'::TEXT as query_type,
    0::BIGINT as calls,
    0::NUMERIC as total_time,
    0::NUMERIC as mean_time,
    0::NUMERIC as max_time,
    'Not available in Supabase (pg_stat_statements not enabled)'::TEXT as performance_status;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate function to fix type mismatches
DROP FUNCTION IF EXISTS monitor_organization_metrics();

-- Create function to monitor organization-specific metrics
CREATE FUNCTION monitor_organization_metrics()
RETURNS TABLE(
  organization_name TEXT,
  active_users INTEGER,
  total_assignments INTEGER,
  recent_activity_users INTEGER,
  health_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.name::TEXT as organization_name,
    COALESCE(
      (SELECT COUNT(*)::INTEGER FROM profiles WHERE organization_id = o.id AND is_active = true), 
      0
    ) as active_users,
    COALESCE(pa_count.assignment_count, 0) as total_assignments,
    COALESCE(recent_activity.recent_count, 0) as recent_activity_users,
    CASE 
      WHEN COALESCE(
        (SELECT COUNT(*)::INTEGER FROM profiles WHERE organization_id = o.id AND is_active = true), 
        0
      ) = 0 THEN 0::NUMERIC
      ELSE ROUND(
        (COALESCE(recent_activity.recent_count, 0)::NUMERIC / 
         COALESCE(
           (SELECT COUNT(*)::INTEGER FROM profiles WHERE organization_id = o.id AND is_active = true), 
           1
         )::NUMERIC) * 100, 
        2
      )
    END as health_score
  FROM organizations o
  LEFT JOIN (
    SELECT 
      organization_id,
      COUNT(*)::INTEGER as assignment_count
    FROM practitioner_assignments 
    WHERE active = true
    GROUP BY organization_id
  ) pa_count ON o.id = pa_count.organization_id
  LEFT JOIN (
    SELECT 
      organization_id,
      COUNT(*)::INTEGER as recent_count
    FROM profiles 
    WHERE last_activity > NOW() - INTERVAL '7 days'
    AND is_active = true
    GROUP BY organization_id
  ) recent_activity ON o.id = recent_activity.organization_id
  ORDER BY o.name;
END;
$$ LANGUAGE plpgsql;

-- Create function to detect potential issues
CREATE OR REPLACE FUNCTION detect_organizational_issues()
RETURNS TABLE(
  issue_type TEXT,
  severity TEXT,
  description TEXT,
  affected_count INTEGER,
  recommended_action TEXT
) AS $$
BEGIN
  -- Check for users without organizations
  INSERT INTO temp_issues
  SELECT 
    'Data Integrity' as issue_type,
    'HIGH' as severity,
    'Users without organization assignment' as description,
    COUNT(*)::INTEGER as affected_count,
    'Assign users to appropriate organizations' as recommended_action
  FROM profiles 
  WHERE organization_id IS NULL
  HAVING COUNT(*) > 0;
  
  -- Check for users without roles
  INSERT INTO temp_issues
  SELECT 
    'Data Integrity',
    'HIGH',
    'Users without role assignment',
    COUNT(*)::INTEGER,
    'Assign appropriate roles to users'
  FROM profiles 
  WHERE roles IS NULL OR array_length(roles, 1) = 0
  HAVING COUNT(*) > 0;
  
  -- Check for inactive organizations with active users
  INSERT INTO temp_issues
  SELECT 
    'Business Logic',
    'MEDIUM',
    'Inactive organizations with active users',
    COUNT(*)::INTEGER,
    'Review organization status or deactivate users'
  FROM organizations o
  JOIN profiles p ON o.id = p.organization_id
  WHERE p.is_active = true -- Removed subscription_status check as column may not exist
  HAVING COUNT(*) > 0;
  
  -- Check for organizations near user limits (if columns exist)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'max_users') 
  AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'active_user_count') THEN
    INSERT INTO temp_issues
    SELECT 
      'Capacity Planning',
      'LOW',
      'Organizations near user limits',
      COUNT(*)::INTEGER,
      'Monitor user growth and plan capacity'
    FROM organizations 
    WHERE active_user_count > (max_users * 0.8)
    HAVING COUNT(*) > 0;
  END IF;
  
  -- Performance monitoring not available in Supabase
  -- pg_stat_statements extension not enabled
  
  RETURN QUERY SELECT * FROM temp_issues;
END;
$$ LANGUAGE plpgsql;

-- Create monitoring alerts function
CREATE OR REPLACE FUNCTION generate_monitoring_alerts()
RETURNS TABLE(
  alert_level TEXT,
  alert_message TEXT,
  metric_value TEXT,
  threshold TEXT,
  alert_timestamp TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  -- Critical alerts
  RETURN QUERY
  SELECT 
    'CRITICAL' as alert_level,
    'High number of users without organization assignment' as alert_message,
    COUNT(*)::TEXT as metric_value,
    '0' as threshold,
    NOW() as alert_timestamp
  FROM profiles 
  WHERE organization_id IS NULL
  HAVING COUNT(*) > 5
  
  UNION ALL
  
  SELECT 
    'INFO',
    'Query performance monitoring unavailable',
    'Not available in Supabase',
    'N/A',
    NOW() as alert_timestamp
  
  UNION ALL
  
  -- Warning alerts
  SELECT 
    'WARNING',
    'Low user activity in last 24 hours',
    COUNT(*)::TEXT,
    '10% of active users',
    NOW() as alert_timestamp
  FROM profiles 
  WHERE last_activity > NOW() - INTERVAL '24 hours' AND is_active = true
  HAVING COUNT(*) < (SELECT COUNT(*) * 0.1 FROM profiles WHERE is_active = true)
  
  UNION ALL
  
  SELECT 
    'INFO',
    'Organization capacity monitoring disabled',
    'max_users or active_user_count columns not available',
    'N/A',
    NOW() as alert_timestamp
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'organizations' AND column_name = 'max_users'
  ) OR NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'organizations' AND column_name = 'active_user_count'
  )
  
  UNION ALL
  
  -- Info alerts
  SELECT 
    'INFO',
    'System operating normally',
    'All metrics within acceptable ranges',
    'N/A',
    NOW() as alert_timestamp
  WHERE NOT EXISTS (
    SELECT 1 FROM profiles WHERE organization_id IS NULL
  );
END;
$$ LANGUAGE plpgsql;

-- Create daily health check report
CREATE OR REPLACE FUNCTION daily_health_check_report()
RETURNS TEXT AS $$
DECLARE
  report_text TEXT := '';
  health_record RECORD;
  issue_record RECORD;
  alert_record RECORD;
BEGIN
  report_text := '=== ORGANIZATIONAL MODEL DAILY HEALTH REPORT ===' || E'\n';
  report_text := report_text || 'Generated: ' || NOW() || E'\n\n';
  
  -- System health overview
  report_text := report_text || '--- SYSTEM HEALTH OVERVIEW ---' || E'\n';
  FOR health_record IN SELECT * FROM check_organizational_health() LOOP
    report_text := report_text || health_record.category || ' - ' || 
                   health_record.metric || ': ' || health_record.value || 
                   ' (' || health_record.status || ')' || E'\n';
  END LOOP;
  
  report_text := report_text || E'\n--- DETECTED ISSUES ---' || E'\n';
  
  -- Create temporary table for issues
  CREATE TEMP TABLE temp_issues (
    issue_type TEXT,
    severity TEXT,
    description TEXT,
    affected_count INTEGER,
    recommended_action TEXT
  );
  
  -- Get issues
  FOR issue_record IN SELECT * FROM detect_organizational_issues() LOOP
    report_text := report_text || '[' || issue_record.severity || '] ' || 
                   issue_record.description || ' (Affected: ' || 
                   issue_record.affected_count || ')' || E'\n';
    report_text := report_text || '  Action: ' || issue_record.recommended_action || E'\n';
  END LOOP;
  
  -- Clean up temp table
  DROP TABLE temp_issues;
  
  report_text := report_text || E'\n--- ACTIVE ALERTS ---' || E'\n';
  FOR alert_record IN SELECT * FROM generate_monitoring_alerts() LOOP
    report_text := report_text || '[' || alert_record.alert_level || '] ' || 
                   alert_record.alert_message || E'\n';
    report_text := report_text || '  Value: ' || alert_record.metric_value || 
                   ' (Threshold: ' || alert_record.threshold || ')' || E'\n';
  END LOOP;
  
  report_text := report_text || E'\n--- ORGANIZATION METRICS ---' || E'\n';
  FOR health_record IN SELECT * FROM monitor_organization_metrics() LOOP
    report_text := report_text || health_record.organization_name || ': ' ||
                   health_record.active_users || ' users, ' ||
                   health_record.total_assignments || ' assignments, ' ||
                   'Health Score: ' || health_record.health_score || '%' || E'\n';
  END LOOP;
  
  report_text := report_text || E'\n=== END REPORT ===' || E'\n';
  
  RETURN report_text;
END;
$$ LANGUAGE plpgsql;

-- Create function to log monitoring events
CREATE TABLE IF NOT EXISTS monitoring_events (
  id SERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  message TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION log_monitoring_event(
  p_event_type TEXT,
  p_severity TEXT,
  p_message TEXT,
  p_details JSONB DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO monitoring_events (event_type, severity, message, details)
  VALUES (p_event_type, p_severity, p_message, p_details);
END;
$$ LANGUAGE plpgsql;

-- Create automated monitoring check (to be run via cron)
CREATE OR REPLACE FUNCTION automated_monitoring_check()
RETURNS VOID AS $$
DECLARE
  critical_issues INTEGER := 0;
  warning_issues INTEGER := 0;
  health_status TEXT;
BEGIN
  -- Count critical and warning issues
  SELECT COUNT(*) INTO critical_issues
  FROM generate_monitoring_alerts()
  WHERE alert_level = 'CRITICAL';
  
  SELECT COUNT(*) INTO warning_issues
  FROM generate_monitoring_alerts()
  WHERE alert_level = 'WARNING';
  
  -- Determine overall health status
  IF critical_issues > 0 THEN
    health_status := 'CRITICAL';
  ELSIF warning_issues > 0 THEN
    health_status := 'WARNING';
  ELSE
    health_status := 'HEALTHY';
  END IF;
  
  -- Log monitoring event
  PERFORM log_monitoring_event(
    'HEALTH_CHECK',
    health_status,
    'Automated monitoring check completed',
    jsonb_build_object(
      'critical_issues', critical_issues,
      'warning_issues', warning_issues,
      'check_time', NOW()
    )
  );
  
  -- If critical issues, could trigger external alerts here
  IF critical_issues > 0 THEN
    RAISE NOTICE 'CRITICAL: % critical issues detected in organizational model', critical_issues;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Usage examples and documentation
COMMENT ON FUNCTION check_organizational_health() IS 'Returns overall health status of organizational model';
COMMENT ON FUNCTION monitor_user_login_patterns() IS 'Monitors user authentication patterns and success rates';
COMMENT ON FUNCTION monitor_organizational_query_performance() IS 'Tracks database query performance for organizational features';
COMMENT ON FUNCTION monitor_organization_metrics() IS 'Provides metrics for each organization';
COMMENT ON FUNCTION detect_organizational_issues() IS 'Detects potential issues in organizational model';
COMMENT ON FUNCTION generate_monitoring_alerts() IS 'Generates alerts based on system thresholds';
COMMENT ON FUNCTION daily_health_check_report() IS 'Generates comprehensive daily health report';
COMMENT ON FUNCTION automated_monitoring_check() IS 'Automated monitoring function for cron jobs';

-- Example usage queries
/*
-- Check overall system health
SELECT * FROM check_organizational_health();

-- Monitor query performance
SELECT * FROM monitor_organizational_query_performance();

-- Get organization metrics
SELECT * FROM monitor_organization_metrics();

-- Generate daily report
SELECT daily_health_check_report();

-- Check for alerts
SELECT * FROM generate_monitoring_alerts();

-- Run automated monitoring
SELECT automated_monitoring_check();
*/