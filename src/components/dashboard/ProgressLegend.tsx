'use client'

import { Check } from 'lucide-react'

export default function ProgressLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-600 bg-stone-100/60 backdrop-blur-sm p-2 rounded-md border border-stone-200/60">
      <strong>Legend:</strong>
      <div className="flex items-center gap-1.5">
        <div className="w-6 h-3 rounded border-2 border-amber-700 bg-gradient-to-br from-white to-gray-50"></div>
        <span>Not Started</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-6 h-3 rounded border-2 border-amber-700 bg-gradient-to-br from-amber-50 to-amber-100"></div>
        <span>In Progress</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-6 h-3 rounded border-2 border-amber-700 bg-gradient-to-br from-white to-gray-50 flex items-center justify-center">
          <Check className="w-2 h-2 text-amber-700" strokeWidth={3} />
        </div>
        <span>Completed</span>
      </div>
    </div>
  );
}
