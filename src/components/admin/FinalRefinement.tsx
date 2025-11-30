'use client'

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { supabase } from '@/lib/supabaseClient';
import { Sparkles, CheckCircle, AlertCircle } from 'lucide-react';

export default function FinalRefinement() {
  const [log, setLog] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addLog = (message: string) => {
    setLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const executeFinalRefinement = async () => {
    setIsRunning(true);
    setLog([]);
    
    try {
      addLog('Starting final defect rebalancing (reducing Compassion count)...');

      // Get virtue and defect mappings
      const { data: virtues } = await supabase.from('virtues').select('id, name');
      const { data: defects } = await supabase.from('defects').select('id, name');
      
      const virtueMap = new Map(virtues?.map(v => [v.name, v.id]));
      const defectMap = new Map(defects?.map(d => [d.name, d.id]));

      // Phase 1: Re-map and Adjust Existing Defects
      addLog('=== PHASE 1: Re-mapping Existing Defects ===');

      // Helper function to remap defects
      const remapDefect = async (defectName: string, newVirtueName: string, removeFromVirtues: string[] = []) => {
        const defectId = defectMap.get(defectName);
        const newVirtueId = virtueMap.get(newVirtueName);
        
        if (defectId && newVirtueId) {
          // Remove from specified virtues
          for (const oldVirtueName of removeFromVirtues) {
            const oldVirtueId = virtueMap.get(oldVirtueName);
            if (oldVirtueId) {
              await supabase
                .from('defects_virtues')
                .delete()
                .eq('defect_id', defectId)
                .eq('virtue_id', oldVirtueId);
              addLog(`Removed ${defectName} from ${oldVirtueName}`);
            }
          }
          
          // Add to new virtue (use upsert to avoid duplicates)
          const { error } = await supabase
            .from('defects_virtues')
            .upsert([{ defect_id: defectId, virtue_id: newVirtueId }], 
              { onConflict: 'defect_id,virtue_id' });
          
          if (error) throw error;
          addLog(`Mapped ${defectName} to ${newVirtueName}`);
        }
      };

      // 1. Balance Responsibility and Compassion (reduce Compassion count)
      await remapDefect('Apathy', 'Responsibility', ['Compassion']);
      await remapDefect('Indifference', 'Responsibility', ['Compassion']);

      // 2. Balance Humility and Respect
      await remapDefect('Close-mindedness', 'Humility', ['Respect']);
      await remapDefect('Intolerance', 'Humility', ['Respect']);
      await remapDefect('Defensiveness', 'Vulnerability', ['Humility']);

      // 3. Clean up Respect and Honesty Overlaps
      const cleanupMappings = [
        { defect: 'Manipulation', virtue: 'Respect' },
        { defect: 'Cruelty', virtue: 'Respect' },
        { defect: 'Betrayal', virtue: 'Respect' },
        { defect: 'Blaming others', virtue: 'Honesty' },
        { defect: 'Distrust', virtue: 'Honesty' }
      ];

      for (const mapping of cleanupMappings) {
        const defectId = defectMap.get(mapping.defect);
        const virtueId = virtueMap.get(mapping.virtue);
        
        if (defectId && virtueId) {
          await supabase
            .from('defects_virtues')
            .delete()
            .eq('defect_id', defectId)
            .eq('virtue_id', virtueId);
          
          addLog(`Removed ${mapping.defect} from ${mapping.virtue}`);
        }
      }

      // 4. Strengthen Mindfulness
      await remapDefect('Addictive tendencies', 'Mindfulness');
      await remapDefect('Recklessness', 'Mindfulness');
      
      // Remove Impatience from Mindfulness
      const impatienceId = defectMap.get('Impatience');
      const mindfulnessId = virtueMap.get('Mindfulness');
      if (impatienceId && mindfulnessId) {
        await supabase
          .from('defects_virtues')
          .delete()
          .eq('defect_id', impatienceId)
          .eq('virtue_id', mindfulnessId);
        addLog('Removed Impatience from Mindfulness');
      }

      // 5. Re-map Stealing to Integrity
      await remapDefect('Stealing', 'Integrity', ['Justice']);

      // Phase 2: Map Newly Created Defects
      addLog('=== PHASE 2: Mapping New Defects ===');

      const newDefectMappings = [
        { defects: ['Entitlement', 'Envy'], virtue: 'Gratitude' },
        { defects: ['Procrastination'], virtue: 'Self-Control' },
        { defects: ['Victimhood'], virtue: 'Responsibility' },
        { defects: ['Distractibility', 'Mindlessness'], virtue: 'Mindfulness' }
      ];

      for (const mapping of newDefectMappings) {
        for (const defectName of mapping.defects) {
          await remapDefect(defectName, mapping.virtue);
        }
      }

      // Phase 3: Final Verification
      addLog('=== PHASE 3: Final Verification ===');

      // Get final counts
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
          addLog(`${virtue.name}: ${count} defects`);
        }
        addLog(`TOTAL DEFECTS MAPPED: ${totalDefects}`);
      }

      addLog('=== REBALANCING COMPLETE ===');
      addLog('Compassion defect count has been reduced by moving Apathy and Indifference to Responsibility!');

    } catch (error) {
      addLog(`ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Final refinement error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Final Database Refinement
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            <strong className="text-blue-800">Reduce Compassion Defect Count</strong>
          </div>
          <p className="text-blue-700 text-sm mb-3">
            This rebalances defect mappings to reduce Compassion&apos;s defect count by moving Apathy and Indifference to Responsibility.
          </p>
          <div className="text-xs text-blue-600">
            <strong>Key Changes:</strong> Move Apathy & Indifference from Compassion to Responsibility, 
            clean up overlapping mappings, and map new defects to appropriate virtues.
          </div>
        </div>

        <div className="p-4 bg-amber-50 border border-amber-200 rounded">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <strong className="text-amber-800">Database Permissions Required</strong>
          </div>
          <p className="text-amber-700 text-sm mb-3">
            Ensure you have INSERT/UPDATE/DELETE permissions on database tables.
          </p>
        </div>

        <Button 
          onClick={executeFinalRefinement} 
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? 'Executing Final Refinement...' : 'Execute Final Database Refinement'}
        </Button>

        {log.length > 0 && (
          <div className="mt-4">
            <h4 className="font-semibold mb-2">Refinement Log:</h4>
            <Textarea
              value={log.join('\n')}
              readOnly
              rows={25}
              className="font-mono text-xs"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
