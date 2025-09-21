import { NextRequest, NextResponse } from 'next/server'
import { VertexAI } from '@google-cloud/vertexai'

const vertex_ai = new VertexAI({
  project: process.env.GOOGLE_CLOUD_PROJECT_ID!,
  location: 'us-central1'
})

export async function POST(request: NextRequest) {
  try {
    const { prompt, modelEndpoint } = await request.json()

    // Use fine-tuned model if endpoint provided, otherwise use base model
    const modelName = modelEndpoint || 'gemini-1.0-pro'
    
    const model = vertex_ai.preview.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        maxOutputTokens: 512,
      },
    })

    const result = await model.generateContent(prompt)
    const response = result.response.candidates?.[0]?.content.parts[0]?.text || ''

    return NextResponse.json({
      success: true,
      response,
      modelUsed: modelName,
    })

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}