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
import { Checkbox } from "@/components/ui/checkbox"

import Link from "next/link"
import { Award, BookText, UserPlus, ArrowRight, ArrowDown } from "lucide-react"
import { useState } from "react"

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('hideWelcomeModal', 'true');
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl max-w-[90vw] max-h-[90vh] overflow-y-auto mx-2">
        <div className="mb-4">
          <DialogTitle className="text-xl sm:text-2xl font-light text-stone-800 text-center">Congratulations!</DialogTitle>
          <DialogDescription className="text-stone-600 text-center mt-2 text-sm">
            You&apos;ve completed the first step - Discovery
          </DialogDescription>
        </div>
        
        <div className="px-1 sm:px-8 py-2 sm:py-6">
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-5 w-5 text-green-600" />
              <p className="text-sm font-medium text-green-800">Assessment Complete!</p>
            </div>
            <p className="text-sm text-green-700">Twelve virtues are assembled and listed from virtues needing the greatest development work to the least.</p>
          </div>
          
          <h3 className="mb-4 text-center font-semibold text-stone-700 text-sm sm:text-base">Your Virtue Development Journey:</h3>
          <div className="grid gap-3 sm:gap-4">
              <div className="flex items-start gap-3 sm:gap-4">
                  <div className="bg-amber-100 p-2 rounded-full mt-1 flex-shrink-0"><BookText className="h-4 w-4 sm:h-5 sm:w-5 text-amber-700"/></div>
                  <div className="min-w-0">
                      <h4 className="font-semibold text-stone-700 text-sm sm:text-base">Four Stages of Development</h4>
                      <p className="text-xs sm:text-sm text-stone-600">Beneath each virtue are 4 stages: Discovery (complete), Dismantling, Building, and Practicing. The numbered stages are buttons that take you to the virtue desktop.</p>
                  </div>
              </div>
              <div className="flex items-start gap-3 sm:gap-4">
                  <div className="bg-amber-100 p-2 rounded-full mt-1 flex-shrink-0"><ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-amber-700"/></div>
                  <div className="min-w-0">
                      <h4 className="font-semibold text-stone-700 text-sm sm:text-base">Navigate Your Path</h4>
                      <p className="text-xs sm:text-sm text-stone-600">Click stage buttons to access the virtue desktop where you&apos;ll be prompted to reflect. Move right to continue with the same virtue, or down to work on another virtue.</p>
                  </div>
              </div>
              <div className="flex items-start gap-3 sm:gap-4">
                  <div className="bg-amber-100 p-2 rounded-full mt-1 flex-shrink-0"><ArrowDown className="h-4 w-4 sm:h-5 sm:w-5 text-amber-700"/></div>
                  <div className="min-w-0">
                      <h4 className="font-semibold text-stone-700 text-sm sm:text-base">Track Your Progress</h4>
                      <p className="text-xs sm:text-sm text-stone-600">As you complete stages, your progress will show. Work systematically through each virtue&apos;s stages to build lasting character development.</p>
                  </div>
              </div>
              <div className="flex items-start gap-3 sm:gap-4">
                  <div className="bg-amber-100 p-2 rounded-full mt-1 flex-shrink-0"><UserPlus className="h-4 w-4 sm:h-5 sm:w-5 text-amber-700"/></div>
                  <div className="min-w-0">
                      <h4 className="font-semibold text-stone-700 text-sm sm:text-base">Invite a Sponsor</h4>
                      <p className="text-xs sm:text-sm text-stone-600">When you&apos;re ready, invite a sponsor to share your journey and receive guidance.</p>
                  </div>
              </div>
          </div>
        </div>

        <div className="px-1 sm:px-8 mb-4">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="dontShow" 
              checked={dontShowAgain}
              onCheckedChange={setDontShowAgain}
            />
            <label 
              htmlFor="dontShow" 
              className="text-sm text-stone-600 cursor-pointer"
            >
              Don&apos;t show this message again
            </label>
          </div>
        </div>
        
        <DialogFooter className="flex-col sm:flex-row sm:justify-between gap-2 mt-4 sm:mt-6">
          <Link href="/welcome" className="w-full sm:w-auto">
            <Button type="button" variant="outline" className="w-full sm:w-auto text-sm">
              View Welcome Page
            </Button>
          </Link>
          <Button type="button" onClick={handleClose} className="w-full sm:w-auto text-sm">
            Go to Virtue Dashboard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
