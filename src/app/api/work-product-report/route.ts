import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { generateWorkProductData, WorkProductFilters } from '@/lib/workProductService';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { practitioner_id, date_range, status_filter, virtue_ids } = body;

    // Validate required fields
    if (!practitioner_id) {
      return NextResponse.json({ error: 'Practitioner ID is required' }, { status: 400 });
    }

    if (!['completed', 'in_progress', 'both'].includes(status_filter)) {
      return NextResponse.json({ error: 'Invalid status filter' }, { status: 400 });
    }

    // TODO: Add authorization check - ensure user can access this practitioner's data
    // This would check if the user is a coach/therapist/admin for this practitioner's organization

    // Build filters
    const filters: WorkProductFilters = {
      practitioner_id,
      status_filter,
      date_range: date_range ? {
        start: date_range.start,
        end: date_range.end
      } : undefined,
      virtue_ids: virtue_ids && virtue_ids.length > 0 ? virtue_ids : undefined
    };

    // Generate report data
    const reportData = await generateWorkProductData(filters);

    return NextResponse.json({ data: reportData });

  } catch (error) {
    console.error('Error generating work product report:', error);
    return NextResponse.json(
      { error: 'Failed to generate work product report' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const practitioner_id = searchParams.get('practitioner_id');

    if (!practitioner_id) {
      return NextResponse.json({ error: 'Practitioner ID is required' }, { status: 400 });
    }

    // Get available virtues for the practitioner
    const { data: virtueData, error: virtueError } = await supabase
      .from('user_virtue_stage_progress')
      .select(`
        virtue_id,
        virtues (
          id,
          name
        )
      `)
      .eq('user_id', practitioner_id);

    if (virtueError) {
      throw virtueError;
    }

    // Get unique virtues
    const uniqueVirtues = new Map();
    virtueData?.forEach(item => {
      if (item.virtues) {
        uniqueVirtues.set(item.virtues.id, item.virtues);
      }
    });

    const availableVirtues = Array.from(uniqueVirtues.values())
      .sort((a: any, b: any) => a.name.localeCompare(b.name));

    return NextResponse.json({ virtues: availableVirtues });

  } catch (error) {
    console.error('Error fetching available virtues:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available virtues' },
      { status: 500 }
    );
  }
}