'use client'

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { supabase } from '@/lib/supabaseClient';
import { Minus, CheckCircle } from 'lucide-react';

export default function CompassionReducer() {
  const [log, setLog] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addLog = (message: string) => {
    setLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const reduceCompassionDefects = async () => {
    setIsRunning(true);
    setLog([]);
    
    try {
      addLog('Reducing Compassion defect count...');

      // Get virtue and defect mappings
      const { data: virtues } = await supabase.from('virtues').select('id, name');
      const { data: defects } = await supabase.from('defects').select('id, name');
      
      const virtueMap = new Map(virtues?.map(v => [v.name, v.id]));
      const defectMap = new Map(defects?.map(d => [d.name, d.id]));

      const compassionId = virtueMap.get('Compassion');
      
      if (!compassionId) {
        addLog('ERROR: Compassion virtue not found');
        return;
      }

      // Defects to remove from Compassion only
      const defectsToRemove = [
        'Anger',
        'Bitterness', 
        'Resentment',
        'Rudeness',
        'Self-centeredness',
        'Selfishness'
      ];

      addLog('=== REMOVING DEFECTS FROM COMPASSION ===');

      for (const defectName of defectsToRemove) {
        const defectId = defectMap.get(defectName);
        
        if (defectId) {
          const { error } = await supabase
            .from('defects_virtues')
            .delete()
            .eq('defect_id', defectId)
            .eq('virtue_id', compassionId);
          
          if (error) throw error;
          addLog(`Removed ${defectName} from Compassion`);
        } else {
          addLog(`WARNING: ${defectName} defect not found`);
        }
      }

      // Verification: Get final counts
      addLog('=== FINAL VERIFICATION ===');

      const { data: finalCounts } = await supabase
        .from('virtues')
        .select(`
          name,
          defects_virtues (count)
        `)
        .order('name');

      addLog('=== FINAL VIRTUE-DEFECT COUNTS ===');
      let totalDefects = 0;
      if (finalCounts) {
        for (const virtue of finalCounts) {
          const count = virtue.defects_virtues?.[0]?.count || 0;
          totalDefects += count;
          const indicator = virtue.name === 'Compassion' ? ' ← REDUCED' : '';
          addLog(`${virtue.name}: ${count} defects${indicator}`);
        }
        addLog(`TOTAL DEFECTS MAPPED: ${totalDefects}`);
      }

      addLog('=== COMPASSION REDUCTION COMPLETE ===');
      addLog('Compassion defect count has been reduced by removing 6 defects!');

    } catch (error) {
      addLog(`ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Compassion reduction error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Minus className="h-5 w-5" />
          Reduce Compassion Defects
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-4 w-4 text-red-600" />
            <strong className="text-red-800">Final Compassion Adjustment</strong>
          </div>
          <p className="text-red-700 text-sm mb-3">
            This removes 6 specific defects from Compassion only, without affecting other virtues.
          </p>
          <div className="text-xs text-red-600">
            <strong>Removing:</strong> Anger, Bitterness, Resentment, Rudeness, Self-centeredness, Selfishness
          </div>
        </div>

        <Button 
          onClick={reduceCompassionDefects} 
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? 'Reducing Compassion Defects...' : 'Remove 6 Defects from Compassion'}
        </Button>

        {log.length > 0 && (
          <div className="mt-4">
            <h4 className="font-semibold mb-2">Reduction Log:</h4>
            <Textarea
              value={log.join('\n')}
              readOnly
              rows={20}
              className="font-mono text-xs"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
