'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { FileText, Download, Filter, Users, BarChart3, AlertCircle } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import { generateWorkProductData, getAvailableVirtuesForPractitioner, WorkProductFilters } from '@/lib/workProductService';
import WorkProductReport, { WorkProductData } from './WorkProductReport';
import { supabase } from '@/lib/supabaseClient';



interface Practitioner {
  id: string;
  full_name: string;
}

interface WorkProductReportGeneratorProps {
  practitioners: Practitioner[];
  current_user_name?: string;
  organization_name?: string;
  current_user_id?: string;
  is_supervisor?: boolean; // true if user can see multiple practitioners
}

export default function WorkProductReportGenerator({ 
  practitioners, 
  current_user_name,
  organization_name,
  current_user_id,
  is_supervisor = false
}: WorkProductReportGeneratorProps) {
  const [selectedPractitioner, setSelectedPractitioner] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'completed' | 'in_progress' | 'both'>('both');
  const [availableVirtues, setAvailableVirtues] = useState<{id: number, name: string}[]>([]);
  const [selectedVirtues, setSelectedVirtues] = useState<number[]>([]);
  const [includeAssessmentReport, setIncludeAssessmentReport] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewData, setPreviewData] = useState<WorkProductData | null>(null);
  const [assessmentData, setAssessmentData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-select current user if not a supervisor
  useEffect(() => {
    if (!is_supervisor && current_user_id && practitioners.length > 0) {
      const currentUserAsPractitioner = practitioners.find(p => p.id === current_user_id);
      if (currentUserAsPractitioner) {
        setSelectedPractitioner(current_user_id);
      }
    }
  }, [is_supervisor, current_user_id, practitioners]);

  // Load available virtues when practitioner changes
  useEffect(() => {
    if (selectedPractitioner) {
      loadAvailableVirtues();
    } else {
      setAvailableVirtues([]);
      setSelectedVirtues([]);
    }
  }, [selectedPractitioner]);

  const loadAvailableVirtues = async () => {
    try {
      const virtues = await getAvailableVirtuesForPractitioner(selectedPractitioner);
      setAvailableVirtues(virtues);
      setSelectedVirtues([]); // Reset selection when practitioner changes
    } catch (err) {
      console.error('Error loading virtues:', err);
      setError('Failed to load available virtues');
    }
  };

  const handleVirtueToggle = (virtueId: number) => {
    setSelectedVirtues(prev => 
      prev.includes(virtueId) 
        ? prev.filter(id => id !== virtueId)
        : [...prev, virtueId]
    );
  };

  const fetchAssessmentData = async (practitionerId: string) => {
    try {
      // Get the latest assessment with results and analyses
      const { data: assessments, error: assessmentError } = await supabase
        .from('user_assessments')
        .select(`
          id,
          created_at,
          summary_analysis,
          user_assessment_results (
            virtue_name,
            priority_score,
            defect_intensity
          )
        `)
        .eq('user_id', practitionerId)
        .eq('assessment_type', 'virtue')
        .order('created_at', { ascending: false })
        .limit(1);

      if (assessmentError) throw assessmentError;

      if (!assessments || assessments.length === 0) {
        return null;
      }

      const latestAssessment = assessments[0];

      // Get virtue analyses for this assessment
      const { data: analyses, error: analysesError } = await supabase
        .from('virtue_analysis')
        .select('virtue_id, analysis_text, virtues(name)')
        .eq('assessment_id', latestAssessment.id);

      if (analysesError) throw analysesError;

      // Transform the data for the assessment report
      const results = latestAssessment.user_assessment_results?.map((result: any) => ({
        virtue: result.virtue_name,
        priority: result.priority_score,
        defectIntensity: result.defect_intensity
      })) || [];

      const analysesMap = new Map();
      analyses?.forEach((analysis: any) => {
        if (analysis.virtues?.name) {
          analysesMap.set(analysis.virtues.name, analysis.analysis_text);
        }
      });

      return {
        results,
        analyses: analysesMap,
        summaryAnalysis: latestAssessment.summary_analysis || 'No summary analysis available.',
        assessmentDate: latestAssessment.created_at
      };
    } catch (err) {
      console.error('Error fetching assessment data:', err);
      return null;
    }
  };

  const generatePreview = async () => {
    if (!selectedPractitioner) {
      setError('Please select a practitioner');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const filters: WorkProductFilters = {
        practitioner_id: selectedPractitioner,
        status_filter: statusFilter,
        virtue_ids: selectedVirtues.length > 0 ? selectedVirtues : undefined
      };

      const [workProductData, assessmentReportData] = await Promise.all([
        generateWorkProductData(filters),
        includeAssessmentReport ? fetchAssessmentData(selectedPractitioner) : Promise.resolve(null)
      ]);

      setPreviewData(workProductData);
      setAssessmentData(assessmentReportData);
    } catch (err) {
      console.error('Error generating preview:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate report preview');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadReport = async () => {
    if (!previewData) {
      setError('Please generate a preview first');
      return;
    }

    setIsGenerating(true);
    try {
      let reportComponent;
      let filename;
      const practitionerName = practitioners.find(p => p.id === selectedPractitioner)?.full_name || 'Unknown';
      const dateStr = new Date().toISOString().split('T')[0];

      if (includeAssessmentReport && assessmentData) {
        // Use combined report
        const { default: CombinedReport } = await import('./CombinedReport');
        reportComponent = (
          <CombinedReport 
            workProductData={previewData}
            assessmentData={assessmentData}
            generated_by={current_user_name}
            organization_name={organization_name}
          />
        );
        filename = `combined-report-${practitionerName.replace(/\s+/g, '-')}-${dateStr}.pdf`;
      } else {
        // Use work product report only
        reportComponent = (
          <WorkProductReport 
            data={previewData} 
            generated_by={current_user_name}
            organization_name={organization_name}
          />
        );
        filename = `work-product-report-${practitionerName.replace(/\s+/g, '-')}-${dateStr}.pdf`;
      }

      const blob = await pdf(reportComponent).toBlob();
      saveAs(blob, filename);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate PDF report');
    } finally {
      setIsGenerating(false);
    }
  };

  const selectedPractitionerName = practitioners.find(p => p.id === selectedPractitioner)?.full_name;

  return (
    <div className="space-y-6">
      {/* Report Configuration */}
      <Card className="bg-white/80 backdrop-blur-sm border-stone-200/60 shadow-gentle">
        <CardHeader className="flex flex-row items-center gap-4">
          <FileText className="h-6 w-6 text-amber-700" />
          <div>
            <CardTitle className="text-stone-800 font-medium">Work Product Report Generator</CardTitle>
            <p className="text-sm text-stone-600 mt-1">
              Generate detailed progress reports for practitioners showing virtue stage work and development timeline
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Practitioner Selection - Only show for supervisors */}
          {is_supervisor ? (
            <div className="space-y-2">
              <Label htmlFor="practitioner-select" className="text-stone-700 font-medium">
                Select Practitioner
              </Label>
              <Select value={selectedPractitioner} onValueChange={setSelectedPractitioner}>
                <SelectTrigger className="bg-white/60 border-stone-300">
                  <SelectValue placeholder="Choose a practitioner..." />
                </SelectTrigger>
                <SelectContent>
                  {practitioners.map(practitioner => (
                    <SelectItem key={practitioner.id} value={practitioner.id}>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-stone-500" />
                        {practitioner.full_name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label className="text-stone-700 font-medium">Report For</Label>
              <div className="p-3 bg-stone-50/60 rounded-lg border border-stone-200">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-stone-500" />
                  <span className="text-stone-700 font-medium">
                    {practitioners.find(p => p.id === current_user_id)?.full_name || current_user_name || 'Your Account'}
                  </span>
                </div>
                <p className="text-sm text-stone-600 mt-1">
                  Generating work product report for your own progress
                </p>
              </div>
            </div>
          )}

          {/* Status Filter */}
          <div className="space-y-2">
            <Label className="text-stone-700 font-medium flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Stage Status Filter
            </Label>
            <Select value={statusFilter} onValueChange={(value: 'completed' | 'in_progress' | 'both') => setStatusFilter(value)}>
              <SelectTrigger className="bg-white/60 border-stone-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="both">All Stages</SelectItem>
                <SelectItem value="completed">Completed Only</SelectItem>
                <SelectItem value="in_progress">In Progress Only</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-stone-600">
              Choose which virtue stages to include in the report based on their completion status.
            </p>
          </div>

          {/* Virtue Filter */}
          {availableVirtues.length > 0 && (
            <div className="space-y-3">
              <Label className="text-stone-700 font-medium">
                Filter by Virtues (optional - leave empty for all virtues)
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-48 overflow-y-auto p-3 bg-stone-50/60 rounded-lg border border-stone-200">
                {availableVirtues.map(virtue => (
                  <div key={virtue.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`virtue-${virtue.id}`}
                      checked={selectedVirtues.includes(virtue.id)}
                      onCheckedChange={() => handleVirtueToggle(virtue.id)}
                    />
                    <Label 
                      htmlFor={`virtue-${virtue.id}`} 
                      className="text-sm text-stone-700 cursor-pointer"
                    >
                      {virtue.name}
                    </Label>
                  </div>
                ))}
              </div>
              {selectedVirtues.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedVirtues.map(virtueId => {
                    const virtue = availableVirtues.find(v => v.id === virtueId);
                    return virtue ? (
                      <Badge key={virtueId} variant="secondary" className="bg-amber-100 text-amber-800">
                        {virtue.name}
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}
            </div>
          )}

          {/* Assessment Report Option */}
          <div className="space-y-3 p-4 bg-amber-50/60 rounded-lg border border-amber-200">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-assessment"
                checked={includeAssessmentReport}
                onCheckedChange={(checked) => setIncludeAssessmentReport(checked === true)}
              />
              <Label 
                htmlFor="include-assessment" 
                className="text-stone-700 font-medium cursor-pointer"
              >
                Include Assessment Report
              </Label>
            </div>
            <p className="text-sm text-stone-600 ml-6">
              Append the practitioner's latest virtue assessment report to the work product report. 
              This includes assessment results, virtue analyses, and summary insights.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-stone-200">
            <Button
              onClick={generatePreview}
              disabled={!selectedPractitioner || isGenerating}
              className="bg-gradient-to-r from-amber-600 to-stone-600 hover:from-amber-700 hover:to-stone-700 text-white"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              {isGenerating ? 'Generating...' : 'Generate Preview'}
            </Button>
            
            <Button
              onClick={downloadReport}
              disabled={!previewData || isGenerating}
              variant="outline"
              className="border-amber-200 text-amber-700 hover:bg-amber-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Preview Summary */}
      {previewData && (
        <Card className="bg-white/80 backdrop-blur-sm border-stone-200/60 shadow-gentle">
          <CardHeader>
            <CardTitle className="text-stone-800 font-medium">Report Preview</CardTitle>
            <p className="text-sm text-stone-600">
              Report for {selectedPractitionerName} | Generated on {new Date().toLocaleDateString()}
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-stone-50/60 rounded-lg">
                <div className="text-2xl font-bold text-amber-700">
                  {previewData.summary_stats.total_stages_completed}
                </div>
                <div className="text-sm text-stone-600">Stages Completed</div>
              </div>
              <div className="text-center p-3 bg-stone-50/60 rounded-lg">
                <div className="text-2xl font-bold text-amber-700">
                  {previewData.summary_stats.total_stages_in_progress}
                </div>
                <div className="text-sm text-stone-600">Stages In Progress</div>
              </div>
              <div className="text-center p-3 bg-stone-50/60 rounded-lg">
                <div className="text-2xl font-bold text-amber-700">
                  {previewData.summary_stats.total_journal_entries}
                </div>
                <div className="text-sm text-stone-600">Journal Entries</div>
              </div>
              <div className="text-center p-3 bg-stone-50/60 rounded-lg">
                <div className="text-2xl font-bold text-amber-700">
                  {previewData.summary_stats.virtues_with_progress}
                </div>
                <div className="text-sm text-stone-600">Active Virtues</div>
              </div>
            </div>

            {/* Virtue Stage Work Summary */}
            {previewData.virtue_stage_work.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium text-stone-800 mb-3">Virtue Stage Work Included:</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {(() => {
                    const virtueGroups = previewData.virtue_stage_work.reduce((acc, stage) => {
                      if (!acc[stage.virtue_name]) {
                        acc[stage.virtue_name] = [];
                      }
                      acc[stage.virtue_name].push(stage);
                      return acc;
                    }, {} as Record<string, typeof previewData.virtue_stage_work>);

                    return Object.entries(virtueGroups).map(([virtueName, stages]) => (
                      <div key={virtueName} className="flex items-center justify-between p-2 bg-stone-50/60 rounded">
                        <span className="text-sm font-medium text-stone-700">{virtueName}</span>
                        <div className="flex gap-1">
                          {stages.map(stage => (
                            <Badge 
                              key={`${stage.virtue_id}-${stage.stage_number}`}
                              variant={stage.status === 'completed' ? 'default' : 'secondary'}
                              className={stage.status === 'completed' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-amber-100 text-amber-800'
                              }
                            >
                              Stage {stage.stage_number}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}

            {/* Assessment Report Summary */}
            {includeAssessmentReport && assessmentData && (
              <div className="mt-6 p-4 bg-amber-50/60 rounded-lg border border-amber-200">
                <h4 className="font-medium text-stone-800 mb-2">Assessment Report Included:</h4>
                <div className="text-sm text-stone-600 space-y-1">
                  <p>• Assessment Date: {new Date(assessmentData.assessmentDate).toLocaleDateString()}</p>
                  <p>• {assessmentData.results.length} virtue assessments</p>
                  <p>• Individual virtue analyses and summary insights</p>
                </div>
              </div>
            )}

            {includeAssessmentReport && !assessmentData && (
              <div className="mt-6 p-4 bg-yellow-50/60 rounded-lg border border-yellow-200">
                <h4 className="font-medium text-yellow-800 mb-2">Assessment Report:</h4>
                <p className="text-sm text-yellow-700">
                  No assessment data found for this practitioner. The report will only include work product data.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}