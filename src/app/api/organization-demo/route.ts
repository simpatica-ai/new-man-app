import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, organization, organizationType, message } = body;

    // Validate required fields
    if (!name || !email || !organization) {
      return NextResponse.json(
        { error: 'Name, email, and organization are required' },
        { status: 400 }
      );
    }

    // Store the demo request in the database
    const { data, error } = await supabase
      .from('organization_demo_requests')
      .insert([
        {
          name,
          email,
          organization,
          organization_type: organizationType,
          message,
          status: 'pending',
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error storing demo request:', error);
      return NextResponse.json(
        { error: 'Failed to submit demo request' },
        { status: 500 }
      );
    }

    // TODO: Send notification email to sales team
    // TODO: Send confirmation email to requester

    return NextResponse.json(
      { 
        message: 'Demo request submitted successfully',
        id: data.id
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error processing demo request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}