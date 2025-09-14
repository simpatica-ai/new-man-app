'use client'

import { useState, useEffect } from 'react';
import { getDefectsWithVirtues, calculateVirtueScores, checkHealthyBoundariesExists, type DefectWithVirtues, type VirtueScore } from '@/lib/assessmentService';

export function useAssessmentData() {
  const [defects, setDefects] = useState<DefectWithVirtues[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [healthyBoundariesExists, setHealthyBoundariesExists] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [defectsData, boundariesExists] = await Promise.all([
          getDefectsWithVirtues(),
          checkHealthyBoundariesExists()
        ]);
        
        setDefects(defectsData);
        setHealthyBoundariesExists(boundariesExists);
        
        if (defectsData.length === 0) {
          setError('No defects found in database. Please check database seeding.');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load assessment data');
        console.error('Error loading assessment data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const calculateScores = async (
    ratings: { [defectName: string]: number },
    harmLevels: { [defectName: string]: string }
  ): Promise<VirtueScore[]> => {
    return calculateVirtueScores(ratings, harmLevels);
  };

  return {
    defects,
    loading,
    error,
    healthyBoundariesExists,
    calculateScores
  };
}
