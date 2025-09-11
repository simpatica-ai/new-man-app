'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, Sparkles } from "lucide-react"

const oakTreeImage = "https://storage.googleapis.com/gemini-prod-us-west1-assets/20250904_045439_330030_0.jpg";

interface VirtueRecoveryPlanModalProps {
  isOpen: boolean;
}

export default function VirtueRecoveryPlanModal({ isOpen }: VirtueRecoveryPlanModalProps) {
  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md p-0 relative" showCloseButton={false}>
        <div 
          className="relative rounded-t-lg bg-cover bg-center p-6 text-white z-0"
          style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${oakTreeImage})` }}
        >
          <DialogHeader className="items-center text-center">
            <DialogTitle className="text-2xl font-light text-white">Building Your Virtue Recovery Plan</DialogTitle>
            <DialogDescription className="text-stone-200">
              Analyzing your responses to create personalized insights...
            </DialogDescription>
          </DialogHeader>
        </div>
        
        <div className="px-8 py-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Sparkles className="h-12 w-12 text-amber-600 animate-pulse" />
              <Loader2 className="h-6 w-6 text-stone-600 animate-spin absolute -bottom-1 -right-1" />
            </div>
            <div>
              <h3 className="font-semibold text-stone-700 mb-2">Processing Your Assessment</h3>
              <p className="text-sm text-stone-600">This may take up to 30 seconds as we generate your personalized virtue insights.</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}