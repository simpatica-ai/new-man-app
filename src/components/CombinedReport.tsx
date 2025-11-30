'use client';

import React from 'react';
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { WorkProductData } from './WorkProductReport';
import { PDFResult } from '../app/assessment/VirtueAssessmentPDF';

// Import the styles from both reports
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 36,
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#5F4339',
  },
  section: {
    marginBottom: 12,
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
  dividerPage: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  dividerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5F4339',
    textAlign: 'center',
  },
  dividerSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
});

interface CombinedReportProps {
  workProductData: WorkProductData;
  assessmentData?: {
    results: PDFResult[];
    analyses: Map<string, string>;
    summaryAnalysis: string;
    assessmentDate: string;
  } | null;
  generated_by?: string;
  organization_name?: string;
}

const CombinedReport = ({ 
  workProductData, 
  assessmentData, 
  generated_by, 
  organization_name 
}: CombinedReportProps) => {
  // Import the actual report components dynamically
  const WorkProductReport = require('./WorkProductReport').default;
  const VirtueAssessmentPDF = require('../app/assessment/VirtueAssessmentPDF').default;

  return (
    <Document>
      {/* Work Product Report Pages */}
      {React.cloneElement(
        <WorkProductReport 
          data={workProductData}
          generated_by={generated_by}
          organization_name={organization_name}
        />,
        { key: 'work-product' }
      ).props.children}
      
      {/* Divider Page */}
      {assessmentData && (
        <Page size="LETTER" style={[styles.page, styles.dividerPage]}>
          <View>
            <Text style={styles.dividerText}>Assessment Report</Text>
            <Text style={styles.dividerSubtext}>
              Virtue Development Assessment for {workProductData.practitioner_name}
            </Text>
            <Text style={styles.dividerSubtext}>
              Assessment Date: {new Date(assessmentData.assessmentDate).toLocaleDateString()}
            </Text>
          </View>
          
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
            `${pageNumber} / ${totalPages}`
          )} fixed />
          
          <View style={styles.footer} fixed>
            <Text>© {new Date().getFullYear()} Simpatica AI™ (Patent Pending). All rights reserved. | For disclaimer visit: newmanapp.com/disclaimer</Text>
          </View>
        </Page>
      )}
      
      {/* Assessment Report Pages */}
      {assessmentData && React.cloneElement(
        <VirtueAssessmentPDF
          results={assessmentData.results}
          analyses={assessmentData.analyses}
          summaryAnalysis={assessmentData.summaryAnalysis}
          userName={workProductData.practitioner_name}
          chartImage={null}
        />,
        { key: 'assessment' }
      ).props.children}
    </Document>
  );
};

export default CombinedReport;