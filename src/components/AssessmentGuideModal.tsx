'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Heart, FileText, RotateCcw, Download } from "lucide-react"



interface AssessmentGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AssessmentGuideModal({ isOpen, onClose }: AssessmentGuideModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <DialogTitle className="text-3xl font-light text-stone-800 text-center">Character Defect Assessment</DialogTitle>
            <DialogDescription className="text-stone-600 text-center mt-2">
              Your journey begins with brutal honesty and self-reflection.
            </DialogDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-stone-400 hover:text-stone-600">
            ✕
          </Button>
        </div>
        
        <div className="px-6 py-4">
          <h3 className="mb-4 text-center font-semibold text-stone-700">What to expect in your assessment:</h3>
          <div className="grid gap-4">
            <div className="flex items-start gap-4">
              <div className="bg-amber-100 p-2 rounded-full mt-1"><Heart className="h-5 w-5 text-amber-700"/></div>
              <div>
                <h4 className="font-semibold text-stone-700">Honest Self-Evaluation</h4>
                <p className="text-sm text-stone-600">You&apos;ll evaluate 46 character defects, rating their frequency and impact with complete honesty.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-amber-100 p-2 rounded-full mt-1"><FileText className="h-5 w-5 text-amber-700"/></div>
              <div>
                <h4 className="font-semibold text-stone-700">Personalized Recovery Path</h4>
                <p className="text-sm text-stone-600">Your responses generate a customized virtue recovery journey with insights for each virtue.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-amber-100 p-2 rounded-full mt-1"><Download className="h-5 w-5 text-amber-700"/></div>
              <div>
                <h4 className="font-semibold text-stone-700">Save Your Plan</h4>
                <p className="text-sm text-stone-600">Export your virtue recovery plan as a PDF to reference throughout your journey.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-amber-100 p-2 rounded-full mt-1"><RotateCcw className="h-5 w-5 text-amber-700"/></div>
              <div>
                <h4 className="font-semibold text-stone-700">Track Your Progress</h4>
                <p className="text-sm text-stone-600">Retake the assessment over time to see your growth and adjust your recovery path.</p>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter className="sm:justify-center gap-2 mt-6">
          <Button type="button" onClick={onClose} className="bg-gradient-to-r from-amber-600 to-stone-600 hover:from-amber-700 hover:to-stone-700 text-white">
            Begin Assessment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}