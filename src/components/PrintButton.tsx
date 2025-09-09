// src/components/PrintButton.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import VirtueAssessmentPDF from '@/app/assessment/VirtueAssessmentPDF';
import { useState } from 'react';
import { convertChartToImage } from '@/utils/chartToImage';

interface VirtueResult {
  virtue: string;
  score: number;
  description?: string;
}

interface PrintButtonProps {
  results: VirtueResult[];
  analyses: Map<string, string>;
  summaryAnalysis: string;
  userName: string;
}

const PrintButton = ({ results, analyses, summaryAnalysis, userName }: PrintButtonProps) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handlePrint = async () => {
    setIsGenerating(true);
    try {
      console.log('Starting PDF generation...');
      
      // Convert the EXISTING chart to an image
      let chartImage = null;
      try {
        console.log('Attempting to capture existing chart...');
        chartImage = await convertChartToImage();
        console.log('Chart capture result:', chartImage ? 'Success' : 'Failed');
      } catch (chartError) {
        console.warn('Failed to capture chart:', chartError);
        // If chart capture fails, we'll proceed without it
      }

      // Create the PDF
      console.log('Creating PDF document...');
      const pdfDoc = (
        <VirtueAssessmentPDF
          results={results}
          analyses={analyses}
          summaryAnalysis={summaryAnalysis || "No summary analysis available."}
          userName={userName}
          chartImage={chartImage}
        />
      );
      
      // Generate the PDF as a blob
      console.log('Generating PDF blob...');
      const blob = await pdf(pdfDoc).toBlob();
      
      // Download the PDF
      console.log('Downloading PDF...');
      saveAs(blob, `Virtue_Assessment_${userName}_${new Date().toISOString().split('T')[0]}.pdf`);
      
      console.log('PDF generation completed successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button onClick={handlePrint} disabled={isGenerating} className="flex-1 text-xs h-8">
      <Printer className="h-3 w-3 mr-1" />
      {isGenerating ? 'Generating...' : 'Download PDF'}
    </Button>
  );
};

export default PrintButton;