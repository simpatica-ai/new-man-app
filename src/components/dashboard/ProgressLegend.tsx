'use client'

export default function ProgressLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-600 bg-stone-100/60 backdrop-blur-sm p-2 rounded-md border border-stone-200/60">
      <strong>Legend:</strong>
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-full bg-stone-200 border border-stone-300"></div>
        <span>Not Started</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-full bg-amber-200 border border-amber-300"></div>
        <span>In Progress</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-full bg-green-200 border border-green-300"></div>
        <span>Completed</span>
      </div>
    </div>
  );
}
