// src/components/WelcomeModal.tsx
'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Rocket, BookText, UserPlus, Milestone, Award } from "lucide-react"

// ## FIX: New, custom-generated background image URL ##
const oakTreeImage = "https://storage.googleapis.com/gemini-prod-us-west1-assets/20250904_045439_330030_0.jpg";

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <DialogTitle className="text-3xl font-light text-stone-800 text-center">Welcome to A New Man</DialogTitle>
            <DialogDescription className="text-stone-600 text-center mt-2">
              Your private workspace for a journey of self-reflection and growth.
            </DialogDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-stone-400 hover:text-stone-600">
            ✕
          </Button>
        </div>
        
        <div className="px-8 py-6">
          <h3 className="mb-4 text-center font-semibold text-stone-700">Here&apos;s how your journey will unfold:</h3>
          <div className="grid gap-4">
              <div className="flex items-start gap-4">
                  <div className="bg-amber-100 p-2 rounded-full mt-1"><Rocket className="h-5 w-5 text-amber-700"/></div>
                  <div>
                      <h4 className="font-semibold text-stone-700">1. Take the Assessment</h4>
                      <p className="text-sm text-stone-600">Start with a short Virtue Assessment to discover your personalized path.</p>
                  </div>
              </div>
              <div className="flex items-start gap-4">
                  <div className="bg-amber-100 p-2 rounded-full mt-1"><Milestone className="h-5 w-5 text-amber-700"/></div>
                  <div>
                      <h4 className="font-semibold text-stone-700">2. Work the Stages</h4>
                      <p className="text-sm text-stone-600">For each virtue, you&apos;ll move through stages of dismantling, building, and maintaining healthy habits.</p>
                  </div>
              </div>
              <div className="flex items-start gap-4">
                  <div className="bg-amber-100 p-2 rounded-full mt-1"><BookText className="h-5 w-5 text-amber-700"/></div>
                  <div>
                      <h4 className="font-semibold text-stone-700">3. Maintain a Journal</h4>
                      <p className="text-sm text-stone-600">Use your private journal to reflect on your progress and insights.</p>
                  </div>
              </div>
              <div className="flex items-start gap-4">
                  <div className="bg-amber-100 p-2 rounded-full mt-1"><UserPlus className="h-5 w-5 text-amber-700"/></div>
                  <div>
                      <h4 className="font-semibold text-stone-700">4. Invite a Sponsor</h4>
                      <p className="text-sm text-stone-600">When you&apos;re ready, invite a sponsor to share your journey and receive guidance.</p>
                  </div>
              </div>
              <div className="flex items-start gap-4">
                  <div className="bg-amber-100 p-2 rounded-full mt-1"><Award className="h-5 w-5 text-amber-700"/></div>
                  <div>
                      <h4 className="font-semibold text-stone-700">5. Track Your Progress</h4>
                      <p className="text-sm text-stone-600">Retake the assessment at any time to visualize your growth. Eventually, you will be able to print a &quot;Virtue Journey Book&quot;.</p>
                  </div>
              </div>
          </div>
        </div>
        
        <DialogFooter className="sm:justify-between gap-2 mt-6">
          <Button type="button" variant="ghost" onClick={onClose}>
            I&apos;ll Explore on My Own
          </Button>
          <Link href="/assessment">
            <Button type="submit">Start My Assessment</Button>
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}