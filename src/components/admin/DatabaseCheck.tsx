'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { supabase } from '@/lib/supabaseClient';
import { useAssessmentData } from '@/hooks/useAssessmentData';
import { getDefectIcon } from '@/lib/iconUtils';

export default function DatabaseCheck() {
  const [virtues, setVirtues] = useState<{ id: number; name: string; description: string }[]>([]);
  const [defectVirtueCount, setDefectVirtueCount] = useState(0);
  const { defects, loading, error, healthyBoundariesExists } = useAssessmentData();

  useEffect(() => {
    async function checkDatabase() {
      try {
        // Check virtues
        const { data: virtuesData } = await supabase
          .from('virtues')
          .select('id, name')
          .order('name');
        
        setVirtues(virtuesData || []);

        // Check defects_virtues relationships
        const { data: defectVirtuesData } = await supabase
          .from('defects_virtues')
          .select('*');
        
        setDefectVirtueCount(defectVirtuesData?.length || 0);

      } catch (err) {
        console.error('Database check error:', err);
      }
    }

    checkDatabase();
  }, []);

  const seedHealthyBoundaries = async () => {
    try {
      // Insert Healthy Boundaries virtue if it doesn't exist
      const { data, error } = await supabase
        .from('virtues')
        .insert([
          {
            name: 'Healthy Boundaries',
            description: 'The ability to establish and maintain appropriate limits in relationships and situations.',
            short_description: 'Setting and maintaining appropriate personal limits'
          }
        ])
        .select();

      if (error) throw error;
      
      alert('Healthy Boundaries virtue added successfully!');
      window.location.reload();
    } catch (err) {
      alert('Error adding Healthy Boundaries: ' + (err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Database Assessment Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded">
              <h4 className="font-semibold">Virtues in Database</h4>
              <p className="text-2xl font-bold text-blue-600">{virtues.length}</p>
              <div className="text-sm text-gray-600 mt-2">
                {virtues.slice(0, 5).map(v => v.name).join(', ')}
                {virtues.length > 5 && '...'}
              </div>
            </div>
            
            <div className="p-4 bg-green-50 rounded">
              <h4 className="font-semibold">Defects in Database</h4>
              <p className="text-2xl font-bold text-green-600">{defects.length}</p>
              <div className="text-sm text-gray-600 mt-2">
                {loading ? 'Loading...' : error ? 'Error loading' : 'Loaded successfully'}
              </div>
            </div>
            
            <div className="p-4 bg-purple-50 rounded">
              <h4 className="font-semibold">Defect-Virtue Relationships</h4>
              <p className="text-2xl font-bold text-purple-600">{defectVirtueCount}</p>
            </div>
            
            <div className="p-4 bg-amber-50 rounded">
              <h4 className="font-semibold">Healthy Boundaries</h4>
              <p className="text-2xl font-bold text-amber-600">
                {healthyBoundariesExists ? '✓' : '✗'}
              </p>
              {!healthyBoundariesExists && (
                <Button 
                  size="sm" 
                  onClick={seedHealthyBoundaries}
                  className="mt-2"
                >
                  Add Healthy Boundaries
                </Button>
              )}
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded">
              <h4 className="font-semibold text-red-800">Error</h4>
              <p className="text-red-600">{error}</p>
            </div>
          )}

          <div className="mt-6">
            <h4 className="font-semibold mb-2">Sample Defects with Virtues:</h4>
            <div className="max-h-40 overflow-y-auto">
              {loading ? (
                <p>Loading defects...</p>
              ) : error ? (
                <p className="text-red-600">Error: {error}</p>
              ) : defects.length === 0 ? (
                <p className="text-amber-600">No defects found - check database seeding</p>
              ) : (
                defects.slice(0, 5).map(defect => (
                  <div key={defect.id} className="p-2 border-b">
                    <div className="flex items-center gap-2">
                      {getDefectIcon(defect.icon_name)}
                      <strong>{defect.name}</strong>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">{defect.category}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Virtues: {defect.virtues.length > 0 ? defect.virtues.join(', ') : 'None mapped'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
