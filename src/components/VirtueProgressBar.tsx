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
}

export default function VirtueProgressBar({ 
  hasCompletedAssessment, 
  completedDismantlingCount = 0,
  completedBuildingCount = 0,
  completedPracticingCount = 0,
  totalVirtues = 12,
  className = "",
  showClickableButtons = false,
  virtueId
}: VirtueProgressBarProps) {
  
  const router = useRouter();
  
  const phases = [
    { 
      name: 'Discovering', 
      color: '#8B4513',
      completed: hasCompletedAssessment,
      route: virtueId ? `/virtue/${virtueId}` : '/assessment'
    },
    { 
      name: 'Dismantling', 
      color: '#A0522D',
      completed: completedDismantlingCount >= totalVirtues,
      route: virtueId ? `/virtue/${virtueId}?stage=1` : '/'
    },
    { 
      name: 'Building', 
      color: '#6B8E23',
      completed: completedBuildingCount >= totalVirtues,
      route: virtueId ? `/virtue/${virtueId}?stage=2` : '/'
    },
    { 
      name: 'Practicing', 
      color: '#556B2F',
      completed: completedPracticingCount >= totalVirtues,
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
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold text-white transition-all duration-300 ${
                  showClickableButtons && hasCompletedAssessment ? 'cursor-pointer hover:scale-110' : 'cursor-default'
                }`}
                style={{
                  backgroundColor: phase.completed ? phase.color : 'transparent',
                  borderColor: phase.color,
                  color: phase.completed ? 'white' : phase.color
                }}
              >
                {phase.completed ? '✓' : index + 1}
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
