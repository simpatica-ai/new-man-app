'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { X, MessageSquare } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { feedbackSchema, validateInput } from '@/lib/validation'

interface FeedbackSurveyModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function FeedbackSurveyModal({ isOpen, onClose }: FeedbackSurveyModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    showName: false,
    testingTime: '',
    completedAssessment: '',
    stagesCompleted: '',
    overallUX: '',
    aiRelevance: '',
    aiHelpfulness: '',
    aiQuality: '',
    writingExperience: '',
    technicalIssues: [] as string[],
    likelyToUse: '',
    motivation: '',
    valueComparison: '',
    biggestMissing: '',
    featureRequests: '',
    additionalFeedback: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setValidationErrors([])
    
    // Client-side validation
    const validation = validateInput(feedbackSchema, {
      name: formData.name || undefined,
      show_name: formData.showName,
      testing_time: formData.testingTime,
      completed_assessment: formData.completedAssessment,
      overall_ux: formData.overallUX ? parseInt(formData.overallUX) : undefined,
      ai_relevance: formData.aiRelevance ? parseInt(formData.aiRelevance) : undefined,
      likely_to_use: formData.likelyToUse ? parseInt(formData.likelyToUse) : undefined,
      biggest_missing: formData.biggestMissing || undefined,
      additional_feedback: formData.additionalFeedback || undefined,
      technical_issues: formData.technicalIssues.length > 0 ? formData.technicalIssues : undefined,
    })

    if (!validation.success) {
      setValidationErrors(validation.errors)
      setIsSubmitting(false)
      return
    }
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase.from('alpha_feedback').insert({
        user_id: user.id,
        name: formData.name || null,
        show_name: formData.showName,
        testing_time: formData.testingTime,
        completed_assessment: formData.completedAssessment,
        stages_completed: formData.stagesCompleted,
        overall_ux: formData.overallUX ? parseInt(formData.overallUX) : null,
        ai_relevance: formData.aiRelevance ? parseInt(formData.aiRelevance) : null,
        ai_helpfulness: formData.aiHelpfulness ? parseInt(formData.aiHelpfulness) : null,
        ai_quality: formData.aiQuality || null,
        writing_experience: formData.writingExperience || null,
        technical_issues: formData.technicalIssues.length > 0 ? formData.technicalIssues : null,
        likely_to_use: formData.likelyToUse ? parseInt(formData.likelyToUse) : null,
        motivation: formData.motivation || null,
        value_comparison: formData.valueComparison || null,
        biggest_missing: formData.biggestMissing || null,
        feature_requests: formData.featureRequests || null,
        additional_feedback: formData.additionalFeedback || null
      })

      if (error) throw error

      alert('Thank you! Your feedback has been submitted.')
      onClose()
    } catch (error) {
      console.error('Error submitting feedback:', error)
      alert('Error submitting feedback. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCheckboxChange = (value: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      technicalIssues: checked 
        ? [...prev.technicalIssues, value]
        : prev.technicalIssues.filter(item => item !== value)
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Alpha User Feedback
            </CardTitle>
            <CardDescription>Help us improve with your honest feedback</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {validationErrors.length > 0 && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-medium text-red-800 mb-2">Please fix the following errors:</h4>
              <ul className="text-sm text-red-700 space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block font-medium mb-2">Your name (optional):</label>
                <input 
                  type="text"
                  className="w-full p-2 border rounded"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Leave blank for anonymous feedback"
                />
                <label className="flex items-center mt-2">
                  <input 
                    type="checkbox"
                    checked={formData.showName}
                    onChange={(e) => setFormData(prev => ({ ...prev, showName: e.target.checked }))}
                    className="mr-2"
                  />
                  Show my name to admins
                </label>
              </div>

              <div>
                <label className="block font-medium mb-2">How long did you test the app?</label>
                <select 
                  className="w-full p-2 border rounded"
                  value={formData.testingTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, testingTime: e.target.value }))}
                  required
                >
                  <option value="">Select...</option>
                  <option value="15-30 minutes">15-30 minutes</option>
                  <option value="30-60 minutes">30-60 minutes</option>
                  <option value="1-2 hours">1-2 hours</option>
                  <option value="2+ hours">2+ hours</option>
                </select>
              </div>

              <div>
                <label className="block font-medium mb-2">Did you complete the virtue assessment?</label>
                <div className="space-y-2">
                  {['Yes, completed it', 'Started but didn\'t finish', 'No, couldn\'t find it'].map(option => (
                    <label key={option} className="flex items-center">
                      <input 
                        type="radio" 
                        name="completedAssessment"
                        value={option}
                        checked={formData.completedAssessment === option}
                        onChange={(e) => setFormData(prev => ({ ...prev, completedAssessment: e.target.value }))}
                        className="mr-2"
                        required
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-medium mb-2">Rate overall user experience (1=Confusing, 5=Intuitive):</label>
                <div className="flex gap-4">
                  {[1,2,3,4,5].map(num => (
                    <label key={num} className="flex items-center">
                      <input 
                        type="radio" 
                        name="overallUX"
                        value={num}
                        checked={formData.overallUX === String(num)}
                        onChange={(e) => setFormData(prev => ({ ...prev, overallUX: e.target.value }))}
                        className="mr-1"
                      />
                      {num}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-medium mb-2">How relevant was the AI guidance? (1=Generic, 5=Personal):</label>
                <div className="flex gap-4">
                  {[1,2,3,4,5].map(num => (
                    <label key={num} className="flex items-center">
                      <input 
                        type="radio" 
                        name="aiRelevance"
                        value={num}
                        checked={formData.aiRelevance === String(num)}
                        onChange={(e) => setFormData(prev => ({ ...prev, aiRelevance: e.target.value }))}
                        className="mr-1"
                      />
                      {num}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-medium mb-2">Technical issues encountered:</label>
                <div className="space-y-2">
                  {['Slow loading', 'Error messages', 'Mobile issues', 'Navigation problems', 'Saving problems', 'No issues'].map(issue => (
                    <label key={issue} className="flex items-center">
                      <input 
                        type="checkbox"
                        checked={formData.technicalIssues.includes(issue)}
                        onChange={(e) => handleCheckboxChange(issue, e.target.checked)}
                        className="mr-2"
                      />
                      {issue}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-medium mb-2">How likely to use regularly? (1=Very unlikely, 5=Very likely):</label>
                <div className="flex gap-4">
                  {[1,2,3,4,5].map(num => (
                    <label key={num} className="flex items-center">
                      <input 
                        type="radio" 
                        name="likelyToUse"
                        value={num}
                        checked={formData.likelyToUse === String(num)}
                        onChange={(e) => setFormData(prev => ({ ...prev, likelyToUse: e.target.value }))}
                        className="mr-1"
                      />
                      {num}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-medium mb-2">What's the biggest thing missing?</label>
                <Textarea 
                  value={formData.biggestMissing}
                  onChange={(e) => setFormData(prev => ({ ...prev, biggestMissing: e.target.value }))}
                  placeholder="Be specific about what would make this more useful"
                />
              </div>

              <div>
                <label className="block font-medium mb-2">Any other honest feedback?</label>
                <Textarea 
                  value={formData.additionalFeedback}
                  onChange={(e) => setFormData(prev => ({ ...prev, additionalFeedback: e.target.value }))}
                  placeholder="Don't hold back - honest feedback helps us improve"
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
