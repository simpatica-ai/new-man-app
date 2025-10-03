export function generateDailyReportEmail(metrics: {
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
}): string {
  const { date, newUsers, totalUsers, activeUsers, aiFeedback, errors, journalEntries, assessments, supportTickets, system } = metrics;
  
  // Format date for display
  const reportDate = new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Determine alert status
  const hasAlerts = supportTickets.open > 0 || errors > 5 || (system?.cloudRun?.errorRate || 0) > 5;
  const statusColor = hasAlerts ? '#ef4444' : '#10b981';
  const statusText = hasAlerts ? 'Attention Required' : 'All Systems Normal';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Daily Report - ${reportDate}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #374151;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9fafb;
        }
        .container {
            background: white;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: #f59e0b;
            color: white;
            padding: 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 20px;
            font-weight: 600;
        }
        .header p {
            margin: 5px 0 0 0;
            opacity: 0.9;
            font-size: 13px;
        }
        .status-banner {
            background: ${statusColor};
            color: white;
            padding: 12px 20px;
            text-align: center;
            font-weight: 600;
            font-size: 14px;
        }
        .content {
            padding: 20px;
        }

        .section {
            margin-bottom: 20px;
        }
        .section h2 {
            font-size: 16px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 10px;
            padding-bottom: 5px;
            border-bottom: 1px solid #e5e7eb;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 6px 0;
            border-bottom: 1px solid #f3f4f6;
        }
        .detail-row:last-child {
            border-bottom: none;
        }
        .detail-label {
            font-size: 14px;
            color: #6b7280;
        }
        .detail-value {
            font-size: 14px;
            font-weight: 600;
            color: #1f2937;
        }
        .footer {
            background: #f8fafc;
            padding: 20px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }
        .footer p {
            margin: 0;
            font-size: 12px;
            color: #6b7280;
        }
        .footer a {
            color: #f59e0b;
            text-decoration: none;
        }
        .alert-text {
            color: #ef4444;
            font-weight: 600;
        }
        .success-text {
            color: #10b981;
            font-weight: 600;
        }
        @media (max-width: 480px) {
            .metrics-grid {
                grid-template-columns: repeat(2, 1fr);
            }
            .detail-row {
                flex-direction: column;
                align-items: flex-start;
                gap: 4px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Daily Report</h1>
            <p>${reportDate}</p>
        </div>
        
        <div class="status-banner">
            ${statusText}
        </div>
        
        <div class="content">
            <!-- Key Highlights -->
            <div class="section">
                <h2>🎯 Key Highlights</h2>
                <div class="detail-row">
                    <span class="detail-label">New Users:</span>
                    <span class="detail-value ${newUsers > 0 ? 'success-text' : ''}">${newUsers}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Support Requests:</span>
                    <span class="detail-value ${supportTickets.total > 0 ? 'alert-text' : ''}">${supportTickets.total}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">AI Feedback:</span>
                    <span class="detail-value ${aiFeedback.total > 0 ? 'success-text' : ''}">${aiFeedback.total}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Errors:</span>
                    <span class="detail-value ${errors > 5 ? 'alert-text' : ''}">${errors}</span>
                </div>
            </div>

            <!-- User Activity -->
            <div class="section">
                <h2>👥 User Activity</h2>
                <div class="detail-row">
                    <span class="detail-label">Total Users:</span>
                    <span class="detail-value">${totalUsers.toLocaleString()}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Active Users (7 days):</span>
                    <span class="detail-value">${activeUsers.toLocaleString()}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Journal Entries:</span>
                    <span class="detail-value">${journalEntries}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Assessments Completed:</span>
                    <span class="detail-value">${assessments}</span>
                </div>
            </div>

            <!-- AI Feedback Details -->
            ${aiFeedback.total > 0 ? `
            <div class="section">
                <h2>🤖 AI Feedback</h2>
                <div class="detail-row">
                    <span class="detail-label">Positive Feedback:</span>
                    <span class="detail-value success-text">${aiFeedback.positive}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Negative Feedback:</span>
                    <span class="detail-value ${aiFeedback.negative > 0 ? 'alert-text' : ''}">${aiFeedback.negative}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Satisfaction Score:</span>
                    <span class="detail-value">${aiFeedback.satisfactionScore}%</span>
                </div>
            </div>
            ` : ''}

            <!-- Support & System Health -->
            <div class="section">
                <h2>🛠️ System Health</h2>
                ${supportTickets.open > 0 ? `
                <div class="detail-row">
                    <span class="detail-label">Open Support Tickets:</span>
                    <span class="detail-value alert-text">${supportTickets.open}</span>
                </div>
                ` : ''}
                <div class="detail-row">
                    <span class="detail-label">Database Size:</span>
                    <span class="detail-value">${system.databaseSize || 0} MB</span>
                </div>
                ${system.cloudRun ? `
                <div class="detail-row">
                    <span class="detail-label">AI Service Requests:</span>
                    <span class="detail-value">${system.cloudRun.dailyRequests || 0}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">AI Response Time:</span>
                    <span class="detail-value">${system.cloudRun.avgResponseTime || 0}ms</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Monthly AI Spend:</span>
                    <span class="detail-value">$${(system.cloudRun.monthlySpend || 0).toFixed(2)}</span>
                </div>
                ` : ''}
            </div>

            <!-- Data Quality Warning -->
            ${metrics.dataQuality?.isPartial ? `
            <div class="section">
                <h2>⚠️ Data Quality Notice</h2>
                <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 15px; margin-bottom: 20px;">
                    <p style="margin: 0; color: #92400e; font-size: 14px;">
                        <strong>Partial Data Report:</strong> Some metrics may be incomplete due to data collection issues.
                    </p>
                    ${metrics.dataQuality.missingData?.length > 0 ? `
                    <p style="margin: 10px 0 0 0; color: #92400e; font-size: 12px;">
                        Missing: ${metrics.dataQuality.missingData.join(', ')}
                    </p>
                    ` : ''}
                    ${metrics.dataQuality.criticalError ? `
                    <p style="margin: 10px 0 0 0; color: #dc2626; font-size: 12px; font-weight: 600;">
                        Critical Error: ${metrics.dataQuality.criticalError}
                    </p>
                    ` : ''}
                </div>
            </div>
            ` : ''}

            <!-- Quick Actions -->
            <div class="section">
                <h2>🔗 Quick Actions</h2>
                <div style="text-align: center; margin-top: 20px;">
                    <a href="https://new-man-app.simpatica.ai/admin" 
                       style="display: inline-block; background: #f59e0b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: 600; margin: 0 8px 8px 0; font-size: 14px;">
                        Admin Panel
                    </a>
                    <a href="https://supabase.com/dashboard/org/tbpwivdxjzpuinyenive" 
                       style="display: inline-block; background: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: 600; margin: 0 8px 8px 0; font-size: 14px;">
                        Supabase
                    </a>
                    <a href="https://vercel.com/bob-wenzlaus-projects/new-man-app" 
                       style="display: inline-block; background: #000000; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: 600; margin: 0 8px 8px 0; font-size: 14px;">
                        Vercel
                    </a>
                    ${supportTickets.open > 0 ? `
                    <a href="https://new-man-app.simpatica.ai/admin?tab=support" 
                       style="display: inline-block; background: #ef4444; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: 600; margin: 0 8px 8px 0; font-size: 14px;">
                        Support Tickets
                    </a>
                    ` : ''}
                    ${aiFeedback.negative > 0 ? `
                    <a href="https://new-man-app.simpatica.ai/admin?tab=ai-feedback" 
                       style="display: inline-block; background: #8b5cf6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: 600; margin: 0 8px 8px 0; font-size: 14px;">
                        AI Feedback
                    </a>
                    ` : ''}
                    ${metrics.dataQuality?.isPartial ? `
                    <a href="https://new-man-app.simpatica.ai/admin/roadmap?tab=errors" 
                       style="display: inline-block; background: #dc2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: 600; margin: 0 8px 8px 0; font-size: 14px;">
                        System Health
                    </a>
                    ` : ''}
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p>
                Generated automatically by New Man App Daily Monitoring<br>
                <a href="https://new-man-app.simpatica.ai">Visit Dashboard</a> | 
                <a href="https://new-man-app.simpatica.ai/admin">Admin Panel</a>
            </p>
        </div>
    </div>
</body>
</html>
  `.trim();
}