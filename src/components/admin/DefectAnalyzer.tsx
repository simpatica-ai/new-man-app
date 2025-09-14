'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { supabase } from '@/lib/supabaseClient';
import { Search, AlertTriangle, CheckCircle } from 'lucide-react';

interface DefectAnalysis {
  totalDefects: number;
  mappedDefects: number;
  unmappedDefects: Array<{
    id: number;
    name: string;
    category: string | null;
  }>;
}

export default function DefectAnalyzer() {
  const [analysis, setAnalysis] = useState<DefectAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const analyzeDefects = async () => {
    setLoading(true);
    setLog([]);
    
    try {
      addLog('Analyzing defect mappings...');

      // Get all defects
      const { data: allDefects, error: defectsError } = await supabase
        .from('defects')
        .select('id, name, category')
        .order('name');

      if (defectsError) throw defectsError;

      // Get all mapped defects
      const { data: mappedDefects, error: mappedError } = await supabase
        .from('defects_virtues')
        .select('defect_id')
        .order('defect_id');

      if (mappedError) throw mappedError;

      const mappedDefectIds = new Set(mappedDefects?.map(m => m.defect_id) || []);
      
      const unmappedDefects = allDefects?.filter(defect => 
        !mappedDefectIds.has(defect.id)
      ) || [];

      const analysisResult: DefectAnalysis = {
        totalDefects: allDefects?.length || 0,
        mappedDefects: mappedDefectIds.size,
        unmappedDefects
      };

      setAnalysis(analysisResult);

      addLog(`Total defects in database: ${analysisResult.totalDefects}`);
      addLog(`Defects mapped to virtues: ${analysisResult.mappedDefects}`);
      addLog(`Unmapped defects: ${analysisResult.unmappedDefects.length}`);

      if (analysisResult.unmappedDefects.length > 0) {
        addLog('=== UNMAPPED DEFECTS ===');
        analysisResult.unmappedDefects.forEach(defect => {
          addLog(`- ${defect.name} (${defect.category || 'No category'})`);
        });
        addLog('These defects should either be mapped to virtues or removed from the database.');
      } else {
        addLog('✓ All defects are properly mapped to virtues!');
      }

    } catch (error) {
      addLog(`ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Defect analysis error:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteUnmappedDefects = async () => {
    if (!analysis || analysis.unmappedDefects.length === 0) return;

    setLoading(true);
    
    try {
      addLog('Deleting unmapped defects...');

      for (const defect of analysis.unmappedDefects) {
        const { error } = await supabase
          .from('defects')
          .delete()
          .eq('id', defect.id);

        if (error) throw error;
        addLog(`Deleted: ${defect.name}`);
      }

      addLog('=== CLEANUP COMPLETE ===');
      addLog('All unmapped defects have been removed from the database.');
      
      // Re-analyze after deletion
      await analyzeDefects();

    } catch (error) {
      addLog(`ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Defect Mapping Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            <strong className="text-blue-800">Assessment Counter Fix</strong>
          </div>
          <p className="text-blue-700 text-sm">
            This analyzes which defects are mapped to virtues and identifies unmapped defects that may be causing counter issues.
          </p>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={analyzeDefects} 
            disabled={loading}
            className="flex-1"
          >
            {loading ? 'Analyzing...' : 'Analyze Defect Mappings'}
          </Button>
          
          {analysis && analysis.unmappedDefects.length > 0 && (
            <Button 
              onClick={deleteUnmappedDefects} 
              disabled={loading}
              variant="destructive"
            >
              Delete Unmapped Defects
            </Button>
          )}
        </div>

        {analysis && (
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="p-3 bg-gray-50 rounded text-center">
              <div className="text-2xl font-bold text-gray-800">{analysis.totalDefects}</div>
              <div className="text-sm text-gray-600">Total Defects</div>
            </div>
            <div className="p-3 bg-green-50 rounded text-center">
              <div className="text-2xl font-bold text-green-800">{analysis.mappedDefects}</div>
              <div className="text-sm text-green-600">Mapped</div>
            </div>
            <div className="p-3 bg-red-50 rounded text-center">
              <div className="text-2xl font-bold text-red-800">{analysis.unmappedDefects.length}</div>
              <div className="text-sm text-red-600">Unmapped</div>
            </div>
          </div>
        )}

        {analysis && analysis.unmappedDefects.length > 0 && (
          <div className="p-4 bg-red-50 border border-red-200 rounded">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <strong className="text-red-800">Unmapped Defects Found</strong>
            </div>
            <p className="text-red-700 text-sm mb-2">
              These defects are not mapped to any virtue and should be removed:
            </p>
            <div className="text-xs text-red-600">
              {analysis.unmappedDefects.map(defect => (
                <div key={defect.id}>• {defect.name}</div>
              ))}
            </div>
          </div>
        )}

        {log.length > 0 && (
          <div className="mt-4">
            <h4 className="font-semibold mb-2">Analysis Log:</h4>
            <Textarea
              value={log.join('\n')}
              readOnly
              rows={15}
              className="font-mono text-xs"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
