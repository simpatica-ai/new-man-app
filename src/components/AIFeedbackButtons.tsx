'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ThumbsUp, ThumbsDown, Send, X } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

interface AIFeedbackButtonsProps {
  promptName: string
  promptContent: string
  className?: string
  size?: 'sm' | 'default'
}

export function AIFeedbackButtons({ 
  promptName, 
  promptContent, 
  className = '',
  size = 'sm'
}: AIFeedbackButtonsProps) {
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackType, setFeedbackType] = useState<'positive' | 'negative' | null>(null)
  const [feedbackText, setFeedbackText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleFeedbackClick = (type: 'positive' | 'negative') => {
    setFeedbackType(type)
    setShowFeedback(true)
  }

  const handleSubmit = async () => {
    if (!feedbackType) return
    
    setIsSubmitting(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      await supabase.from('ai_prompt_feedback').insert({
        user_id: user?.id,
        prompt_name: promptName,
        prompt_content: promptContent,
        feedback_type: feedbackType,
        feedback_text: feedbackText.trim() || null,
        created_at: new Date().toISOString()
      })
      
      setSubmitted(true)
      setTimeout(() => {
        setShowFeedback(false)
        setSubmitted(false)
        setFeedbackText('')
        setFeedbackType(null)
      }, 1500)
      
    } catch (error) {
      console.error('Error submitting feedback:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setShowFeedback(false)
    setFeedbackText('')
    setFeedbackType(null)
  }

  if (submitted) {
    return (
      <div className={`flex items-center gap-1 text-xs text-green-600 ${className}`}>
        <ThumbsUp className="h-3 w-3" />
        <span>Thank you!</span>
      </div>
    )
  }

  if (showFeedback) {
    return (
      <div className={`space-y-2 p-3 bg-stone-50 rounded-lg border border-stone-200 ${className}`}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-stone-700">
            {feedbackType === 'positive' ? 'What worked well?' : 'How can we improve?'}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="h-6 w-6 p-0 hover:bg-stone-200"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
        
        <Textarea
          value={feedbackText}
          onChange={(e) => setFeedbackText(e.target.value)}
          placeholder="Optional: Share your thoughts..."
          className="text-xs min-h-[60px] resize-none bg-white border-stone-300 focus:border-amber-400 focus:ring-amber-400/20"
        />
        
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            className="h-7 px-3 text-xs border-stone-300 hover:bg-stone-100"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="h-7 px-3 text-xs bg-amber-600 hover:bg-amber-700 text-white"
          >
            {isSubmitting ? (
              'Sending...'
            ) : (
              <>
                <Send className="h-3 w-3 mr-1" />
                Send
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Button
        variant="ghost"
        size={size === 'sm' ? 'sm' : 'default'}
        onClick={() => handleFeedbackClick('positive')}
        className={`${
          size === 'sm' 
            ? 'h-6 w-6 p-0 hover:bg-green-50 hover:text-green-600' 
            : 'h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600'
        } transition-colors`}
        title="This was helpful"
      >
        <ThumbsUp className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
      </Button>
      
      <Button
        variant="ghost"
        size={size === 'sm' ? 'sm' : 'default'}
        onClick={() => handleFeedbackClick('negative')}
        className={`${
          size === 'sm' 
            ? 'h-6 w-6 p-0 hover:bg-red-50 hover:text-red-600' 
            : 'h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600'
        } transition-colors`}
        title="This needs improvement"
      >
        <ThumbsDown className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
      </Button>
    </div>
  )
}