// src/app/assessment/VirtueAssessmentPDF.tsx
'use client';

import React from 'react';
import { Document, Page, View, Text, StyleSheet, Image } from '@react-pdf/renderer';

// Create styles with earth tones and proper font sizes
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 36, // Updated for 0.5-inch margin (0.5 * 72 points = 36)
  },
  header: {
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#A8A29E',
    paddingBottom: 12,
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
  confidential: {
    fontSize: 9,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#5F4339',
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 15,
    padding: 6,
    borderWidth: 1,
    borderColor: '#D6D3D1',
    borderRadius: 4,
    backgroundColor: '#FAFAF9',
    width: '100%',
  },
  chartImage: {
    width: 350, 
    height: 'auto',
  },
  virtueGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  virtueCard: {
    width: '48%',
    marginBottom: 10,
    padding: 8,
    backgroundColor: '#F5F5F4',
    borderWidth: 1,
    borderColor: '##E7E5E4',
    borderRadius: 4,
  },
  virtueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  virtueName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#5F4339',
  },
  virtueScore: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#854D0E',
  },
  virtueAnalysis: {
    fontSize: 9,
    color: '#374151',
    lineHeight: 1.3,
  },
  summarySection: {
    marginBottom: 15,
  },
  summaryText: {
    fontSize: 10,
    color: '#374151',
    lineHeight: 1.4,
    textAlign: 'justify',
  },
  note: {
    fontSize: 8,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginTop: 12,
    textAlign: 'center',
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
  // Markdown styling
  markdownBold: {
    fontWeight: 'bold',
  },
  markdownItalic: {
    fontStyle: 'italic',
  },
});

export interface PDFResult {
  virtue: string;
  priority: number;
  defectIntensity: number;
}

interface VirtueAssessmentPDFProps {
  results: PDFResult[];
  analyses: Map<string, string>;
  summaryAnalysis: string;
  userName: string;
  chartImage: string | null;
}

// Function to parse markdown and apply formatting
const renderMarkdown = (content: string) => {
  if (!content) return <Text>No content available.</Text>;
  
  const paragraphs = content.split('\n\n');
  
  return paragraphs.map((paragraph, pIndex) => {
    const elements: React.ReactElement[] = [];
    let currentText = '';
    let inBold = false;
    let inItalic = false;
    
    for (let i = 0; i < paragraph.length; i++) {
      const char = paragraph[i];
      const nextChar = paragraph[i + 1];
      
      if (char === '*' && nextChar === '*') {
        if (currentText) {
          elements.push(
            <Text key={`text-${pIndex}-${i}`} style={inItalic ? styles.markdownItalic : {}}>
              {currentText}
            </Text>
          );
          currentText = '';
        }
        inBold = !inBold;
        i++; 
        continue;
      }
      
      if (char === '*' && nextChar !== '*') {
        if (currentText) {
          elements.push(
            <Text key={`text-${pIndex}-${i}`} style={inBold ? styles.markdownBold : {}}>
              {currentText}
            </Text>
          );
          currentText = '';
        }
        inItalic = !inItalic;
        continue;
      }
      
      currentText += char;
    }
    
    if (currentText) {
      elements.push(
        <Text key={`final-${pIndex}`} style={inBold ? styles.markdownBold : inItalic ? styles.markdownItalic : {}}>
          {currentText}
        </Text>
      );
    }
    
    return (
      <Text key={`para-${pIndex}`} style={pIndex > 0 ? { marginTop: 5 } : {}}>
        {elements}
      </Text>
    );
  });
};

const VirtueAssessmentPDF = ({ 
  results, 
  analyses, 
  summaryAnalysis, 
  userName,
  chartImage
}: VirtueAssessmentPDFProps) => {
  const sortedResults = [...results].sort((a, b) => 
    (10 - a.defectIntensity) - (10 - b.defectIntensity)
  );

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>New Man New Behaviors Virtue Pathway</Text>
          <Text style={styles.subtitle}>Personal Growth and Development Plan</Text>
          <Text style={styles.date}>Generated on {new Date().toLocaleDateString()}</Text>
          <Text style={styles.subtitle}>For: {userName}</Text>
          <Text style={styles.confidential}>Confidential - For Personal Development Use Only</Text>
        </View>

        <View style={styles.summarySection}>
          <View style={styles.summaryText}>
            {renderMarkdown(summaryAnalysis)}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pathway to Virtue</Text>
          <View style={styles.chartContainer}>
            {chartImage ? (
              <Image 
                src={chartImage} 
                style={styles.chartImage}
                alt=""
              />
            ) : (
              <Text>Chart not available</Text>
            )}
          </View>
        </View>

        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
          `${pageNumber} / ${totalPages}`
        )} fixed />
      </Page>

      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Virtue Analysis</Text>
        </View>

        <View style={styles.virtueGrid}>
          {sortedResults.map((result, index) => {
            const virtueScore = 10 - result.defectIntensity;
            const analysisText = analyses.get(result.virtue) || 
              "Analysis not yet generated.";
            
            return (
              <View key={index} style={styles.virtueCard} wrap={false}>
                <View style={styles.virtueHeader}>
                  <Text style={styles.virtueName}>{result.virtue}</Text>
                  <Text style={styles.virtueScore}>
                    {virtueScore.toFixed(1)}/10
                  </Text>
                </View>
                <View style={styles.virtueAnalysis}>
                  {renderMarkdown(analysisText)}
                </View>
              </View>
            );
          })}
        </View>

        <Text style={styles.note}>
          Note: These interpretations have been generated by AI-based analysis of the responses.
        </Text>

        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
          `${pageNumber} / ${totalPages}`
        )} fixed />
      </Page>
    </Document>
  );
};

export default VirtueAssessmentPDF;