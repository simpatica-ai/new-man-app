'use client';

import React from 'react';
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';

// Create styles matching the assessment report
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 36, // 0.5-inch margin
  },
  header: {
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#A8A29E',
    paddingBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#5F4339',
  },
  subtitle: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 2,
  },
  date: {
    fontSize: 10,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#5F4339',
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#5F4339',
  },
  virtueCard: {
    marginBottom: 12,
    padding: 10,
    backgroundColor: '#F5F5F4',
    borderWidth: 1,
    borderColor: '#E7E5E4',
    borderRadius: 4,
  },
  virtueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#D6D3D1',
    paddingBottom: 4,
  },
  virtueName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#5F4339',
  },
  stageInfo: {
    fontSize: 10,
    color: '#854D0E',
  },
  stageSection: {
    marginBottom: 8,
    padding: 6,
    backgroundColor: '#FAFAF9',
    borderRadius: 3,
  },
  stageTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#5F4339',
    marginBottom: 4,
  },
  stageContent: {
    fontSize: 9,
    color: '#374151',
    lineHeight: 1.3,
  },
  journalEntry: {
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#F9FAFB',
    borderLeftWidth: 3,
    borderLeftColor: '#D97706',
    borderRadius: 3,
  },
  journalDate: {
    fontSize: 9,
    color: '#6B7280',
    marginBottom: 3,
  },
  journalText: {
    fontSize: 9,
    color: '#374151',
    lineHeight: 1.3,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    padding: 10,
    backgroundColor: '#FEF3C7',
    borderRadius: 4,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92400E',
  },
  statLabel: {
    fontSize: 9,
    color: '#6B7280',
  },
  timeline: {
    marginBottom: 12,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'center',
  },
  timelineDate: {
    fontSize: 9,
    color: '#6B7280',
    width: 80,
  },
  timelineEvent: {
    fontSize: 9,
    color: '#374151',
    flex: 1,
  },
  pageNumber: {
    position: 'absolute',
    fontSize: 9,
    bottom: 12,
    left: 0,
    right: 0,
    textAnchor: 'middle',
    color: '#9CA3AF',
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 36,
    right: 36,
    fontSize: 8,
    color: '#9CA3AF',
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
  },
  noContent: {
    fontSize: 9,
    color: '#9CA3AF',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 12,
  },
});

export interface VirtueStageWork {
  virtue_id: number;
  virtue_name: string;
  stage_number: number;
  stage_title?: string;
  status: 'completed' | 'in_progress';
  started_at?: string;
  completed_at?: string;
  memo_text?: string;
  updated_at?: string;
}

export interface JournalEntry {
  id: number;
  created_at: string;
  entry_text: string;
}

export interface AssessmentResult {
  id: number;
  created_at: string;
  assessment_type: string;
  virtue_results: {
    virtue_name: string;
    priority_score: number;
    defect_intensity: number;
  }[];
}

export interface WorkProductData {
  practitioner_name: string;
  date_range: {
    start: string;
    end: string;
  };
  filter_status: 'completed' | 'in_progress' | 'both';
  virtue_stage_work: VirtueStageWork[];
  journal_entries: JournalEntry[];
  assessment_results: AssessmentResult[];
  summary_stats: {
    total_stages_completed: number;
    total_stages_in_progress: number;
    total_journal_entries: number;
    total_assessments: number;
    virtues_with_progress: number;
  };
  timeline_events: {
    date: string;
    event: string;
    type: 'stage_completion' | 'stage_start' | 'journal_entry' | 'assessment';
  }[];
}

interface WorkProductReportProps {
  data: WorkProductData;
  generated_by?: string;
  organization_name?: string;
}

