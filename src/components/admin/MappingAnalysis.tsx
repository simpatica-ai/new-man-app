'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { supabase } from '@/lib/supabaseClient';
import { Download, Brain, AlertTriangle } from 'lucide-react';

interface VirtueMapping {
  virtue: string;
  virtue_description: string | null;
  defects: Array<{
    name: string;
    definition: string | null;
  }>;
  count: number;
}

export default function MappingAnalysis() {
  const [mappings, setMappings] = useState<VirtueMapping[]>([]);
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMappings();
  }, []);

  const loadMappings = async () => {
    try {
      const { data: virtuesData, error } = await supabase
        .from('virtues')
        .select(`
          name,
          description,
          defects_virtues (
            defects (
              name,
              definition
            )
          )
        `)
        .order('name');

      if (error) throw error;

      const mappings = virtuesData?.map(virtue => ({
        virtue: virtue.name,
        virtue_description: virtue.description,
        defects: virtue.defects_virtues?.map((dv: any) => ({
          name: dv.defects.name,
          definition: dv.defects.definition
        })) || [],
        count: virtue.defects_virtues?.length || 0
      })) || [];

      // Sort by count to highlight imbalances
      mappings.sort((a, b) => a.count - b.count);
      setMappings(mappings);
    } catch (error) {
      console.error('Error loading mappings:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportMappings = () => {
    const exportData = mappings.map(m => ({
      virtue: m.virtue,
      defect_count: m.count,
      defects: m.defects
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'virtue-defect-mappings.json';
    a.click();
  };

  const generateAnalysisPrompt = () => {
    const prompt = `Please analyze these virtue-defect mappings for a personal development assessment tool:

## IMPORTANT CONSTRAINT:
The 12 virtues listed below are FIXED and cannot be changed, added to, or removed. They are hardcoded into the assessment system. Your analysis should focus ONLY on optimizing defect-to-virtue mappings within these existing virtues.

## VIRTUE DEFINITIONS AND MAPPINGS:

${mappings.map(m => `
**${m.virtue}** (${m.count} defects)
Definition: ${m.virtue_description || 'No definition provided'}

Associated Defects:
${m.defects.length > 0 ? m.defects.map(d => `- ${d.name}: ${d.definition || 'No definition provided'}`).join('\n') : '- No defects mapped'}
`).join('\n')}

## ANALYSIS REQUESTED:

Please provide recommendations that work WITHIN the existing 12 virtues:

1. **Balance Analysis**: Which virtues are over/under-mapped based on their definitions?
2. **Defect Redistribution**: How should existing defects be redistributed among the 12 virtues?
3. **Missing Defects**: What new defects should be created and mapped to under-represented virtues?
4. **Questionable Mappings**: Which defect-virtue connections seem weak based on definitions?
5. **Healthy Boundaries Focus**: This virtue has ${mappings.find(m => m.virtue === 'Healthy Boundaries')?.count || 0} defects. What specific defects should be added or moved here?
6. **Definition Alignment**: Do current mappings align well with virtue and defect definitions?
7. **Specific Recommendations**: Concrete changes using ONLY the existing 12 virtues.

REMEMBER: You cannot suggest adding, removing, or renaming virtues. Work only with: Humility, Honesty, Gratitude, Self-Control, Mindfulness, Patience, Integrity, Compassion, Healthy Boundaries, Responsibility, Vulnerability, and Respect.

Focus on psychological accuracy, definitional alignment, and assessment effectiveness within these constraints.`;

    setAnalysis(prompt);
  };

  const getStatusColor = (count: number) => {
    if (count === 0) return 'bg-red-100 text-red-800';
    if (count <= 2) return 'bg-yellow-100 text-yellow-800';
    if (count <= 5) return 'bg-green-100 text-green-800';
    return 'bg-blue-100 text-blue-800';
  };

  if (loading) return <div>Loading mapping analysis...</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Virtue-Defect Mapping Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <Button onClick={exportMappings} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Mappings
            </Button>
            <Button onClick={generateAnalysisPrompt}>
              <Brain className="h-4 w-4 mr-2" />
              Generate AI Analysis Prompt
            </Button>
          </div>

          {/* Mapping Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {mappings.map(mapping => (
              <div key={mapping.virtue} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{mapping.virtue}</h4>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(mapping.count)}`}>
                    {mapping.count}
                  </span>
                </div>
                {mapping.count === 0 && (
                  <div className="flex items-center gap-1 text-red-600 text-sm">
                    <AlertTriangle className="h-3 w-3" />
                    No defects mapped
                  </div>
                )}
                {mapping.count > 8 && (
                  <div className="flex items-center gap-1 text-blue-600 text-sm">
                    <AlertTriangle className="h-3 w-3" />
                    High defect count
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Detailed Breakdown */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Detailed Mappings</h3>
            {mappings.map(mapping => (
              <div key={mapping.virtue} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-blue-800">{mapping.virtue}</h4>
                  <span className={`px-2 py-1 rounded text-xs ${getStatusColor(mapping.count)}`}>
                    {mapping.count} defects
                  </span>
                </div>
                {mapping.defects.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-sm">
                    {mapping.defects.map(defect => (
                      <div key={defect.name} className="text-gray-700">• {defect.name}</div>
                    ))}
                  </div>
                ) : (
                  <div className="text-red-600 text-sm italic">No defects mapped to this virtue</div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Analysis Prompt */}
      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle>AI Analysis Prompt</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={analysis}
              onChange={(e) => setAnalysis(e.target.value)}
              rows={20}
              className="font-mono text-sm"
            />
            <p className="text-sm text-gray-600 mt-2">
              Copy this prompt and paste it into ChatGPT, Claude, or your preferred AI assistant for analysis.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
