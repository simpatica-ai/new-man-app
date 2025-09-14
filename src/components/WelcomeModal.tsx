// src/components/WelcomeModal.tsx
'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Rocket, BookText, UserPlus, Milestone, Award, BookOpen } from "lucide-react"

// ## FIX: New, custom-generated background image URL ##


interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl max-w-[95vw] max-h-[90vh] overflow-y-auto mx-4">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 pr-4">
            <DialogTitle className="text-2xl sm:text-3xl font-light text-stone-800 text-center">Welcome to A New Man</DialogTitle>
            <DialogDescription className="text-stone-600 text-center mt-2 text-sm sm:text-base">
              Your private workspace for a journey of self-reflection and growth.
            </DialogDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-stone-400 hover:text-stone-600 flex-shrink-0">
            ✕
          </Button>
        </div>
        
        <div className="px-2 sm:px-8 py-4 sm:py-6">
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-4 w-4 text-amber-600" />
              <p className="text-sm font-medium text-amber-800">New! Check out "Your Virtue Journey" overview</p>
            </div>
            <p className="text-xs text-amber-700">Click the expandable card in your dashboard to understand how all the pieces fit together in your months-long virtue development journey.</p>
          </div>
          
          <h3 className="mb-4 text-center font-semibold text-stone-700 text-sm sm:text-base">Here&apos;s how your journey will unfold:</h3>
          <div className="grid gap-3 sm:gap-4">
              <div className="flex items-start gap-3 sm:gap-4">
                  <div className="bg-amber-100 p-2 rounded-full mt-1 flex-shrink-0"><Rocket className="h-4 w-4 sm:h-5 sm:w-5 text-amber-700"/></div>
                  <div className="min-w-0">
                      <h4 className="font-semibold text-stone-700 text-sm sm:text-base">1. Take the Assessment</h4>
                      <p className="text-xs sm:text-sm text-stone-600">Start with a short Virtue Assessment to discover your personalized path.</p>
                  </div>
              </div>
              <div className="flex items-start gap-3 sm:gap-4">
                  <div className="bg-amber-100 p-2 rounded-full mt-1 flex-shrink-0"><Milestone className="h-4 w-4 sm:h-5 sm:w-5 text-amber-700"/></div>
                  <div className="min-w-0">
                      <h4 className="font-semibold text-stone-700 text-sm sm:text-base">2. Work the Stages</h4>
                      <p className="text-xs sm:text-sm text-stone-600">For each virtue, you&apos;ll move through stages of dismantling, building, and maintaining healthy habits.</p>
                  </div>
              </div>
              <div className="flex items-start gap-3 sm:gap-4">
                  <div className="bg-amber-100 p-2 rounded-full mt-1 flex-shrink-0"><BookText className="h-4 w-4 sm:h-5 sm:w-5 text-amber-700"/></div>
                  <div className="min-w-0">
                      <h4 className="font-semibold text-stone-700 text-sm sm:text-base">3. Maintain a Journal</h4>
                      <p className="text-xs sm:text-sm text-stone-600">Use your private journal to reflect on your progress and insights.</p>
                  </div>
              </div>
              <div className="flex items-start gap-3 sm:gap-4">
                  <div className="bg-amber-100 p-2 rounded-full mt-1 flex-shrink-0"><UserPlus className="h-4 w-4 sm:h-5 sm:w-5 text-amber-700"/></div>
                  <div className="min-w-0">
                      <h4 className="font-semibold text-stone-700 text-sm sm:text-base">4. Invite a Sponsor</h4>
                      <p className="text-xs sm:text-sm text-stone-600">When you&apos;re ready, invite a sponsor to share your journey and receive guidance.</p>
                  </div>
              </div>
              <div className="flex items-start gap-3 sm:gap-4">
                  <div className="bg-amber-100 p-2 rounded-full mt-1 flex-shrink-0"><Award className="h-4 w-4 sm:h-5 sm:w-5 text-amber-700"/></div>
                  <div className="min-w-0">
                      <h4 className="font-semibold text-stone-700 text-sm sm:text-base">5. Track Your Progress</h4>
                      <p className="text-xs sm:text-sm text-stone-600">Retake the assessment at any time to visualize your growth. Eventually, you will be able to print a &quot;Virtue Journey Book&quot;.</p>
                  </div>
              </div>
          </div>
        </div>
        
        <DialogFooter className="flex-col sm:flex-row sm:justify-between gap-2 mt-4 sm:mt-6">
          <Button type="button" variant="ghost" onClick={onClose} className="w-full sm:w-auto text-sm">
            I&apos;ll Explore on My Own
          </Button>
          <Link href="/assessment" className="w-full sm:w-auto">
            <Button type="submit" className="w-full sm:w-auto text-sm">Start My Assessment</Button>
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}