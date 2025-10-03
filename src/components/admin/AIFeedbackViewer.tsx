'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react'

interface FeedbackItem {
  id: number
  prompt_name: string
  feedback_type: 'positive' | 'negative'
  feedback_text: string | null
  created_at: string
  user_id: string
  profiles?: { full_name: string | null }
}

export function AIFeedbackViewer() {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    positive: 0,
    negative: 0,
    withText: 0
  })

  useEffect(() => {
    fetchFeedback()
  }, [])

  const fetchFeedback = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_prompt_feedback')
        .select(`
          *,
          profiles (full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error

      setFeedback(data || [])
      
      // Calculate stats
      const total = data?.length || 0
      const positive = data?.filter(f => f.feedback_type === 'positive').length || 0
      const negative = data?.filter(f => f.feedback_type === 'negative').length || 0
      const withText = data?.filter(f => f.feedback_text?.trim()).length || 0
      
      setStats({ total, positive, negative, withText })
      
    } catch (error) {
      console.error('Error fetching feedback:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const groupedFeedback = feedback.reduce((acc, item) => {
    if (!acc[item.prompt_name]) {
      acc[item.prompt_name] = []
    }
    acc[item.prompt_name].push(item)
    return acc
  }, {} as Record<string, FeedbackItem[]>)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Prompt Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-stone-200 rounded w-1/4"></div>
            <div className="h-20 bg-stone-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            AI Prompt Feedback Overview
          </CardTitle>
          <CardDescription>
            User feedback on AI-generated prompts and guidance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-stone-800">{stats.total}</div>
              <div className="text-sm text-stone-600">Total Feedback</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.positive}</div>
              <div className="text-sm text-stone-600">Positive</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.negative}</div>
              <div className="text-sm text-stone-600">Negative</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.withText}</div>
              <div className="text-sm text-stone-600">With Comments</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feedback by Prompt */}
      <div className="space-y-4">
        {Object.entries(groupedFeedback).map(([promptName, items]) => {
          const positiveCount = items.filter(i => i.feedback_type === 'positive').length
          const negativeCount = items.filter(i => i.feedback_type === 'negative').length
          
          return (
            <Card key={promptName}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{promptName}</CardTitle>
                    <CardDescription>
                      {items.length} feedback items
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      <ThumbsUp className="h-3 w-3 mr-1" />
                      {positiveCount}
                    </Badge>
                    <Badge variant="outline" className="text-red-600 border-red-200">
                      <ThumbsDown className="h-3 w-3 mr-1" />
                      {negativeCount}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="border-l-2 border-stone-200 pl-4 py-2">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          {item.feedback_type === 'positive' ? (
                            <ThumbsUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <ThumbsDown className="h-4 w-4 text-red-600" />
                          )}
                          <span className="text-sm font-medium">
                            {item.profiles?.full_name || 'Anonymous'}
                          </span>
                        </div>
                        <span className="text-xs text-stone-500">
                          {formatDate(item.created_at)}
                        </span>
                      </div>
                      {item.feedback_text && (
                        <p className="text-sm text-stone-700 mt-1 bg-stone-50 p-2 rounded">
                          "{item.feedback_text}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {feedback.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-stone-400 mx-auto mb-4" />
            <p className="text-stone-600">No feedback received yet.</p>
            <p className="text-sm text-stone-500 mt-1">
              Feedback will appear here as users interact with AI prompts.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}