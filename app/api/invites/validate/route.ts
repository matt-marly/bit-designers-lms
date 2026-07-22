import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  const { code } = await request.json()

  if (!code) {
    return NextResponse.json(
      { valid: false, error: 'No invite code provided' },
      { status: 400 }
    )
  }

  const supabase = getServiceClient()

  const { data: invite, error } = await supabase
    .from('invites')
    .select('id, code, cohort_id, track, max_uses, use_count, active, expires_at, cohorts(name)')
    .eq('code', code)
    .single()

  if (error || !invite) {
    return NextResponse.json(
      { valid: false, error: 'Invite not found' },
      { status: 404 }
    )
  }

  if (!invite.active) {
    return NextResponse.json(
      { valid: false, error: 'This invite has been deactivated' },
      { status: 400 }
    )
  }

  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return NextResponse.json(
      { valid: false, error: 'This invite has expired' },
      { status: 400 }
    )
  }

  if (invite.use_count >= invite.max_uses) {
    return NextResponse.json(
      { valid: false, error: 'This invite has reached its usage limit' },
      { status: 400 }
    )
  }

  return NextResponse.json({
    valid: true,
    inviteId: invite.id,
    cohortId: invite.cohort_id,
    track: invite.track,
    cohortName: (invite.cohorts as any)?.name || 'Unknown Cohort'
  })
}

export async function PATCH(request: NextRequest) {
  const { inviteId } = await request.json()
  const supabase = getServiceClient()

  const { data: invite } = await supabase
    .from('invites')
    .select('use_count')
    .eq('id', inviteId)
    .single()

  if (invite) {
    await supabase
      .from('invites')
      .update({ use_count: invite.use_count + 1 })
      .eq('id', inviteId)
  }

  return NextResponse.json({ success: true })
}
