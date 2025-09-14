'use client'

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { supabase } from '@/lib/supabaseClient';
import { RotateCcw, CheckCircle } from 'lucide-react';
import { coreVirtuesList } from '@/lib/constants';

export default function VirtueRestorer() {
  const [log, setLog] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addLog = (message: string) => {
    setLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const restoreOriginalVirtues = async () => {
    setIsRunning(true);
    setLog([]);
    
    try {
      addLog('Restoring original 12 core virtues...');

      // Original 12 virtues with definitions
      const originalVirtues = [
        {
          name: "Humility",
          description: "The quality of being humble; having a modest view of one's own importance.",
          short_description: "Modest view of one's own importance"
        },
        {
          name: "Honesty",
          description: "The quality of being truthful and sincere; free from deceit.",
          short_description: "Being truthful and sincere"
        },
        {
          name: "Gratitude",
          description: "The quality of being thankful; readiness to show appreciation.",
          short_description: "Being thankful and appreciative"
        },
        {
          name: "Self-Control",
          description: "The ability to control one's emotions, behavior, and desires.",
          short_description: "Controlling emotions and desires"
        },
        {
          name: "Mindfulness",
          description: "The practice of being aware and present in the current moment.",
          short_description: "Being aware and present"
        },
        {
          name: "Patience",
          description: "The capacity to accept delay, trouble, or suffering without getting angry.",
          short_description: "Accepting delays without anger"
        },
        {
          name: "Integrity",
          description: "The quality of being honest and having strong moral principles.",
          short_description: "Having strong moral principles"
        },
        {
          name: "Compassion",
          description: "Sympathetic concern for the sufferings or misfortunes of others.",
          short_description: "Concern for others' suffering"
        },
        {
          name: "Healthy Boundaries",
          description: "The ability to establish and maintain appropriate limits in relationships.",
          short_description: "Setting appropriate personal limits"
        },
        {
          name: "Responsibility",
          description: "The state of being accountable for one's actions and obligations.",
          short_description: "Being accountable for actions"
        },
        {
          name: "Vulnerability",
          description: "The willingness to show uncertainty, risk, and emotional exposure.",
          short_description: "Willingness to be emotionally open"
        },
        {
          name: "Respect",
          description: "Due regard for the feelings, wishes, rights, or traditions of others.",
          short_description: "Regard for others' rights and feelings"
        }
      ];

      // Get current virtues
      const { data: currentVirtues } = await supabase
        .from('virtues')
        .select('name');

      const currentVirtueNames = new Set(currentVirtues?.map(v => v.name) || []);

      // Add missing virtues
      for (const virtue of originalVirtues) {
        if (!currentVirtueNames.has(virtue.name)) {
          const { error } = await supabase
            .from('virtues')
            .insert([virtue]);
          
          if (error) throw error;
          addLog(`Added missing virtue: ${virtue.name}`);
        } else {
          addLog(`Virtue already exists: ${virtue.name}`);
        }
      }

      // Remove any extra virtues not in the original 12
      const originalNames = new Set(originalVirtues.map(v => v.name));
      const { data: allVirtues } = await supabase
        .from('virtues')
        .select('id, name');

      if (allVirtues) {
        for (const virtue of allVirtues) {
          if (!originalNames.has(virtue.name)) {
            // Delete mappings first
            await supabase
              .from('defects_virtues')
              .delete()
              .eq('virtue_id', virtue.id);

            // Delete virtue
            await supabase
              .from('virtues')
              .delete()
              .eq('id', virtue.id);

            addLog(`Removed extra virtue: ${virtue.name}`);
          }
        }
      }

      addLog('=== RESTORATION COMPLETE ===');
      addLog('Original 12 core virtues have been restored!');

      // Show final list
      const { data: finalVirtues } = await supabase
        .from('virtues')
        .select('name')
        .order('name');

      addLog('=== FINAL VIRTUE LIST ===');
      finalVirtues?.forEach(v => addLog(`✓ ${v.name}`));

    } catch (error) {
      addLog(`ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Virtue restoration error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RotateCcw className="h-5 w-5" />
          Restore Original 12 Virtues
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-green-50 border border-green-200 rounded">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <strong className="text-green-800">Original Core Virtues</strong>
          </div>
          <p className="text-green-700 text-sm mb-3">
            This will restore the original 12 hardcoded virtues from the assessment and remove any extras.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-1 text-xs text-green-600">
            {coreVirtuesList.map(virtue => (
              <div key={virtue}>• {virtue}</div>
            ))}
          </div>
        </div>

        <Button 
          onClick={restoreOriginalVirtues} 
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? 'Restoring Virtues...' : 'Restore Original 12 Virtues'}
        </Button>

        {log.length > 0 && (
          <div className="mt-4">
            <h4 className="font-semibold mb-2">Restoration Log:</h4>
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