const WorkProductReport = ({ data, generated_by, organization_name }: WorkProductReportProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const truncateText = (text: string, maxLength: number = 200) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <Document>
      {/* Cover Page */}
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Work Product Report</Text>
          <Text style={styles.subtitle}>Virtue Development Progress Summary</Text>
          <Text style={styles.date}>
            Report Period: {formatDate(data.date_range.start)} - {formatDate(data.date_range.end)}
          </Text>
          <Text style={styles.subtitle}>Practitioner: {data.practitioner_name}</Text>
          {organization_name && (
            <Text style={styles.subtitle}>Organization: {organization_name}</Text>
          )}
          {generated_by && (
            <Text style={styles.subtitle}>Generated by: {generated_by}</Text>
          )}
          <Text style={styles.date}>Generated on {new Date().toLocaleDateString()}</Text>
        </View>

        {/* Summary Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary Statistics</Text>
          <Text style={styles.subtitle}>
            Filter: {data.filter_status === 'both' ? 'All Stages' : 
                    data.filter_status === 'completed' ? 'Completed Stages Only' : 
                    'In Progress Stages Only'}
          </Text>
          <View style={styles.summaryStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{data.summary_stats.total_stages_completed}</Text>
              <Text style={styles.statLabel}>Stages Completed</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{data.summary_stats.total_stages_in_progress}</Text>
              <Text style={styles.statLabel}>Stages In Progress</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{data.summary_stats.total_journal_entries}</Text>
              <Text style={styles.statLabel}>Journal Entries</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{data.summary_stats.virtues_with_progress}</Text>
              <Text style={styles.statLabel}>Active Virtues</Text>
            </View>
          </View>
        </View>

        {/* Development Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Development Timeline</Text>
          <View style={styles.timeline}>
            {data.timeline_events.length > 0 ? (
              data.timeline_events.slice(0, 15).map((event, index) => (
                <View key={index} style={styles.timelineItem}>
                  <Text style={styles.timelineDate}>{formatDate(event.date)}</Text>
                  <Text style={styles.timelineEvent}>{event.event}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noContent}>No timeline events available</Text>
            )}
          </View>
        </View>

        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
          `${pageNumber} / ${totalPages}`
        )} fixed />
        
        <View style={styles.footer} fixed>
          <Text>© {new Date().getFullYear()} Simpatica AI™ (Patent Pending). All rights reserved. | For disclaimer visit: newmanapp.com/disclaimer</Text>
        </View>
      </Page>

      {/* Virtue Stage Work Details */}
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Virtue Stage Work</Text>
          <Text style={styles.subtitle}>
            Organized by virtue, then by stage ({data.filter_status === 'both' ? 'all stages' : data.filter_status + ' stages'})
          </Text>
        </View>

        {(() => {
          // Group stages by virtue, then sort by stage number
          const virtueGroups = data.virtue_stage_work.reduce((acc, stage) => {
            if (!acc[stage.virtue_name]) {
              acc[stage.virtue_name] = [];
            }
            acc[stage.virtue_name].push(stage);
            return acc;
          }, {} as Record<string, VirtueStageWork[]>);

          // Sort stages within each virtue
          Object.keys(virtueGroups).forEach(virtue => {
            virtueGroups[virtue].sort((a, b) => a.stage_number - b.stage_number);
          });

          const sortedVirtues = Object.keys(virtueGroups).sort();

          return sortedVirtues.length > 0 ? (
            sortedVirtues.map((virtueName, index) => (
              <View key={index} style={styles.virtueCard} wrap={false}>
                <View style={styles.virtueHeader}>
                  <Text style={styles.virtueName}>{virtueName}</Text>
                  <Text style={styles.stageInfo}>
                    {virtueGroups[virtueName].length} stage{virtueGroups[virtueName].length !== 1 ? 's' : ''} shown
                  </Text>
                </View>
                
                {virtueGroups[virtueName].map((stage, stageIndex) => (
                  <View key={stageIndex} style={styles.stageSection}>
                    <Text style={styles.stageTitle}>
                      Stage {stage.stage_number}{stage.stage_title ? ` - ${stage.stage_title}` : ''} ({stage.status})
                    </Text>
                    <Text style={styles.stageContent}>
                      {stage.status === 'completed' && stage.completed_at && 
                        `Completed: ${formatDate(stage.completed_at)}`}
                      {stage.status === 'in_progress' && stage.started_at && 
                        `Started: ${formatDate(stage.started_at)}`}
                      {stage.updated_at && 
                        ` | Last updated: ${formatDate(stage.updated_at)}`}
                    </Text>
                    {stage.memo_text && (
                      <Text style={styles.stageContent}>
                        {truncateText(stage.memo_text, 300)}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            ))
          ) : (
            <Text style={styles.noContent}>
              No virtue stage work found for the selected filter ({data.filter_status})
            </Text>
          );
        })()}

        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
          `${pageNumber} / ${totalPages}`
        )} fixed />
        
        <View style={styles.footer} fixed>
          <Text>© {new Date().getFullYear()} Simpatica AI™ (Patent Pending). All rights reserved. | For disclaimer visit: newmanapp.com/disclaimer</Text>
        </View>
      </Page>

      {/* Journal Entries */}
      {data.journal_entries.length > 0 && (
        <Page size="LETTER" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.title}>Journal Entries</Text>
            <Text style={styles.subtitle}>Recent reflections and insights</Text>
          </View>

          {data.journal_entries.slice(0, 10).map((entry, index) => (
            <View key={index} style={styles.journalEntry} wrap={false}>
              <Text style={styles.journalDate}>
                {formatDate(entry.created_at)}
              </Text>
              <Text style={styles.journalText}>
                {truncateText(entry.entry_text || 'No content', 400)}
              </Text>
            </View>
          ))}

          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
            `${pageNumber} / ${totalPages}`
          )} fixed />
          
          <View style={styles.footer} fixed>
            <Text>© {new Date().getFullYear()} Simpatica AI™ (Patent Pending). All rights reserved. | For disclaimer visit: newmanapp.com/disclaimer</Text>
          </View>
        </Page>
      )}

      {/* Assessment Results */}
      {data.assessment_results.length > 0 && (
        <Page size="LETTER" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.title}>Assessment Results</Text>
            <Text style={styles.subtitle}>Character development assessments</Text>
          </View>

          {data.assessment_results.map((assessment, index) => (
            <View key={index} style={styles.section} wrap={false}>
              <Text style={styles.subsectionTitle}>
                Assessment #{assessment.id} - {formatDate(assessment.created_at)}
              </Text>
              <Text style={styles.subtitle}>Type: {assessment.assessment_type}</Text>
              
              <View style={styles.virtueCard}>
                {assessment.virtue_results.slice(0, 6).map((result, resultIndex) => (
                  <View key={resultIndex} style={styles.stageSection}>
                    <View style={styles.virtueHeader}>
                      <Text style={styles.virtueName}>{result.virtue_name}</Text>
                      <Text style={styles.stageInfo}>
                        Score: {(10 - result.defect_intensity).toFixed(1)}/10
                      </Text>
                    </View>
                    <Text style={styles.stageContent}>
                      Priority Score: {result.priority_score} | Defect Intensity: {result.defect_intensity.toFixed(1)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ))}

          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
            `${pageNumber} / ${totalPages}`
          )} fixed />
          
          <View style={styles.footer} fixed>
            <Text>© {new Date().getFullYear()} Simpatica AI™ (Patent Pending). All rights reserved. | For disclaimer visit: newmanapp.com/disclaimer</Text>
          </View>
        </Page>
      )}
    </Document>
  );
};

export default WorkProductReport;