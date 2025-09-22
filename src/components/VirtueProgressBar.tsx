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
  assessmentInProgress = false
}: VirtueProgressBarProps) {
  
  const router = useRouter();
  
  // Helper function to get stage status
  const getStageStatus = (stage: number) => {
    if (!virtueId || !getStatusClasses) return 'not_started';
    const statusClasses = getStatusClasses(virtueId, stage);
    if (statusClasses.includes('bg-green')) return 'completed';
    if (statusClasses.includes('bg-amber')) return 'in_progress';
    return 'not_started';
  };
  
  const phases = [
    { 
      name: 'Discovering', 
      color: '#8B4513',
      completed: hasCompletedAssessment,
      status: hasCompletedAssessment ? 'completed' : 
              assessmentInProgress ? 'in_progress' : 'not_started',
      route: virtueId ? `/virtue/${virtueId}` : '/assessment'
    },
    { 
      name: 'Dismantling', 
      color: '#A0522D',
      completed: completedDismantlingCount >= totalVirtues,
      status: virtueId ? getStageStatus(1) : (completedDismantlingCount >= totalVirtues ? 'completed' : 'not_started'),
      route: virtueId ? `/virtue/${virtueId}?stage=1` : '/'
    },
    { 
      name: 'Building', 
      color: '#6B8E23',
      completed: completedBuildingCount >= totalVirtues,
      status: virtueId ? getStageStatus(2) : (completedBuildingCount >= totalVirtues ? 'completed' : 'not_started'),
      route: virtueId ? `/virtue/${virtueId}?stage=2` : '/'
    },
    { 
      name: 'Practicing', 
      color: '#556B2F',
      completed: completedPracticingCount >= totalVirtues,
      status: virtueId ? getStageStatus(3) : (completedPracticingCount >= totalVirtues ? 'completed' : 'not_started'),
      route: virtueId ? `/virtue/${virtueId}?stage=3` : '/'
    }
  ];

  const handlePhaseClick = (phase: typeof phases[0]) => {
    if (showClickableButtons && hasCompletedAssessment) {
      router.push(phase.route);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between">
        {phases.map((phase, index) => (
          <div key={phase.name} className="flex items-center flex-1">
            {/* Phase Circle */}
            <div className="flex flex-col items-center">
              <button
                onClick={() => handlePhaseClick(phase)}
                disabled={!showClickableButtons || !hasCompletedAssessment}
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  showClickableButtons && hasCompletedAssessment ? 'cursor-pointer hover:scale-110' : 'cursor-default'
                }`}
                style={{
                  backgroundColor: phase.status === 'completed' ? phase.color : 
                                 phase.status === 'in_progress' ? '#FCD34D' : 'transparent', // Yellow for in-progress
                  borderColor: phase.color,
                  color: phase.status === 'completed' ? 'white' : 
                         phase.status === 'in_progress' ? '#92400E' : phase.color // Dark yellow text for in-progress
                }}
              >
                {phase.status === 'completed' ? '✓' : index + 1}
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
                    backgroundColor: phase.completed ? phase.color : 'transparent',
                    width: phase.completed ? '100%' : '0%'
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
