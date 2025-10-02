import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import nodemailer from 'nodemailer';
import { generateDailyReportEmail } from '@/lib/emailTemplate';

export async function GET(request: NextRequest) {
  const startTime = new Date();
  console.log('Daily report generation started at:', startTime.toISOString());

  try {
    // Verify request comes from Vercel Cron
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      console.warn('Unauthorized daily report request attempt');
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    // Collect metrics data
    console.log('Starting metrics collection...');
    const metrics = await collectDailyMetrics();
    
    // Log data quality status
    if (metrics.dataQuality?.isPartial) {
      console.warn('Metrics collection completed with partial data:', metrics.dataQuality.missingData);
    } else {
      console.log('Metrics collection completed successfully');
    }
    
    // Generate and send email
    console.log('Sending daily report email...');
    const emailResult = await sendDailyReport(metrics);

    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();
    
    console.log(`Daily report completed successfully in ${duration}ms`);

    return NextResponse.json({ 
      success: true, 
      message: 'Daily report sent successfully',
      timestamp: endTime.toISOString(),
      duration: `${duration}ms`,
      emailMessageId: emailResult.messageId,
      metrics: {
        date: metrics.date,
        newUsers: metrics.newUsers,
        totalUsers: metrics.totalUsers,
        activeUsers: metrics.activeUsers,
        aiFeedbackCount: metrics.aiFeedback.total,
        errorCount: metrics.errors,
        supportTickets: metrics.supportTickets.total
      },
      dataQuality: metrics.dataQuality || { isPartial: false, missingData: [] }
    });

  } catch (error) {
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();
    
    console.error('Daily report generation failed after', duration + 'ms:', error);
    
    // Try to send a failure notification email if possible
    try {
      const failureMetrics = {
        date: new Date().toISOString().split('T')[0],
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: endTime.toISOString(),
        duration: `${duration}ms`
      };
      
      // Send minimal failure notification
      await sendFailureNotification(failureMetrics);
      console.log('Failure notification sent');
    } catch (emailError) {
      console.error('Failed to send failure notification:', emailError);
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to generate daily report',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: endTime.toISOString(),
        duration: `${duration}ms`
      }, 
      { status: 500 }
    );
  }
}

