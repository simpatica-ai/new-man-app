'use client'

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { supabase } from '@/lib/supabaseClient';
import { Trash2, AlertTriangle } from 'lucide-react';

export default function AssessmentCleanup() {
  const [log, setLog] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addLog = (message: string) => {
    setLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const cleanupOldAssessments = async () => {
    setIsRunning(true);
    setLog([]);
    
    try {
      addLog('Cleaning up old assessment data...');

      // Get current defects in database
      const { data: currentDefects } = await supabase
        .from('defects')
        .select('name');

      const currentDefectNames = new Set(currentDefects?.map(d => d.name) || []);
      addLog(`Current defects in database: ${currentDefectNames.size}`);

      // Get all assessment defect records
      const { data: assessmentDefects } = await supabase
        .from('user_assessment_defects')
        .select('id, defect_name');

      addLog(`Assessment defect records: ${assessmentDefects?.length || 0}`);

      // Find obsolete defect records
      const obsoleteRecords = assessmentDefects?.filter(record => 
        !currentDefectNames.has(record.defect_name)
      ) || [];

      addLog(`Obsolete defect records found: ${obsoleteRecords.length}`);

      if (obsoleteRecords.length > 0) {
        addLog('=== OBSOLETE DEFECTS ===');
        const obsoleteNames = new Set();
        obsoleteRecords.forEach(record => {
          obsoleteNames.add(record.defect_name);
        });
        obsoleteNames.forEach(name => addLog(`- ${name}`));

        // Delete obsolete records
        const obsoleteIds = obsoleteRecords.map(r => r.id);
        const { error } = await supabase
          .from('user_assessment_defects')
          .delete()
          .in('id', obsoleteIds);

        if (error) throw error;

        addLog(`Deleted ${obsoleteRecords.length} obsolete assessment records`);
      } else {
        addLog('✓ No obsolete assessment records found');
      }

      addLog('=== CLEANUP COMPLETE ===');
      addLog('Assessment counter should now show correct defect count!');

    } catch (error) {
      addLog(`ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Assessment cleanup error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="h-5 w-5" />
          Assessment Data Cleanup
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <strong className="text-yellow-800">Fix Counter Issue</strong>
          </div>
          <p className="text-yellow-700 text-sm">
            This removes old defect records from assessments that reference defects no longer in the database.
            This should fix the 59/53 counter issue.
          </p>
        </div>

        <Button 
          onClick={cleanupOldAssessments} 
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? 'Cleaning Up...' : 'Clean Up Old Assessment Data'}
        </Button>

        {log.length > 0 && (
          <div className="mt-4">
            <h4 className="font-semibold mb-2">Cleanup Log:</h4>
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
