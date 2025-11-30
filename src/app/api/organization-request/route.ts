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

    // Insert the organization request into the database
    const { error } = await supabase
      .from('organization_requests')
      .insert({
        contact_name: name,
        contact_email: email,
        organization_name: organization,
        organization_description: `Organization Type: ${organizationType || 'Not specified'}\n\nNeeds: ${message || 'Not specified'}`,
        use_case: message || 'Recovery programming with virtue development',
        estimated_users: 25, // Default for recovery organizations
        status: 'pending'
      });

    if (error) {
      console.error('Database error details:', error);
      return NextResponse.json(
        { 
          error: 'Failed to submit organization request',
          details: error.message,
          code: error.code 
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Organization request submitted successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}