// Data collection functions
async function collectDailyMetrics() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  console.log('Collecting metrics for date:', yesterdayStr);

  const collectionErrors: string[] = [];
  let partialData = false;

  try {
    // Use service role client to bypass RLS
    const { createClient } = await import('@supabase/supabase-js');
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Initialize default values
    let aiFeedback = { total: 0, positive: 0, negative: 0 };
    let newUsers = 0;
    let journalEntries = 0;
    let assessments = 0;
    let errors = 0;
    let supportTickets = { total: 0, open: 0 };
    let totalUsers = 0;
    let activeUsers = 0;

    // Collect AI Feedback metrics with error handling
    try {
      const { data: aiFeedbackData, error: aiFeedbackError } = await adminSupabase
        .from('ai_prompt_feedback')
        .select('feedback_type')
        .gte('created_at', `${yesterdayStr}T00:00:00Z`)
        .lt('created_at', `${yesterdayStr}T23:59:59Z`);

      if (aiFeedbackError) throw aiFeedbackError;

      aiFeedback = {
        total: aiFeedbackData?.length || 0,
        positive: aiFeedbackData?.filter(f => f.feedback_type === 'positive').length || 0,
        negative: aiFeedbackData?.filter(f => f.feedback_type === 'negative').length || 0
      };
    } catch (error) {
      console.error('Failed to collect AI feedback metrics:', error);
      collectionErrors.push('AI feedback data unavailable');
      partialData = true;
    }

    // Collect user activity metrics with error handling
    try {
      const { data: profilesData, error: profilesError } = await adminSupabase
        .from('profiles')
        .select('id, created_at')
        .gte('created_at', `${yesterdayStr}T00:00:00Z`)
        .lt('created_at', `${yesterdayStr}T23:59:59Z`);

      if (profilesError) throw profilesError;
      newUsers = profilesData?.length || 0;
    } catch (error) {
      console.error('Failed to collect new user metrics:', error);
      collectionErrors.push('New user data unavailable');
      partialData = true;
    }

    // Collect journal entries with error handling
    try {
      const { data: journalData, error: journalError } = await adminSupabase
        .from('journal_entries')
        .select('id')
        .gte('created_at', `${yesterdayStr}T00:00:00Z`)
        .lt('created_at', `${yesterdayStr}T23:59:59Z`);

      if (journalError) throw journalError;
      journalEntries = journalData?.length || 0;
    } catch (error) {
      console.error('Failed to collect journal entry metrics:', error);
      collectionErrors.push('Journal entry data unavailable');
      partialData = true;
    }

    // Collect assessments with error handling
    try {
      const { data: assessmentData, error: assessmentError } = await adminSupabase
        .from('user_assessments')
        .select('id')
        .gte('created_at', `${yesterdayStr}T00:00:00Z`)
        .lt('created_at', `${yesterdayStr}T23:59:59Z`);

      if (assessmentError) throw assessmentError;
      assessments = assessmentData?.length || 0;
    } catch (error) {
      console.error('Failed to collect assessment metrics:', error);
      collectionErrors.push('Assessment data unavailable');
      partialData = true;
    }

    // Collect error logs with error handling
    try {
      const { data: errorData, error: errorLogError } = await adminSupabase
        .from('error_logs')
        .select('id')
        .gte('created_at', `${yesterdayStr}T00:00:00Z`)
        .lt('created_at', `${yesterdayStr}T23:59:59Z`);

      if (errorLogError) throw errorLogError;
      errors = errorData?.length || 0;
    } catch (error) {
      console.error('Failed to collect error log metrics:', error);
      collectionErrors.push('Error log data unavailable');
      partialData = true;
    }

    // Collect support tickets with error handling
    try {
      const { data: supportData, error: supportError } = await adminSupabase
        .from('support_tickets')
        .select('id, status')
        .gte('created_at', `${yesterdayStr}T00:00:00Z`)
        .lt('created_at', `${yesterdayStr}T23:59:59Z`);

      if (supportError) throw supportError;

      supportTickets = {
        total: supportData?.length || 0,
        open: supportData?.filter(t => t.status === 'open').length || 0
      };
    } catch (error) {
      console.error('Failed to collect support ticket metrics:', error);
      collectionErrors.push('Support ticket data unavailable');
      partialData = true;
    }

    // Get total user count with error handling
    try {
      const { data: totalUsersData, error: totalUsersError } = await adminSupabase
        .from('profiles')
        .select('id', { count: 'exact' });

      if (totalUsersError) throw totalUsersError;
      totalUsers = totalUsersData?.length || 0;
    } catch (error) {
      console.error('Failed to collect total user count:', error);
      collectionErrors.push('Total user count unavailable');
      partialData = true;
    }

    // Get active users with error handling
    try {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const { data: { users: authUsers }, error: authError } = await adminSupabase.auth.admin.listUsers();
      if (authError) throw authError;

      activeUsers = authUsers?.filter(user => {
        if (!user.last_sign_in_at) return false;
        const lastLogin = new Date(user.last_sign_in_at);
        return lastLogin > weekAgo;
      }).length || 0;
    } catch (error) {
      console.error('Failed to collect active user metrics:', error);
      collectionErrors.push('Active user data unavailable');
      partialData = true;
    }

    // Get database size (optional, non-critical)
    let databaseSize = 0;
    try {
      const { data: dbSize } = await adminSupabase.rpc('get_database_size');
      databaseSize = dbSize || 0;
    } catch (error) {
      console.log('Database size function not available (non-critical):', error);
    }

    // Try to get Cloud Run metrics (optional, non-critical)
    let cloudRunMetrics = null;
    try {
      const cloudResponse = await fetch(`${process.env.SITE_URL}/api/admin/cloud-run-metrics`, {
        timeout: 5000 // 5 second timeout
      });
      if (cloudResponse.ok) {
        cloudRunMetrics = await cloudResponse.json();
      }
    } catch (error) {
      console.log('Cloud Run metrics not available (non-critical):', error);
    }

    // Calculate AI satisfaction score
    const aiSatisfactionScore = aiFeedback.total > 0 
      ? (aiFeedback.positive / aiFeedback.total * 100).toFixed(1)
      : 'N/A';

    // Log collection status
    if (partialData) {
      console.warn('Daily report generated with partial data. Missing:', collectionErrors.join(', '));
    } else {
      console.log('Daily report data collection completed successfully');
    }

    return {
      date: yesterdayStr,
      newUsers,
      totalUsers,
      activeUsers,
      aiFeedback: {
        ...aiFeedback,
        satisfactionScore: aiSatisfactionScore
      },
      errors,
      journalEntries,
      assessments,
      supportTickets,
      system: {
        databaseSize,
        cloudRun: cloudRunMetrics ? {
          monthlySpend: cloudRunMetrics.monthlySpend,
          dailyRequests: cloudRunMetrics.dailyRequests,
          errorRate: cloudRunMetrics.errorRate,
          avgResponseTime: cloudRunMetrics.avgResponseTime
        } : null
      },
      dataQuality: {
        isPartial: partialData,
        missingData: collectionErrors
      }
    };

  } catch (error) {
    console.error('Critical error during metrics collection:', error);
    
    // Return minimal structure with error information
    return {
      date: yesterdayStr,
      newUsers: 0,
      totalUsers: 0,
      activeUsers: 0,
      aiFeedback: { total: 0, positive: 0, negative: 0, satisfactionScore: 'N/A' },
      errors: 0,
      journalEntries: 0,
      assessments: 0,
      supportTickets: { total: 0, open: 0 },
      system: {
        databaseSize: 0,
        cloudRun: null
      },
      dataQuality: {
        isPartial: true,
        missingData: ['Critical database connection failure'],
        criticalError: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

// Email sending function
async function sendDailyReport(metrics: {
  date: string;
  newUsers: number;
  totalUsers: number;
  activeUsers: number;
  aiFeedback: { positive: number; negative: number; total: number };
  errors: number;
  journalEntries: number;
  assessments: number;
  supportTickets: { open: number; closed: number };
  system?: { cloudRun?: { errorRate?: number } };
  dataQuality?: { isPartial?: boolean; criticalError?: string };
}) {

  // Check for required environment variables
  const gmailUser = process.env.GMAIL_USER;
  const gmailPassword = process.env.GMAIL_APP_PASSWORD;
  const reportEmail = process.env.DAILY_REPORT_EMAIL;

  if (!gmailUser || !gmailPassword) {
    throw new Error('Gmail credentials not configured');
  }

  if (!reportEmail) {
    throw new Error('Daily report email recipient not configured');
  }

  // Create transporter using Gmail SMTP (same as existing email endpoints)
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailPassword,
    },
  });

  // Generate email content
  const htmlContent = generateDailyReportEmail(metrics);
  
  // Determine subject based on alerts
  const hasAlerts = metrics.supportTickets.open > 0 || metrics.errors > 5;
  const subject = hasAlerts 
    ? `🚨 Daily Report - ${metrics.date} - Attention Required`
    : `📊 Daily Report - ${metrics.date} - All Systems Normal`;

  // Email options (following same pattern as sponsor emails)
  const mailOptions = {
    from: `"A New Man App Monitor" <${gmailUser}>`,
    to: reportEmail,
    subject: subject,
    html: htmlContent,
  };

  try {
    console.log('Sending daily report email to:', reportEmail);
    const result = await transporter.sendMail(mailOptions);
    console.log('Daily report email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Failed to send daily report email:', error);
    throw new Error(`Email delivery failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Failure notification function
async function sendFailureNotification(failureInfo: { error: string; timestamp: string; details?: string }) {

  const gmailUser = process.env.GMAIL_USER;
  const gmailPassword = process.env.GMAIL_APP_PASSWORD;
  const reportEmail = process.env.DAILY_REPORT_EMAIL;

  if (!gmailUser || !gmailPassword || !reportEmail) {
    console.log('Cannot send failure notification - email not configured');
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailPassword,
    },
  });

  const failureHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">🚨 Daily Report Failed</h1>
        <p style="margin: 5px 0 0 0; opacity: 0.9;">${failureInfo.date}</p>
      </div>
      
      <div style="background: white; border: 1px solid #e5e7eb; border-top: none; padding: 30px; border-radius: 0 0 8px 8px;">
        <h2 style="color: #dc2626; margin-top: 0;">Report Generation Failed</h2>
        
        <div style="background: #fee2e2; border: 1px solid #fecaca; border-radius: 6px; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #991b1b; font-weight: 600;">Error Details:</p>
          <p style="margin: 10px 0 0 0; color: #991b1b; font-family: monospace; font-size: 14px;">
            ${failureInfo.error}
          </p>
        </div>
        
        <div style="margin: 20px 0;">
          <p><strong>Timestamp:</strong> ${failureInfo.timestamp}</p>
          <p><strong>Duration:</strong> ${failureInfo.duration}</p>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="https://new-man-app.simpatica.ai/admin/roadmap?tab=errors" 
             style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
            Check System Health
          </a>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
          <p>This is an automated failure notification from New Man App Daily Monitoring</p>
        </div>
      </div>
    </div>
  `;

  const mailOptions = {
    from: `"A New Man App Monitor" <${gmailUser}>`,
    to: reportEmail,
    subject: `🚨 Daily Report Failed - ${failureInfo.date}`,
    html: failureHtml,
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log('Failure notification sent:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Failed to send failure notification:', error);
    throw error;
  }
}