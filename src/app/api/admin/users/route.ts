import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    // Use service role key to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get auth users with emails
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers()
    if (authError) throw authError

    // Get profiles
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, created_at')
    if (profileError) throw profileError

    // Get connections
    const { data: connections, error: connectionsError } = await supabase
      .from('sponsor_connections')
      .select('practitioner_user_id, sponsor_user_id, status')
    if (connectionsError) throw connectionsError

    // Get all sponsor profiles
    const sponsorIds = connections?.filter(c => c.status === 'active').map(c => c.sponsor_user_id) || []
    const { data: sponsorProfiles, error: sponsorError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', sponsorIds)
    if (sponsorError) throw sponsorError

    // Get support tickets
    const { data: supportTickets, error: ticketError } = await supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false })

    // Get alpha feedback
    const { data: alphaFeedback, error: feedbackError } = await supabase
      .from('alpha_feedback')
      .select('*')
      .order('created_at', { ascending: false })

    // Merge user data
    const userData = profiles.map(p => {
      const authUser = users.find(u => u.id === p.id)
      const connection = connections.find(c => c.practitioner_user_id === p.id && c.status === 'active')
      const sponsorProfile = connection ? sponsorProfiles.find(sp => sp.id === connection.sponsor_user_id) : null
      const sponsorAuthUser = connection ? users.find(u => u.id === connection.sponsor_user_id) : null
      
      return {
        ...p,
        email: authUser?.email || null,
        last_sign_in_at: authUser?.last_sign_in_at || null,
        connection_id: connection ? connection.sponsor_user_id : null,
        sponsor_name: sponsorProfile?.full_name || null,
        sponsor_email: sponsorAuthUser?.email || null
      }
    })

    return NextResponse.json({ 
      users: userData,
      supportTickets: supportTickets || [],
      alphaFeedback: alphaFeedback || []
    })
  } catch (error) {
    console.error('Admin API error:', error)
    return NextResponse.json({ error: 'Failed to fetch admin data' }, { status: 500 })
  }
}
