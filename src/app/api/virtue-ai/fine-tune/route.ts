import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  return NextResponse.json({ error: 'Fine-tuning not yet implemented' }, { status: 501 })
}

export async function GET() {
  return NextResponse.json({ jobs: [] })
}