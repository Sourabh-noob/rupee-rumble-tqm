import React, { useState, useEffect } from 'react';
import { Allocations, Question } from '../types';
import { DollarSign, Trash2, PieChart, Layers, AlertCircle, Lock } from 'lucide-react';

interface AllocationBoardProps {
  balance: number;
  question: Question;
  allocations: Allocations;
  setAllocations: (a: Allocations) => void;
  isTimerActive: boolean;
  hasSubmitted: boolean;
  onManualSubmit: () => void;
}

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

    setAllocations({ ...allocations, [option]: newValue });
  };

  const handleAllIn = (option: keyof Allocations) => {
    if (hasSubmitted) return;
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
         <button onClick={handleSplitEvenly} className="flex items-center justify-center gap-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 p-2 rounded border border-slate-200 dark:border-slate-700 transition-colors text-sm text-slate-600 dark:text-slate-300">
            <PieChart size={16} /> Spread (Even)
         </button>
         <button onClick={handleReset} className="flex items-center justify-center gap-2 bg-red-100/50 dark:bg-red-900/30 hover:bg-red-200/50 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 p-2 rounded border border-red-200 dark:border-red-900/30 transition-colors text-sm">
            <Trash2 size={16} /> Reset
         </button>
         <button onClick={() => handle5050('A', 'B')} className="flex items-center justify-center gap-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 p-2 rounded border border-slate-200 dark:border-slate-700 transition-colors text-sm text-slate-600 dark:text-slate-300">
            <Layers size={16} /> 50/50 (A & B)
         </button>
         <button onClick={() => handle5050('C', 'D')} className="flex items-center justify-center gap-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 p-2 rounded border border-slate-200 dark:border-slate-700 transition-colors text-sm text-slate-600 dark:text-slate-300">
            <Layers size={16} /> 50/50 (C & D)
         </button>
      </div>

      {/* Allocation Cards */}
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${hasSubmitted ? 'opacity-90 grayscale-[30%]' : ''}`}>
        {(['A', 'B', 'C', 'D'] as const).map((option) => (
          <div 
            key={option} 
            className={`relative p-6 rounded-2xl border-2 transition-all duration-300 ${
                allocations[option] > 0 
                ? 'bg-white dark:bg-slate-800 border-indigo-500 shadow-lg shadow-indigo-500/10' 
                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-2xl font-bold font-display text-slate-700 dark:text-white border border-slate-200 dark:border-slate-600">
                    {option}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-tight font-medium">
                    {question.options[option]}
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    ₹{allocations[option]}
                </div>
                <div className="text-xs text-slate-500 font-mono">
                    {Math.floor(allocations[option] / 100)} Notes
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
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                
                <div className="flex gap-2">
                    <button 
                        onClick={() => handleAllIn(option)}
                        disabled={isLocked}
                        className="flex-1 bg-indigo-100 dark:bg-indigo-600/20 hover:bg-indigo-200 dark:hover:bg-indigo-600/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold py-1 px-2 rounded uppercase tracking-wider transition-colors disabled:opacity-50"
                    >
                        All In
                    </button>
                    <div className="flex items-center bg-white dark:bg-slate-900 rounded px-2 border border-slate-300 dark:border-slate-700 focus-within:border-indigo-500">
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
            
            {/* Visual indicator of "money stack" */}
            {allocations[option] > 0 && (
                <div className="absolute top-2 right-2 opacity-10 pointer-events-none text-slate-900 dark:text-white">
                    <DollarSign size={64} />
                </div>
            )}
            
            {hasSubmitted && (
                 <div className="absolute inset-0 bg-slate-100/50 dark:bg-slate-900/10 z-10 rounded-2xl cursor-not-allowed"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AllocationBoard;