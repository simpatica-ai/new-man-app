// Virtue name mapping for chart display
export const virtueChartDisplayMap: { [key: string]: string } = {
  "Healthy Boundaries": "Boundaries"
};

export const getChartDisplayVirtueName = (dbName: string): string => {
  return virtueChartDisplayMap[dbName] || dbName;
};

// Stage progress status types
export type StageProgressStatus = 'not_started' | 'in_progress' | 'completed';

// Common types
export type StageProgress = { 
  virtue_id: number; 
  stage_number: number; 
  status: StageProgressStatus; 
};

export type Virtue = { 
  id: number; 
  name: string; 
  description: string | null; 
  short_description: string | null; 
  virtue_score?: number; 
};

export type Connection = { 
  id: number; 
  status: string; 
  coach_name: string | null; 
};

// Core virtues list for reference
export const coreVirtuesList = [
  "Humility", "Honesty", "Gratitude", "Self-Control", "Mindfulness", 
  "Patience", "Integrity", "Compassion", "Healthy Boundaries", 
  "Responsibility", "Vulnerability", "Respect"
];

// Harm levels mapping
export const harmLevelsMap: { [key: string]: number } = { 
  None: 0, 
  Minimal: 1, 
  Moderate: 2, 
  Significant: 3, 
  Severe: 4 
};
