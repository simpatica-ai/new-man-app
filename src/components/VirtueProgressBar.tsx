'use client'

import { useRouter } from 'next/navigation'

interface VirtueProgressBarProps {
  hasCompletedAssessment: boolean;
  completedDismantlingCount?: number;
  completedBuildingCount?: number;
  completedPracticingCount?: number;
  totalVirtues?: number;
  className?: string;
  showClickableButtons?: boolean;
  virtueId?: number; // For individual virtue navigation
  getStatusClasses?: (virtueId: number, stage: number) => string; // Add status function
  assessmentInProgress?: boolean; // New prop for assessment progress
  buttonStates?: {[key: string]: boolean}; // Button state tracking
  setButtonStates?: (fn: (prev: {[key: string]: boolean}) => {[key: string]: boolean}) => void; // Button state setter
}

export default function VirtueProgressBar({ 
  hasCompletedAssessment, 
  completedDismantlingCount = 0,
  completedBuildingCount = 0,
  completedPracticingCount = 0,
  totalVirtues = 12,
  className = "",
  showClickableButtons = false,
  virtueId,
  getStatusClasses,
  assessmentInProgress = false,
  buttonStates,
  setButtonStates
}: VirtueProgressBarProps) {
  
  const router = useRouter();
  
  // Helper function to get stage status
  const getStageStatus = (stage: number) => {
    if (!virtueId || !getStatusClasses) return 'not_started';
    const statusClasses = getStatusClasses(virtueId, stage);
    
    // Extract status from CSS classes
    if (statusClasses.includes('bg-green-100')) return 'completed';
    if (statusClasses.includes('bg-amber-100')) return 'in_progress';
    return 'not_started';
  };
  
  const phases = [
    { 
      name: 'Discovering', 
      color: '#8B4513',
      status: hasCompletedAssessment ? 'completed' : 
              assessmentInProgress ? 'in_progress' : 'not_started',
      route: virtueId ? `/virtue/${virtueId}` : '/assessment'
    },
    { 
      name: 'Dismantling', 
      color: '#A0522D',
      status: virtueId ? getStageStatus(1) : (completedDismantlingCount >= totalVirtues ? 'completed' : 'not_started'),
      route: virtueId ? `/virtue/${virtueId}?stage=1` : '/'
    },
    { 
      name: 'Building', 
      color: '#6B8E23',
      status: virtueId ? getStageStatus(2) : (completedBuildingCount >= totalVirtues ? 'completed' : 'not_started'),
      route: virtueId ? `/virtue/${virtueId}?stage=2` : '/'
    },
    { 
      name: 'Practicing', 
      color: '#556B2F',
      status: virtueId ? getStageStatus(3) : (completedPracticingCount >= totalVirtues ? 'completed' : 'not_started'),
      route: virtueId ? `/virtue/${virtueId}?stage=3` : '/'
    }
  ];

  // Clean implementation - debug logging removed

  const handlePhaseClick = (phase: typeof phases[0]) => {
    if (showClickableButtons) {
      const buttonKey = `phase-${virtueId}-${phase.name}`;
      
      // Phase click logging removed
      
      // Prevent double-clicks
      if (buttonStates?.[buttonKey]) return;
      
      // Allow Discovery phase to be clicked even without assessment
      if (phase.name === 'Discovering' || hasCompletedAssessment) {
        // Set button state to prevent double-clicks
        if (setButtonStates) {
          setButtonStates(prev => ({...prev, [buttonKey]: true}));
          
          // Reset button state after navigation
          setTimeout(() => {
            setButtonStates(prev => ({...prev, [buttonKey]: false}));
          }, 1000);
        }
        

        router.push(phase.route);
      }
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between">
        {phases.map((phase, index) => (
          <div key={`${phase.name}-${phase.status}-${virtueId}`} className="flex items-center flex-1">
            {/* Phase Circle */}
            <div className="flex flex-col items-center">
              <button
                onClick={() => handlePhaseClick(phase)}
                disabled={!showClickableButtons || (!hasCompletedAssessment && phase.name !== 'Discovering') || buttonStates?.[`phase-${virtueId}-${phase.name}`]}
                className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-xs font-bold transition-all duration-300 shadow-sm ${
                  showClickableButtons && (hasCompletedAssessment || phase.name === 'Discovering') && !buttonStates?.[`phase-${virtueId}-${phase.name}`]
                    ? 'cursor-pointer hover:scale-105 hover:shadow-md active:scale-95 transform' 
                    : 'cursor-default opacity-60'
                } ${
                  phase.status === 'completed' 
                    ? 'bg-gradient-to-br from-white to-gray-50' 
                    : phase.status === 'in_progress' 
                    ? 'bg-gradient-to-br from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-200' 
                    : 'bg-gradient-to-br from-white to-gray-50 hover:from-gray-50 hover:to-gray-100'
                } ${buttonStates?.[`phase-${virtueId}-${phase.name}`] ? 'animate-pulse' : ''}`}
                style={{
                  borderColor: phase.color,
                  color: phase.status === 'completed' ? phase.color : 
                         phase.status === 'in_progress' ? '#92400E' : phase.color
                }}
              >
                {phase.status === 'completed' ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <span className="text-xs font-semibold">{index + 1}</span>
                )}
              </button>
              <span 
                className="text-xs font-medium mt-1 text-center"
                style={{ color: phase.color }}
              >
                {phase.name}
              </span>
            </div>
            
            {/* Connecting Line */}
            {index < phases.length - 1 && (
              <div className="flex-1 h-0.5 mx-2 bg-stone-300 relative">
                <div 
                  className="h-full transition-all duration-500"
                  style={{
                    backgroundColor: phase.status === 'completed' ? phase.color : 'transparent',
                    width: phase.status === 'completed' ? '100%' : '0%'
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
