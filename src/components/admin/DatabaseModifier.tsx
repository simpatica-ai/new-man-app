'use client'

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { supabase } from '@/lib/supabaseClient';
import { Play, CheckCircle, AlertCircle } from 'lucide-react';

export default function DatabaseModifier() {
  const [log, setLog] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addLog = (message: string) => {
    setLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const executeRefinedModifications = async () => {
    setIsRunning(true);
    setLog([]);
    
    try {
      addLog('Starting refined database modifications...');

      // Get initial mappings for reference
      const { data: virtues } = await supabase.from('virtues').select('id, name');
      const { data: defects } = await supabase.from('defects').select('id, name');
      
      const virtueMap = new Map(virtues?.map(v => [v.name, v.id]));
      const defectMap = new Map(defects?.map(d => [d.name, d.id]));

      // Phase 1: Delete Virtues and Their Associated Defects
      addLog('=== PHASE 1: Deleting Virtues ===');

      const virtuesToDelete = ['Justice', 'Honesty'];
      for (const virtueName of virtuesToDelete) {
        const virtueId = virtueMap.get(virtueName);
        if (virtueId) {
          // Delete mappings first
          await supabase
            .from('defects_virtues')
            .delete()
            .eq('virtue_id', virtueId);

          // Delete virtue
          await supabase
            .from('virtues')
            .delete()
            .eq('id', virtueId);

          addLog(`Deleted ${virtueName} virtue and all mappings`);
        }
      }

      // Phase 2: Create New Defects
      addLog('=== PHASE 2: Creating New Defects ===');

      const newDefects = [
        { 
          name: 'Distractibility', 
          definition: 'An inability to maintain focus or attention; easily diverted.',
          category: 'Focus',
          icon_name: 'Zap'
        },
        { 
          name: 'Mindlessness', 
          definition: 'Acting without forethought or attention to one\'s actions; a lack of awareness of the present moment.',
          category: 'Awareness',
          icon_name: 'Heart'
        }
      ];

      for (const defect of newDefects) {
        const { data, error } = await supabase
          .from('defects')
          .insert([defect])
          .select();
        
        if (error) throw error;
        
        // Update defectMap with new defects
        if (data && data[0]) {
          defectMap.set(defect.name, data[0].id);
        }
        
        addLog(`Added defect: ${defect.name}`);
      }

      // Phase 3: Re-map and Consolidate Defects
      addLog('=== PHASE 3: Re-mapping Defects ===');

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
            }
          }
          
          // Add to new virtue (use upsert to avoid duplicates)
          const { error } = await supabase
            .from('defects_virtues')
            .upsert([{ defect_id: defectId, virtue_id: newVirtueId }], 
              { onConflict: 'defect_id,virtue_id' });
          
          if (error) throw error;
          addLog(`Remapped ${defectName} to ${newVirtueName}`);
        }
      };

      // 1. Re-map Stealing to Integrity
      await remapDefect('Stealing', 'Integrity');

      // 2. Consolidate Honesty defects under Integrity
      const honestyDefects = ['Betrayal', 'Deceit', 'Dishonesty', 'Hypocrisy', 'Lying', 'Manipulation'];
      for (const defectName of honestyDefects) {
        await remapDefect(defectName, 'Integrity');
      }

      // 3. Balance Responsibility and Compassion
      await remapDefect('Apathy', 'Responsibility', ['Compassion']);
      await remapDefect('Indifference', 'Responsibility', ['Compassion']);

      // 4. Balance Humility and Respect
      await remapDefect('Close-mindedness', 'Humility', ['Respect']);
      await remapDefect('Intolerance', 'Humility', ['Respect']);
      await remapDefect('Defensiveness', 'Vulnerability', ['Humility']);

      // 5. Re-map Defects to Mindfulness
      await remapDefect('Addictive tendencies', 'Mindfulness');
      await remapDefect('Restlessness', 'Mindfulness');
      await remapDefect('Distractibility', 'Mindfulness');
      await remapDefect('Mindlessness', 'Mindfulness');
      
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

      // 6. Add Missing Mappings
      await remapDefect('Blaming others', 'Responsibility');

      // 7. Remove Redundant Mappings
      const redundantMappings = [
        { defect: 'Manipulation', virtue: 'Respect' },
        { defect: 'Cruelty', virtue: 'Respect' },
        { defect: 'Betrayal', virtue: 'Respect' }
      ];

      for (const mapping of redundantMappings) {
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

      // Phase 4: Final Verification
      addLog('=== PHASE 4: Final Verification ===');

      // Get final counts
      const { data: finalCounts } = await supabase
        .from('virtues')
        .select(`
          name,
          defects_virtues (count)
        `)
        .order('name');

      addLog('=== FINAL VIRTUE-DEFECT COUNTS ===');
      if (finalCounts) {
        for (const virtue of finalCounts) {
          const count = virtue.defects_virtues?.[0]?.count || 0;
          addLog(`${virtue.name}: ${count} defects`);
        }
      }

      addLog('=== REFINED MODIFICATIONS COMPLETE ===');
      addLog('All database refinements have been successfully applied!');

    } catch (error) {
      addLog(`ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Database modification error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5" />
          AI Database Refinement Tool
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            <strong className="text-blue-800">Refined AI Instructions</strong>
          </div>
          <p className="text-blue-700 text-sm mb-3">
            This implements the final, most balanced version of virtue-defect mappings based on AI analysis.
          </p>
          <div className="text-xs text-blue-600">
            <strong>Changes:</strong> Delete Justice & Honesty virtues, add Distractibility & Mindlessness defects, 
            rebalance all mappings for optimal assessment accuracy.
          </div>
        </div>

        <div className="p-4 bg-amber-50 border border-amber-200 rounded">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <strong className="text-amber-800">Database Permissions Required</strong>
          </div>
          <p className="text-amber-700 text-sm mb-3">
            This tool requires INSERT/UPDATE/DELETE permissions on database tables. 
            If you get 403 Forbidden errors, run these SQL commands in Supabase first:
          </p>
          <div className="bg-gray-900 text-gray-100 p-3 rounded text-xs font-mono">
            <div>-- Allow all operations for authenticated users</div>
            <div>CREATE POLICY "Allow all operations on defects" ON defects</div>
            <div>FOR ALL TO authenticated USING (true) WITH CHECK (true);</div>
            <br />
            <div>CREATE POLICY "Allow all operations on virtues" ON virtues</div>
            <div>FOR ALL TO authenticated USING (true) WITH CHECK (true);</div>
            <br />
            <div>CREATE POLICY "Allow all operations on defects_virtues" ON defects_virtues</div>
            <div>FOR ALL TO authenticated USING (true) WITH CHECK (true);</div>
          </div>
        </div>

        <Button 
          onClick={executeRefinedModifications} 
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? 'Executing Refined Modifications...' : 'Execute Refined Database Structure'}
        </Button>

        {log.length > 0 && (
          <div className="mt-4">
            <h4 className="font-semibold mb-2">Execution Log:</h4>
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
