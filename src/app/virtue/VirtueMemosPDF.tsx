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
    fontWeight: 'bold' as const,
  },
  italic: {
    fontStyle: 'italic' as const,
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

// Helper function to parse HTML and extract formatted text segments
interface TextSegment {
  text: string;
  bold?: boolean;
  italic?: boolean;
}

const parseHTMLToSegments = (html: string): TextSegment[][] => {
  if (!html) return [];
  
  // Handle br tags - convert double br to paragraph breaks
  let cleanedHTML = html
    .replace(/<br\s*\/?>\s*<br\s*\/?>/gi, '</p><p>')
    .replace(/<br\s*\/?>/gi, ' ');
  
  // Split by closing paragraph tags to respect TipTap's paragraph structure
  const paragraphSplitter = /<\/p>/gi;
  const paragraphTexts = cleanedHTML.split(paragraphSplitter).filter(text => text.trim());
  
  const paragraphs: TextSegment[][] = [];
  
  for (let paraHTML of paragraphTexts) {
    // Remove opening tags
    paraHTML = paraHTML
      .replace(/<p[^>]*>/gi, '')
      .replace(/<(div|h[1-6]|blockquote)[^>]*>/gi, '')
      .replace(/<\/(div|h[1-6]|blockquote)>/gi, '')
      .trim();
    
    if (!paraHTML) continue;
    
    // Check if this paragraph is ONLY a short bold text (likely a header)
    const onlyBoldMatch = paraHTML.match(/^<strong>([^<]{1,50})<\/strong>$/i);
    
    if (onlyBoldMatch) {
      // This is a standalone header - add empty paragraph before it for spacing
      if (paragraphs.length > 0) {
        paragraphs.push([{ text: ' ' }]); // Add spacing paragraph
      }
    }
    
    // Parse the paragraph for formatted segments
    const segments: TextSegment[] = [];
    const formatRegex = /<(strong|b)>(.*?)<\/(strong|b)>|<(em|i)>(.*?)<\/(em|i)>|([^<]+)/gi;
    let match;
    
    while ((match = formatRegex.exec(paraHTML)) !== null) {
      if (match[1] && match[2]) {
        const text = cleanText(match[2]);
        if (text) segments.push({ text, bold: true });
      } else if (match[4] && match[5]) {
        const text = cleanText(match[5]);
        if (text) segments.push({ text, italic: true });
      } else if (match[7]) {
        const text = cleanText(match[7]);
        if (text) segments.push({ text });
      }
    }
    
    if (segments.length > 0) {
      paragraphs.push(segments);
    }
    
    // If this was a standalone header, add empty paragraph after it for spacing
    if (onlyBoldMatch) {
      paragraphs.push([{ text: ' ' }]); // Add spacing paragraph
    }
  }
  
  return paragraphs;
};

// Helper to clean HTML entities and extra tags
const cleanText = (text: string): string => {
  return text
    .replace(/<[^>]+>/g, '') // Remove any remaining HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
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
          <View key={index} style={styles.stageSection}>
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
              {parseHTMLToSegments(stage.memoContent).map((segments, pIndex) => (
                <Text key={pIndex} style={styles.paragraph}>
                  {segments.map((segment, sIndex) => (
                    <Text 
                      key={sIndex}
                      style={[
                        segment.bold && styles.bold,
                        segment.italic && styles.italic
                      ]}
                    >
                      {segment.text}
                      {sIndex < segments.length - 1 ? ' ' : ''}
                    </Text>
                  ))}
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
