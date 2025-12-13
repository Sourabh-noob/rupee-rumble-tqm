import React, { useState, useEffect } from 'react';
import { Allocations, Question } from '../types';
import { DollarSign, Trash2, PieChart, Layers, AlertCircle, Lock, LucideIcon, Shield, TrendingUp, AlertTriangle } from 'lucide-react';
import { playSound } from '../utils/sound';

interface AllocationBoardProps {
  balance: number;
  question: Question;
  allocations: Allocations;
  setAllocations: (a: Allocations) => void;
  isTimerActive: boolean;
  hasSubmitted: boolean;
  onManualSubmit: () => void;
}

// Helper component for buttons with tooltips
interface ActionButtonProps {
  onClick: () => void;
  icon: LucideIcon;
  label: string;
  tooltip: string;
  className: string;
}

const ActionButton: React.FC<ActionButtonProps> = ({ onClick, icon: Icon, label, tooltip, className }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="relative w-full group">
      <button 
        onClick={onClick} 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsHovered(true)}
        onBlur={() => setIsHovered(false)}
        className={`${className} w-full`}
        type="button"
      >
        <Icon size={16} /> {label}
      </button>
      
      {/* Tooltip */}
      <div 
        role="tooltip"
        className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 px-3 py-2 bg-slate-900/95 dark:bg-slate-700/95 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl z-50 text-center pointer-events-none transition-all duration-200 origin-bottom ${isHovered ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2'}`}
      >
        {tooltip}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-900/95 dark:border-t-slate-700/95"></div>
      </div>
    </div>
  );
};

