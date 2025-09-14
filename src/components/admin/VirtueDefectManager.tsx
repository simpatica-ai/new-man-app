'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { supabase } from '@/lib/supabaseClient';
import { Plus, Trash2, Edit } from 'lucide-react';

interface Virtue {
  id: number;
  name: string;
  defects: Array<{
    id: number;
    name: string;
    category: string | null;
  }>;
}

interface Defect {
  id: number;
  name: string;
  category: string | null;
  definition: string | null;
}

export default function VirtueDefectManager() {
  const [virtues, setVirtues] = useState<Virtue[]>([]);
  const [allDefects, setAllDefects] = useState<Defect[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDefect, setNewDefect] = useState({
    name: '',
    category: '',
    definition: '',
    virtues: [] as number[]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Get virtues with their defects
      const { data: virtuesData, error: virtuesError } = await supabase
        .from('virtues')
        .select(`
          id,
          name,
          defects_virtues (
            defects (
              id,
              name,
              category
            )
          )
        `)
        .order('name');

      if (virtuesError) throw virtuesError;

      console.log('Raw virtues data:', virtuesData);

      // Transform data
      const transformedVirtues = virtuesData?.map(virtue => ({
        id: virtue.id,
        name: virtue.name,
        defects: virtue.defects_virtues?.map((dv: any) => dv.defects) || []
      })) || [];

      console.log('Transformed virtues:', transformedVirtues);
      setVirtues(transformedVirtues);

      // Get all defects for dropdown
      const { data: defectsData, error: defectsError } = await supabase
        .from('defects')
        .select('id, name, category, definition')
        .order('name');

      if (defectsError) throw defectsError;
      setAllDefects(defectsData || []);

      // Check defects_virtues table directly with more detail
      const { data: relationData, error: relationError } = await supabase
        .from('defects_virtues')
        .select(`
          defect_id,
          virtue_id,
          defects (name),
          virtues (name)
        `);
      
      console.log('Defects_virtues relationships:', relationData);
      console.log('Relation error:', relationError);

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addDefectToVirtue = async (virtueId: number, defectId: number) => {
    try {
      const { error } = await supabase
        .from('defects_virtues')
        .insert([{ virtue_id: virtueId, defect_id: defectId }]);

      if (error) throw error;
      loadData(); // Refresh data
    } catch (error) {
      alert('Error adding defect: ' + (error as Error).message);
    }
  };

  const removeDefectFromVirtue = async (virtueId: number, defectId: number) => {
    try {
      const { error } = await supabase
        .from('defects_virtues')
        .delete()
        .eq('virtue_id', virtueId)
        .eq('defect_id', defectId);

      if (error) throw error;
      loadData(); // Refresh data
    } catch (error) {
      alert('Error removing defect: ' + (error as Error).message);
    }
  };

  const createNewDefect = async () => {
    if (!newDefect.name.trim()) {
      alert('Defect name is required');
      return;
    }

    try {
      // Create the defect
      const { data: defectData, error: defectError } = await supabase
        .from('defects')
        .insert([{
          name: newDefect.name,
          category: newDefect.category || null,
          definition: newDefect.definition || null,
          icon_name: 'Heart' // Default icon
        }])
        .select()
        .single();

      if (defectError) throw defectError;

      // Add relationships to virtues
      if (newDefect.virtues.length > 0) {
        const relationships = newDefect.virtues.map(virtueId => ({
          defect_id: defectData.id,
          virtue_id: virtueId
        }));

        const { error: relationError } = await supabase
          .from('defects_virtues')
          .insert(relationships);

        if (relationError) throw relationError;
      }

      // Reset form
      setNewDefect({ name: '', category: '', definition: '', virtues: [] });
      loadData(); // Refresh data
      alert('Defect created successfully!');

    } catch (error) {
      alert('Error creating defect: ' + (error as Error).message);
    }
  };

  if (loading) return <div>Loading virtue-defect relationships...</div>;

  return (
    <div className="space-y-6">
      {/* Virtue-Defect Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Virtue-Defect Relationships</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {virtues.map(virtue => (
              <div key={virtue.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-blue-800">{virtue.name}</h3>
                  <span className="text-sm text-gray-500">
                    {virtue.defects.length} defects
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mb-3">
                  {virtue.defects.map(defect => (
                    <div key={defect.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <div>
                        <span className="font-medium">{defect.name}</span>
                        {defect.category && (
                          <span className="text-xs text-gray-500 ml-2">({defect.category})</span>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeDefectFromVirtue(virtue.id, defect.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Add defect to virtue */}
                <Select onValueChange={(value) => addDefectToVirtue(virtue.id, parseInt(value))}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Add defect to this virtue..." />
                  </SelectTrigger>
                  <SelectContent>
                    {allDefects
                      .filter(defect => !virtue.defects.some(vd => vd.id === defect.id))
                      .map(defect => (
                        <SelectItem key={defect.id} value={defect.id.toString()}>
                          {defect.name} {defect.category && `(${defect.category})`}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create New Defect */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Defect
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Defect Name *</label>
              <Input
                value={newDefect.name}
                onChange={(e) => setNewDefect(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., People-pleasing"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <Input
                value={newDefect.category}
                onChange={(e) => setNewDefect(prev => ({ ...prev, category: e.target.value }))}
                placeholder="e.g., Boundaries"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Definition</label>
            <Textarea
              value={newDefect.definition}
              onChange={(e) => setNewDefect(prev => ({ ...prev, definition: e.target.value }))}
              placeholder="Brief definition of this defect..."
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Associated Virtues</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {virtues.map(virtue => (
                <label key={virtue.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newDefect.virtues.includes(virtue.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setNewDefect(prev => ({ 
                          ...prev, 
                          virtues: [...prev.virtues, virtue.id] 
                        }));
                      } else {
                        setNewDefect(prev => ({ 
                          ...prev, 
                          virtues: prev.virtues.filter(id => id !== virtue.id) 
                        }));
                      }
                    }}
                  />
                  <span className="text-sm">{virtue.name}</span>
                </label>
              ))}
            </div>
          </div>

          <Button onClick={createNewDefect} className="w-full">
            Create Defect
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
