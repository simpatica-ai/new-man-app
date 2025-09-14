import { supabase } from './supabaseClient';

export interface DefectWithVirtues {
  id: number;
  name: string;
  category: string | null;
  definition: string | null;
  icon_name: string | null;
  virtues: string[];
}

export interface VirtueScore {
  virtue: string;
  priority: number;
  defectIntensity: number;
}

// Cache for defects and virtues to avoid repeated database calls
let defectsCache: DefectWithVirtues[] | null = null;
let virtuesCache: { id: number; name: string }[] | null = null;

// Function to clear cache (useful for development)
export function clearAssessmentCache() {
  defectsCache = null;
  virtuesCache = null;
}

export async function getDefectsWithVirtues(): Promise<DefectWithVirtues[]> {
  if (defectsCache) return defectsCache;

  try {
    // Get all defects first
    const { data: defectsData, error: defectsError } = await supabase
      .from('defects')
      .select('id, name, category, definition, icon_name');

    console.log('Raw defects count from database:', defectsData?.length);

    if (defectsError) {
      console.error('Defects error details:', defectsError);
      throw defectsError;
    }

    // Get all defect-virtue relationships
    const { data: relationData, error: relationError } = await supabase
      .from('defects_virtues')
      .select(`
        defect_id,
        virtues (name)
      `);

    console.log('Relations count from database:', relationData?.length);

    if (relationError) {
      console.error('Relations error details:', relationError);
      throw relationError;
    }

    // Transform the data to match our interface
    defectsCache = defectsData?.map(defect => {
      const virtueRelations = relationData?.filter(rel => rel.defect_id === defect.id) || [];
      return {
        id: defect.id,
        name: defect.name,
        category: defect.category,
        definition: defect.definition,
        icon_name: defect.icon_name,
        virtues: virtueRelations.map((rel: any) => rel.virtues.name)
      };
    }) || [];

    console.log('Final defects cache count:', defectsCache.length);
    console.log('Defects with no virtues:', defectsCache.filter(d => d.virtues.length === 0).map(d => d.name));

    return defectsCache;
  } catch (error) {
    console.error('Error fetching defects with virtues:', error);
    // Fallback to hardcoded data if database fails
    return [];
  }
}

export async function getVirtues(): Promise<{ id: number; name: string }[]> {
  if (virtuesCache) return virtuesCache;

  try {
    const { data, error } = await supabase
      .from('virtues')
      .select('id, name')
      .order('name');

    if (error) throw error;

    virtuesCache = data || [];
    return virtuesCache;
  } catch (error) {
    console.error('Error fetching virtues:', error);
    return [];
  }
}

export async function calculateVirtueScores(
  ratings: { [defectName: string]: number },
  harmLevels: { [defectName: string]: string }
): Promise<VirtueScore[]> {
  const defects = await getDefectsWithVirtues();
  const harmLevelsMap: { [key: string]: number } = { 
    None: 0, 
    Minimal: 1, 
    Moderate: 2, 
    Significant: 3, 
    Severe: 4 
  };

  // Calculate virtue scores based on defect ratings and harm levels
  const virtueScores: { [virtue: string]: { actualImpact: number; maxPossibleImpact: number } } = {};

  defects.forEach(defect => {
    const rating = ratings[defect.name];
    const harmLevel = harmLevels[defect.name];
    
    if (rating !== undefined && harmLevel) {
      const harmValue = harmLevelsMap[harmLevel] || 0;
      const actualImpact = rating * harmValue; // frequency × impact
      const maxPossibleImpact = 5 * 4; // max frequency (5) × max harm (4)
      
      defect.virtues.forEach(virtue => {
        if (!virtueScores[virtue]) {
          virtueScores[virtue] = { actualImpact: 0, maxPossibleImpact: 0 };
        }
        virtueScores[virtue].actualImpact += actualImpact;
        virtueScores[virtue].maxPossibleImpact += maxPossibleImpact;
      });
    }
  });

  // Convert to final scores (0-10 scale where 10 = perfect virtue)
  const results: VirtueScore[] = Object.entries(virtueScores).map(([virtue, data]) => {
    const impactPercentage = data.maxPossibleImpact > 0 ? 
      data.actualImpact / data.maxPossibleImpact : 0;
    
    const virtueScore = (1 - impactPercentage) * 10; // 10 - (impact percentage × 10)
    
    return {
      virtue,
      priority: Math.round(data.actualImpact), // Total actual impact for priority
      defectIntensity: Math.max(0, Math.min(10, impactPercentage * 10)) // Store actual defect intensity (0-10)
    };
  });

  return results.sort((a, b) => a.defectIntensity - b.defectIntensity); // Sort by lowest scores first (most impacted)
}

export async function checkHealthyBoundariesExists(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('virtues')
      .select('name')
      .eq('name', 'Healthy Boundaries')
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      throw error;
    }

    return !!data;
  } catch (error) {
    console.error('Error checking Healthy Boundaries virtue:', error);
    return false;
  }
}

// Function to seed database with missing data if needed
export async function seedMissingData(): Promise<void> {
  try {
    // Check if Healthy Boundaries exists
    const healthyBoundariesExists = await checkHealthyBoundariesExists();
    
    if (!healthyBoundariesExists) {
      console.log('Healthy Boundaries virtue not found in database');
      // You would need to add it manually or create a migration
    }

    // Check if defects are properly seeded
    const defects = await getDefectsWithVirtues();
    if (defects.length === 0) {
      console.log('No defects found in database - may need seeding');
    }

  } catch (error) {
    console.error('Error seeding missing data:', error);
  }
}
