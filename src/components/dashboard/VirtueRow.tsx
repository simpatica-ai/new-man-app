'use client'

import Link from 'next/link'
import { Button } from '../ui/button'
import { Virtue, StageProgressStatus } from '@/lib/constants'
import VirtueProgressBar from '../VirtueProgressBar'

interface VirtueRowProps {
  virtue: Virtue;
  assessmentTaken: boolean;
  getStatusClasses: (virtueId: number, stage: number) => string;
  buttonStates?: {[key: string]: boolean};
  setButtonStates?: (fn: (prev: {[key: string]: boolean}) => {[key: string]: boolean}) => void;
}

export default function VirtueRow({ virtue, assessmentTaken, getStatusClasses, buttonStates, setButtonStates }: VirtueRowProps) {
  // Determine completion status for this virtue
  const dismantlingComplete = getStatusClasses(virtue.id, 1).includes('bg-green-100');
  const buildingComplete = getStatusClasses(virtue.id, 2).includes('bg-green-100');
  const practicingComplete = getStatusClasses(virtue.id, 3).includes('bg-green-100');
  
  // Debug logging for virtue 5
  if (virtue.id === 5) {
    console.log('VirtueRow Status Check:', {
      virtue: virtue.name,
      stage1Classes: getStatusClasses(virtue.id, 1),
      stage2Classes: getStatusClasses(virtue.id, 2),
      stage3Classes: getStatusClasses(virtue.id, 3),
      dismantlingComplete,
      buildingComplete,
      practicingComplete
    });
  }

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
        
        {/* Individual Virtue Progress Bar */}
        <VirtueProgressBar 
          hasCompletedAssessment={assessmentTaken}
          completedDismantlingCount={dismantlingComplete ? 1 : 0}
          completedBuildingCount={buildingComplete ? 1 : 0}
          completedPracticingCount={practicingComplete ? 1 : 0}
          totalVirtues={1}
          showClickableButtons={true}
          virtueId={virtue.id}
          getStatusClasses={getStatusClasses}
          buttonStates={buttonStates}
          setButtonStates={setButtonStates}
          className="py-2"
        />
      </div>
    </li>
  );
}
