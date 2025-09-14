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
    <li className="flex flex-col md:flex-row items-start md:items-center gap-4 p-4 border border-stone-200/60 rounded-lg bg-white/80 backdrop-blur-sm shadow-gentle transition-mindful hover:shadow-lg">
      {assessmentTaken && (
        <div className="flex-shrink-0 flex items-center gap-4 w-full md:w-auto">
          <div className="relative w-16 h-16 flex items-center justify-center">
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
            <span className="absolute text-xl font-semibold text-stone-700">
              {(virtue.virtue_score || 0).toFixed(1)}
            </span>
          </div>
          <div className="md:hidden flex-grow">
            <h3 className="font-semibold text-lg text-stone-800">{virtue.name}</h3>
          </div>
        </div>
      )}
      <div className="flex-grow w-full">
        <h3 className="hidden md:block font-semibold text-lg text-stone-800">{virtue.name}</h3>
        <p className="text-stone-600 text-sm mb-3">
          {virtue.short_description || virtue.description}
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href={{ pathname: `/virtue/${virtue.id}`, query: { stage: 1 } }}>
            <Button size="sm" variant="outline" className={getStatusClasses(virtue.id, 1)}>
              Stage 1: Dismantling
            </Button>
          </Link>
          <Link href={{ pathname: `/virtue/${virtue.id}`, query: { stage: 2 } }}>
            <Button size="sm" variant="outline" className={getStatusClasses(virtue.id, 2)}>
              Stage 2: Building
            </Button>
          </Link>
          <Link href={{ pathname: `/virtue/${virtue.id}`, query: { stage: 3 } }}>
            <Button size="sm" variant="outline" className={getStatusClasses(virtue.id, 3)}>
              Stage 3: Maintaining
            </Button>
          </Link>
        </div>
      </div>
    </li>
  );
}
