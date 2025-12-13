import React from 'react';
import { Allocations, Team } from '../types';
import { DollarSign, Lock } from 'lucide-react';

interface TeamPanelProps {
  team: Team;
  allocations: Allocations;
  setAllocations: (allocs: Allocations) => void;
  isLocked: boolean;
  showResult?: boolean;
  correctAnswer?: 'A' | 'B' | 'C' | 'D';
}

const TeamPanel: React.FC<TeamPanelProps> = ({ 
  team, 
  allocations, 
  setAllocations, 
  isLocked,
  showResult,
  correctAnswer
}) => {
  const allocatedTotal = Object.values(allocations).reduce((a, b) => a + b, 0);
  const remaining = team.balance - allocatedTotal;
  const isValid = allocatedTotal === team.balance;

  const updateAllocation = (option: keyof Allocations, value: number) => {
    if (isLocked) return;
    let newValue = Math.max(0, Math.min(team.balance, value));
    const otherSum = Object.entries(allocations)
      .filter(([key]) => key !== option)
      .reduce((sum, [, val]) => sum + val, 0);
      
    if (newValue + otherSum > team.balance) {
        newValue = team.balance - otherSum;
    }
    setAllocations({ ...allocations, [option]: newValue });
  };

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl border-2 overflow-hidden flex flex-col shadow-sm transition-all ${isLocked ? 'border-slate-300 dark:border-slate-600' : 'border-indigo-500 shadow-indigo-500/20'}`}>
        {/* Header */}
        <div className="bg-slate-100 dark:bg-slate-900 p-2 px-3 flex justify-between items-center border-b border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-sm truncate text-slate-800 dark:text-slate-200 w-2/3" title={team.name}>{team.name}</h3>
            <div className={`font-mono font-bold text-sm ${team.balance === 0 ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}`}>
                ₹{team.balance}
            </div>
        </div>

        {/* Inputs */}
        <div className="p-2 space-y-2 flex-1 relative">
            {(['A', 'B', 'C', 'D'] as const).map(opt => {
                const isWinner = showResult && correctAnswer === opt;
                const isLoser = showResult && correctAnswer !== opt && allocations[opt] > 0;
                
                let bgClass = "bg-slate-50 dark:bg-slate-900/50";
                if (isWinner) bgClass = "bg-green-100 dark:bg-green-900/40 border-green-500";
                if (isLoser) bgClass = "bg-red-50 dark:bg-red-900/20 border-red-500 opacity-60";

                return (
                    <div key={opt} className={`flex items-center gap-2 rounded border border-transparent p-1 transition-colors ${bgClass}`}>
                        <div className={`w-6 h-6 flex items-center justify-center rounded font-bold text-xs ${isWinner ? 'bg-green-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
                            {opt}
                        </div>
                        <input
                            type="range"
                            min="0"
                            max={team.balance}
                            step="100"
                            value={allocations[opt]}
                            disabled={isLocked}
                            onChange={(e) => updateAllocation(opt, parseInt(e.target.value))}
                            className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 disabled:opacity-50"
                        />
                        <div className="w-10 text-right font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                            {allocations[opt]}
                        </div>
                    </div>
                );
            })}
            
            {/* Locked Overlay */}
            {isLocked && !showResult && (
                <div className="absolute inset-0 bg-slate-50/10 dark:bg-slate-900/10 backdrop-blur-[1px] flex items-center justify-center z-10">
                    <Lock className="text-slate-400/50 w-12 h-12" />
                </div>
            )}
        </div>
        
        {/* Footer */}
        <div className={`text-[10px] text-center p-1 font-mono font-bold uppercase transition-colors ${isValid ? 'bg-slate-100 dark:bg-slate-900 text-green-600' : 'bg-red-100 dark:bg-red-900/30 text-red-600'}`}>
            {remaining === 0 ? 'READY' : `Unallocated: ₹${remaining}`}
        </div>
    </div>
  );
};

export default TeamPanel;