const AllocationBoard: React.FC<AllocationBoardProps> = ({
  balance,
  question,
  allocations,
  setAllocations,
  isTimerActive,
  hasSubmitted,
  onManualSubmit,
}) => {
  const [allocatedTotal, setAllocatedTotal] = useState(0);

  // Recalculate total whenever individual allocations change
  useEffect(() => {
    const total = Object.values(allocations).reduce((sum: number, val: number) => sum + val, 0);
    setAllocatedTotal(total);
  }, [allocations]);

  const updateAllocation = (option: keyof Allocations, value: number) => {
    if (hasSubmitted) return;
    
    // Clamp value between 0 and balance
    let newValue = Math.max(0, Math.min(balance, value));
    
    // Ensure we don't exceed balance with other buckets
    const otherSum = Object.entries(allocations)
      .filter(([key]) => key !== option)
      .reduce((sum: number, [, val]) => sum + (val as number), 0);
      
    if (newValue + otherSum > balance) {
        newValue = balance - otherSum;
    }

    // Sound effect on max allocation (only if it wasn't already max)
    if (newValue === balance && allocations[option] !== balance && balance > 0) {
        playSound('all-in');
    }

    setAllocations({ ...allocations, [option]: newValue });
  };

  const handleAllIn = (option: keyof Allocations) => {
    if (hasSubmitted) return;
    
    // Play sound explicitly on button click
    if (balance > 0) playSound('all-in');

    setAllocations({
      A: option === 'A' ? balance : 0,
      B: option === 'B' ? balance : 0,
      C: option === 'C' ? balance : 0,
      D: option === 'D' ? balance : 0,
    });
  };

  const handleReset = () => {
    if (hasSubmitted) return;
    setAllocations({ A: 0, B: 0, C: 0, D: 0 });
  };

  const handleSplitEvenly = () => {
    if (hasSubmitted) return;
    const totalNotes = Math.floor(balance / 100);
    const baseNotes = Math.floor(totalNotes / 4);
    let remainder = totalNotes % 4;

    const newAlloc = { A: 0, B: 0, C: 0, D: 0 };
    (['A', 'B', 'C', 'D'] as const).forEach(opt => {
        let notes = baseNotes;
        if (remainder > 0) {
            notes += 1;
            remainder -= 1;
        }
        newAlloc[opt] = notes * 100;
    });
    setAllocations(newAlloc);
  };
  
  const handle5050 = (opt1: keyof Allocations, opt2: keyof Allocations) => {
      if (hasSubmitted) return;
      const totalNotes = Math.floor(balance / 100);
      const notesPerOption = Math.floor(totalNotes / 2);
      const remainder = totalNotes % 2;

      const newAlloc: Allocations = { A: 0, B: 0, C: 0, D: 0 };
      newAlloc[opt1] = (notesPerOption + remainder) * 100;
      newAlloc[opt2] = notesPerOption * 100;
      setAllocations(newAlloc);
  };

  const remaining = balance - allocatedTotal;
  const isComplete = allocatedTotal === balance;
  const isMultipleOf100 = Object.values(allocations).every(val => val % 100 === 0);
  const isValid = isComplete && isMultipleOf100;
  
  // Interaction disabled if timer stopped OR if already submitted
  const isLocked = !isTimerActive || hasSubmitted;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Styles for risk pulse */}
      <style>{`
        @keyframes border-pulse-red {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          70% { box-shadow: 0 0 20px 10px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        .animate-risk-pulse {
          animation: border-pulse-red 2s infinite;
        }
      `}</style>

      {/* Summary Header */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center sticky top-0 z-10 shadow-xl transition-colors">
        <div className="text-slate-500 dark:text-slate-400 font-mono text-sm uppercase tracking-widest">Allocation Status</div>
        
        {!isMultipleOf100 && !isLocked && (
            <div className="text-red-500 dark:text-red-400 text-sm font-bold flex items-center gap-2 animate-pulse">
                <AlertCircle size={16} /> Use denominations of ₹100
            </div>
        )}

        {hasSubmitted ? (
            <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-500 font-bold animate-pulse">
                <Lock size={16} /> BET PLACED. WAITING FOR MARKET CLOSE...
            </div>
        ) : (
            <div className="flex items-center gap-4 mt-2 md:mt-0">
                <div className={`font-mono font-bold text-xl ${remaining > 0 ? 'text-yellow-600 dark:text-yellow-400' : isValid ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                    {remaining > 0 ? `To Allocate: ₹${remaining}` : isValid ? 'Fully Allocated!' : 'Invalid Allocation'}
                </div>
                <button
                    onClick={onManualSubmit}
                    disabled={!isValid || isLocked}
                    className={`px-6 py-2 rounded-lg font-bold transition-all ${
                        isValid && !isLocked
                        ? 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20 scale-105'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                    }`}
                >
                    SUBMIT BET
                </button>
            </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className={`grid grid-cols-2 md:grid-cols-4 gap-2 ${isLocked ? 'opacity-50 pointer-events-none' : ''}`}>
         <ActionButton 
            onClick={handleSplitEvenly} 
            icon={PieChart}
            label="Spread (Even)"
            tooltip="Distribute available funds equally across all 4 options."
            className="flex items-center justify-center gap-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 p-2 rounded border border-slate-200 dark:border-slate-700 transition-colors text-sm text-slate-600 dark:text-slate-300"
         />
         <ActionButton 
            onClick={handleReset} 
            icon={Trash2}
            label="Reset"
            tooltip="Recall all bets to your balance to start over."
            className="flex items-center justify-center gap-2 bg-red-100/50 dark:bg-red-900/30 hover:bg-red-200/50 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 p-2 rounded border border-red-200 dark:border-red-900/30 transition-colors text-sm"
         />
         <ActionButton 
            onClick={() => handle5050('A', 'B')} 
            icon={Layers}
            label="50/50 (A & B)"
            tooltip="Split available funds equally between A and B only."
            className="flex items-center justify-center gap-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 p-2 rounded border border-slate-200 dark:border-slate-700 transition-colors text-sm text-slate-600 dark:text-slate-300"
         />
         <ActionButton 
            onClick={() => handle5050('C', 'D')} 
            icon={Layers}
            label="50/50 (C & D)"
            tooltip="Split available funds equally between C and D only."
            className="flex items-center justify-center gap-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 p-2 rounded border border-slate-200 dark:border-slate-700 transition-colors text-sm text-slate-600 dark:text-slate-300"
         />
      </div>

      {/* Allocation Cards */}
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${hasSubmitted ? 'opacity-90 grayscale-[30%]' : ''}`}>
        {(['A', 'B', 'C', 'D'] as const).map((option) => {
            const amount = allocations[option];
            const percentage = balance > 0 ? (amount / balance) * 100 : 0;
            
            // Risk Styling Logic
            let cardStyle = 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700';
            let accentColor = 'text-indigo-600 dark:text-indigo-400';
            let sliderColor = 'accent-indigo-500';
            let amountColor = 'text-indigo-600 dark:text-indigo-400';
            let Badge = null;

            if (amount > 0) {
                if (percentage === 100) {
                    // All In - Extreme Risk
                    cardStyle = 'bg-red-50 dark:bg-red-900/20 border-red-500 border-2 animate-risk-pulse z-10';
                    accentColor = 'text-red-600 dark:text-red-400';
                    sliderColor = 'accent-red-600';
                    amountColor = 'text-red-600 dark:text-red-400';
                    Badge = (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg shadow-red-500/50 z-20 whitespace-nowrap animate-bounce">
                            <AlertTriangle size={12} fill="currentColor" /> HIGH RISK / HIGH REWARD
                        </div>
                    );
                } else if (percentage > 50) {
                    // Aggressive Risk
                    cardStyle = 'bg-orange-50 dark:bg-orange-900/10 border-orange-400 border-2 shadow-lg shadow-orange-500/10';
                    accentColor = 'text-orange-600 dark:text-orange-400';
                    sliderColor = 'accent-orange-500';
                    amountColor = 'text-orange-600 dark:text-orange-400';
                    Badge = (
                        <div className="absolute top-2 right-12 text-orange-600 dark:text-orange-400 text-[10px] font-bold px-2 py-0.5 rounded border border-orange-200 dark:border-orange-800 bg-orange-100/50 dark:bg-orange-900/50 flex items-center gap-1">
                            <TrendingUp size={12} /> AGGRESSIVE
                        </div>
                    );
                } else if (percentage < 25) {
                    // Conservative Risk
                    cardStyle = 'bg-blue-50 dark:bg-blue-900/10 border-blue-400 border-2 shadow-md shadow-blue-500/10';
                    accentColor = 'text-blue-600 dark:text-blue-400';
                    sliderColor = 'accent-blue-500';
                    amountColor = 'text-blue-600 dark:text-blue-400';
                    Badge = (
                        <div className="absolute top-2 right-12 text-blue-600 dark:text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800 bg-blue-100/50 dark:bg-blue-900/50 flex items-center gap-1">
                            <Shield size={12} /> CONSERVATIVE
                        </div>
                    );
                } else {
                    // Moderate (25-50%)
                    cardStyle = 'bg-white dark:bg-slate-800 border-indigo-500 border-2 shadow-lg shadow-indigo-500/10';
                    accentColor = 'text-indigo-600 dark:text-indigo-400';
                    sliderColor = 'accent-indigo-500';
                }
            }

            return (
                <div 
                    key={option} 
                    className={`relative p-6 rounded-2xl border-2 transition-all duration-300 ${cardStyle}`}
                >
                    {Badge}

                    <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold font-display border transition-colors ${amount > 0 ? 'bg-white dark:bg-slate-900 ' + accentColor + ' border-current' : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-white border-slate-200 dark:border-slate-600'}`}>
                            {option}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-tight font-medium">
                            {question.options[option]}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className={`font-mono text-2xl font-bold ${amountColor}`}>
                            ₹{allocations[option]}
                        </div>
                        <div className="text-xs text-slate-500 font-mono">
                            {percentage.toFixed(0)}%
                        </div>
                    </div>
                    </div>

                    <div className={`space-y-4 ${isLocked ? 'pointer-events-none' : ''}`}>
                        <input
                            type="range"
                            min="0"
                            max={balance}
                            step="100"
                            value={allocations[option]}
                            disabled={isLocked}
                            onChange={(e) => updateAllocation(option, parseInt(e.target.value))}
                            className={`w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer ${sliderColor}`}
                        />
                        
                        <div className="flex gap-2">
                            <button 
                                onClick={() => handleAllIn(option)}
                                disabled={isLocked}
                                className={`flex-1 text-xs font-bold py-1 px-2 rounded uppercase tracking-wider transition-colors disabled:opacity-50 ${
                                    amount > 0 && percentage === 100 
                                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' 
                                    : 'bg-indigo-100 dark:bg-indigo-600/20 hover:bg-indigo-200 dark:hover:bg-indigo-600/40 text-indigo-700 dark:text-indigo-300'
                                }`}
                            >
                                All In
                            </button>
                            <div className={`flex items-center bg-white dark:bg-slate-900 rounded px-2 border focus-within:ring-1 focus-within:ring-indigo-500 ${amount > 0 ? 'border-slate-300 dark:border-slate-700' : 'border-slate-300 dark:border-slate-700'}`}>
                                <DollarSign size={14} className="text-slate-400 dark:text-slate-500" />
                                <input
                                    type="number"
                                    step="100"
                                    min="0"
                                    max={balance}
                                    value={allocations[option]}
                                    disabled={isLocked}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        if (!isNaN(val)) {
                                            updateAllocation(option, val);
                                        }
                                    }}
                                    className="w-20 bg-transparent text-right font-mono text-sm focus:outline-none p-1 text-slate-900 dark:text-white disabled:text-slate-400"
                                />
                            </div>
                        </div>
                    </div>
                    
                    {/* Visual indicator of "money stack" - optional opacity based on amount */}
                    {allocations[option] > 0 && (
                        <div className={`absolute top-2 right-2 opacity-[0.05] pointer-events-none ${accentColor}`}>
                            <DollarSign size={64} />
                        </div>
                    )}
                    
                    {hasSubmitted && (
                        <div className="absolute inset-0 bg-slate-100/50 dark:bg-slate-900/10 z-10 rounded-2xl cursor-not-allowed"></div>
                    )}
                </div>
            )
        })}
      </div>
    </div>
  );
};

export default AllocationBoard;