import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    console.log('Admin API called')
    console.log('Environment check:')
    console.log('NEXT_PUBLIC_SUPABASE_URL exists:', !!process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('SUPABASE_SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase environment variables')
      return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 })
    }

    // Use service role key to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    console.log('Getting auth users...')
    // Get auth users with emails
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers()
    if (authError) {
      console.error('Auth users error:', authError)
      throw authError
    }
    console.log('Auth users count:', users?.length || 0)

    console.log('Getting profiles...')
    // Get profiles
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, created_at')
    if (profileError) {
      console.error('Profiles error:', profileError)
      throw profileError
    }
    console.log('Profiles count:', profiles?.length || 0)

    // Get connections
    const { data: connections, error: connectionsError } = await supabase
      .from('sponsor_connections')
      .select('practitioner_user_id, sponsor_user_id, status')
    if (connectionsError) throw connectionsError

    // Get all sponsor profiles
    const sponsorIds = connections?.filter(c => c.status === 'active').map(c => c.sponsor_user_id) || []
    let sponsorProfiles: { id: string; full_name: string }[] = []
    if (sponsorIds.length > 0) {
      const { data: sponsorData, error: sponsorError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', sponsorIds)
      if (sponsorError) throw sponsorError
      sponsorProfiles = sponsorData || []
    }

    // Get pending sponsor relationships (invitations not yet accepted)
    // Note: Removing practitioner_email query as column doesn't exist
    const { data: pendingRelationships, error: pendingError } = await supabase
      .from('sponsor_relationships')
      .select('sponsor_id, status')
      .in('status', ['pending', 'pending_confirmation'])
    if (pendingError) {
      console.error('Pending relationships error:', pendingError)
      // Don't throw, just log and continue with empty array
      console.log('Continuing without pending relationships data')
    }

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

    // Get payment totals for each user
    const { data: paymentTotals, error: paymentError } = await supabase
      .from('payments')
      .select('user_id, amount, status')
      .eq('status', 'succeeded')
    
    if (paymentError) {
      console.error('Payment totals error:', paymentError)
    }

    // Calculate payment totals by user
    const userPaymentTotals = (paymentTotals || []).reduce((acc, payment) => {
      if (!acc[payment.user_id]) {
        acc[payment.user_id] = 0;
      }
      acc[payment.user_id] += parseFloat(payment.amount || '0');
      return acc;
    }, {} as Record<string, number>);

    // Merge user data
    const userData = (profiles || []).map(p => {
      const authUser = users?.find(u => u.id === p.id)
      const connection = connections?.find(c => c.practitioner_user_id === p.id && c.status === 'active')
      const sponsorProfile = connection ? sponsorProfiles.find(sp => sp.id === connection.sponsor_user_id) : null
      const sponsorAuthUser = connection ? users?.find(u => u.id === connection.sponsor_user_id) : null
      const pendingInvite = pendingRelationships?.find(pr => pr.practitioner_email === authUser?.email)
      
      // Determine user status
      let userStatus = 'active'
      if (authUser && !authUser.email_confirmed_at) {
        userStatus = 'pending_confirmation'
      }
      
      // Determine sponsor status
      let sponsorStatus = null
      if (pendingInvite) {
        sponsorStatus = pendingInvite.status === 'pending' ? 'invite_pending' : 'sponsor_pending_confirmation'
      }

      // Get payment total for this user
      const paymentTotal = userPaymentTotals[p.id] || 0;

      // Determine user type (individual vs organization member)
      const userType = p.organization_id ? 'org_user' : 'individual';
      
      return {
        ...p,
        email: authUser?.email || null,
        last_sign_in_at: authUser?.last_sign_in_at || null,
        email_confirmed_at: authUser?.email_confirmed_at || null,
        user_status: userStatus,
        user_type: userType,
        payment_total: paymentTotal,
        connection_id: connection ? connection.sponsor_user_id : null,
        sponsor_name: sponsorProfile?.full_name || null,
        sponsor_email: sponsorAuthUser?.email || null,
        sponsor_status: sponsorStatus
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
