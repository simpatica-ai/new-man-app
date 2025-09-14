'use client'

import Link from 'next/link'
import { Button } from '../ui/button'
import { Virtue, StageProgressStatus } from '@/lib/constants'

interface VirtueRowProps {
  virtue: Virtue;
  assessmentTaken: boolean;
  getStatusClasses: (virtueId: number, stage: number) => string;
}

export default function VirtueRow({ virtue, assessmentTaken, getStatusClasses }: VirtueRowProps) {
  return (
    <li className="flex flex-col gap-3 md:gap-4 p-3 md:p-4 border border-stone-200/60 rounded-lg bg-white/80 backdrop-blur-sm shadow-gentle transition-mindful hover:shadow-lg">
      {assessmentTaken && (
        <div className="flex items-center gap-3 md:gap-4">
          <div className="relative w-12 h-12 md:w-16 md:h-16 flex items-center justify-center flex-shrink-0">
            <svg className="w-full h-full" viewBox="0 0 36 36">
              <path 
                className="text-stone-200" 
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
              />
              <path 
                className="text-amber-600" 
                strokeDasharray={`${(virtue.virtue_score || 0) * 10}, 100`} 
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
              />
            </svg>
            <span className="absolute text-lg md:text-xl font-semibold text-stone-700">
              {(virtue.virtue_score || 0).toFixed(1)}
            </span>
          </div>
          <div className="flex-grow min-w-0">
            <h3 className="font-semibold text-base md:text-lg text-stone-800 truncate">{virtue.name}</h3>
          </div>
        </div>
      )}
      
      <div className="flex-grow">
        {!assessmentTaken && (
          <h3 className="font-semibold text-base md:text-lg text-stone-800 mb-2">{virtue.name}</h3>
        )}
        <p className="text-stone-600 text-sm mb-3 leading-relaxed">
          {virtue.short_description || virtue.description}
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <Link href={{ pathname: `/virtue/${virtue.id}`, query: { stage: 1 } }} className="flex-1">
            <Button size="sm" variant="outline" className={`w-full text-xs md:text-sm ${getStatusClasses(virtue.id, 1)}`}>
              Stage 1: Dismantling
            </Button>
          </Link>
          <Link href={{ pathname: `/virtue/${virtue.id}`, query: { stage: 2 } }} className="flex-1">
            <Button size="sm" variant="outline" className={`w-full text-xs md:text-sm ${getStatusClasses(virtue.id, 2)}`}>
              Stage 2: Building
            </Button>
          </Link>
          <Link href={{ pathname: `/virtue/${virtue.id}`, query: { stage: 3 } }} className="flex-1">
            <Button size="sm" variant="outline" className={`w-full text-xs md:text-sm ${getStatusClasses(virtue.id, 3)}`}>
              Stage 3: Maintaining
            </Button>
          </Link>
        </div>
      </div>
    </li>
  );
}
