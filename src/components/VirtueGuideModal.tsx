'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Edit3, Save, Lightbulb, BookOpen, Users, Sparkles } from "lucide-react"



interface VirtueGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  hasConnection: boolean;
}

export default function VirtueGuideModal({ isOpen, onClose, hasConnection }: VirtueGuideModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl max-w-[90vw] max-h-[90vh] overflow-y-auto mx-2">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <DialogTitle className="text-xl sm:text-2xl font-light text-stone-800 text-center">Virtue Workspace Guide</DialogTitle>
            <DialogDescription className="text-stone-600 text-center mt-2 text-sm">
              Your private space for reflection and growth through each virtue stage.
            </DialogDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-stone-400 hover:text-stone-600">
            ✕
          </Button>
        </div>
        
        <div className="px-2 sm:px-6 py-2 sm:py-4">
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-4 w-4 text-blue-600" />
              <p className="text-sm font-medium text-blue-800">Start with the Discovery Tab</p>
            </div>
            <p className="text-xs text-blue-700">Begin each virtue with the &quot;Discovery&quot; tab to understand the virtue&apos;s meaning and development approach before diving into the reflection stages.</p>
          </div>
          
          <h3 className="mb-4 text-center font-semibold text-stone-700">How to use your Virtue Workspace:</h3>
          <div className="grid gap-4">
            <div className="flex items-start gap-4">
              <div className="bg-amber-100 p-2 rounded-full mt-1"><BookOpen className="h-5 w-5 text-amber-700"/></div>
              <div>
                <h4 className="font-semibold text-stone-700">Discovery Tab</h4>
                <p className="text-sm text-stone-600">Start here to read comprehensive guidance about this virtue, its meaning, and how to develop it effectively.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-amber-100 p-2 rounded-full mt-1"><Edit3 className="h-5 w-5 text-amber-700"/></div>
              <div>
                <h4 className="font-semibold text-stone-700">Separate Writing Panels</h4>
                <p className="text-sm text-stone-600">Each stage (Dismantling, Building, Maintaining) has its own dedicated reflection space for focused work.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-amber-100 p-2 rounded-full mt-1"><Save className="h-5 w-5 text-amber-700"/></div>
              <div>
                <h4 className="font-semibold text-stone-700">Save & Complete Progress</h4>
                <p className="text-sm text-stone-600">Save your work as drafts or mark stages complete when you&apos;re ready to move forward.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-amber-100 p-2 rounded-full mt-1"><Lightbulb className="h-5 w-5 text-amber-700"/></div>
              <div>
                <h4 className="font-semibold text-stone-700">AI-Generated Prompts</h4>
                <p className="text-sm text-stone-600">Personalized writing prompts are generated based on your progress within and across all stages.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-amber-100 p-2 rounded-full mt-1"><BookOpen className="h-5 w-5 text-amber-700"/></div>
              <div>
                <h4 className="font-semibold text-stone-700">Universal Journal</h4>
                <p className="text-sm text-stone-600">Your journal is shared across all virtues - capture thoughts here, then move them into specific virtue reflections.</p>
              </div>
            </div>
            {hasConnection && (
              <div className="flex items-start gap-4">
                <div className="bg-amber-100 p-2 rounded-full mt-1"><Users className="h-5 w-5 text-amber-700"/></div>
                <div>
                  <h4 className="font-semibold text-stone-700">Sponsor Collaboration</h4>
                  <p className="text-sm text-stone-600">Share your progress with your sponsor through the chat feature and receive guidance on your journey.</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter className="sm:justify-center gap-2 mt-6">
          <Button type="button" onClick={onClose} className="bg-gradient-to-r from-amber-600 to-stone-600 hover:from-amber-700 hover:to-stone-700 text-white">
            Start My Reflection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}