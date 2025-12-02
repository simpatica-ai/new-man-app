// src/app/virtue/VirtueMemosPDF.tsx
'use client';

import React from 'react';
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';

// Create styles with earth tones matching VirtueAssessmentPDF
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
  stageSection: {
    marginBottom: 20,
    paddingTop: 12,
  },
  stageHeader: {
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E7E5E4',
  },
  stageTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#5F4339',
    marginBottom: 4,
  },
  stageDescription: {
    fontSize: 9,
    color: '#6B7280',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  statusBadge: {
    fontSize: 9,
    color: '#854D0E',
    fontWeight: 'bold',
  },
  memoContent: {
    fontSize: 10,
    color: '#374151',
    lineHeight: 1.5,
    textAlign: 'justify',
  },
  paragraph: {
    marginBottom: 8,
  },
  bold: {
    fontWeight: 'bold',
  },
  italic: {
    fontStyle: 'italic',
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
  pageNumber: {
    position: 'absolute',
    fontSize: 9,
    bottom: 12,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: '#9CA3AF',
  },
});

// Type definitions
export interface VirtueMemoStage {
  stageNumber: number;
  stageTitle: string;
  stageDescription: string;
  memoContent: string;
  status: 'not_started' | 'in_progress' | 'completed';
}

interface VirtueMemosPDFProps {
  virtueName: string;
  userName: string;
  stages: VirtueMemoStage[];
}

// Helper function to get stage display name
const getStageDisplayName = (stageNumber: number): string => {
  const stageNames: { [key: number]: string } = {
    1: 'Dismantling',
    2: 'Building',
    3: 'Practicing',
  };
  return stageNames[stageNumber] || `Stage ${stageNumber}`;
};

// Helper function to get empathetic stage title
const getEmpatheticTitle = (stageNumber: number): string => {
  const titles: { [key: number]: string } = {
    1: 'Reflections on Dismantling Character Defects',
    2: 'Reflections on Building Virtue',
    3: 'An Ongoing Virtue Practice',
  };
  return titles[stageNumber] || `Stage ${stageNumber} Reflections`;
};

// Helper function to format status
const formatStatus = (status: string): string => {
  switch (status) {
    case 'completed':
      return 'Completed';
    case 'in_progress':
      return 'In Progress';
    default:
      return 'Not Started';
  }
};

// Helper function to convert HTML to plain text (basic implementation)
const convertHTMLToText = (html: string): string => {
  if (!html) return '';
  
  // Remove HTML tags but preserve line breaks
  let text = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<p[^>]*>/gi, '')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
  
  // Clean up excessive line breaks
  text = text.replace(/\n{3,}/g, '\n\n');
  
  return text;
};

const VirtueMemosPDF = ({ virtueName, userName, stages }: VirtueMemosPDFProps) => {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Virtue Journey: {virtueName}</Text>
          <Text style={styles.subtitle}>Personal Reflections and Growth</Text>
          <Text style={styles.date}>Generated on {new Date().toLocaleDateString()}</Text>
          <Text style={styles.subtitle}>For: {userName}</Text>
        </View>

        {/* Stage Sections */}
        {stages.map((stage, index) => (
          <View key={index} style={styles.stageSection} wrap={false}>
            <View style={styles.stageHeader}>
              <Text style={styles.stageTitle}>
                {getStageDisplayName(stage.stageNumber)}: {getEmpatheticTitle(stage.stageNumber)}
              </Text>
              <Text style={styles.stageDescription}>
                {stage.stageDescription}
              </Text>
              <Text style={styles.statusBadge}>
                Status: {formatStatus(stage.status)}
              </Text>
            </View>
            
            <View style={styles.memoContent}>
              {convertHTMLToText(stage.memoContent).split('\n\n').map((paragraph, pIndex) => (
                <Text key={pIndex} style={styles.paragraph}>
                  {paragraph}
                </Text>
              ))}
            </View>
          </View>
        ))}

        {/* Page Number */}
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          fixed
        />

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>
            © {new Date().getFullYear()} Simpatica AI™ (Patent Pending). All rights reserved. | For disclaimer visit: newmanapp.com/disclaimer
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default VirtueMemosPDF;
