import { NextResponse } from 'next/server'

// Mock file management for now - will be replaced with real GCS integration
const mockFiles = [
  {
    name: 'virtue-training-1758425023548.jsonl',
    size: 245,
    created: '2025-01-21T02:10:23Z',
    samples: 2,
    description: 'Aristotelian virtue guidance samples'
  },
  {
    name: 'virtue-training-1758424884441.jsonl', 
    size: 512,
    created: '2025-01-21T01:48:04Z',
    samples: 5,
    description: 'Stoic philosophy samples'
  }
]

export async function GET() {
  return NextResponse.json({ files: mockFiles })
}

export async function POST(request: Request) {
  const { action, fileNames } = await request.json()
  
  if (action === 'combine') {
    // Mock combining files
    const totalSamples = mockFiles
      .filter(f => fileNames.includes(f.name))
      .reduce((sum, f) => sum + f.samples, 0)
    
    return NextResponse.json({
      success: true,
      combinedFile: 'master-training-dataset.jsonl',
      totalSamples,
      message: `Combined ${fileNames.length} files into master dataset`
    })
  }
  
  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}