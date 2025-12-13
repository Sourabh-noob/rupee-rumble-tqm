import React, { useState } from 'react';
import { Team, Question, Allocations } from '../types';
import TeamPanel from './TeamPanel';
import Timer from './Timer';
import { Play, Pause, Eye, SkipForward, ArrowRight } from 'lucide-react';

interface GameGridProps {
  teams: Team[];
  question: Question;
  roundNumber: number;
  questionNumber: number;
  timerDuration: number;
  isTimerActive: boolean;
  onTimerStart: () => void;
  onTimerStop: () => void;
  onTimeUp: () => void;
  onUpdateTeamAllocations: (teamId: string, allocs: Allocations) => void;
  teamAllocations: Record<string, Allocations>;
  // Admin controls passed down for the 'facilitator' view
  onNextQuestion: () => void;
  onRevealAnswer: () => void;
  isAnswerRevealed: boolean;
  soundEnabled: boolean;
}

const GameGrid: React.FC<GameGridProps> = ({
  teams,
  question,
  roundNumber,
  questionNumber,
  timerDuration,
  isTimerActive,
  onTimerStart,
  onTimerStop,
  onTimeUp,
  onUpdateTeamAllocations,
  teamAllocations,
  onNextQuestion,
  onRevealAnswer,
  isAnswerRevealed,
  soundEnabled
}) => {
  const [showControls, setShowControls] = useState(false);

  // Locked state logic: Locked if timer is NOT active AND we are not in the 'edit phase' (before start)
  // Actually, simplified: Locked if Timer is NOT active. 
  // Exception: If answer is revealed, definitely locked.
  const isLocked = !isTimerActive || isAnswerRevealed;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 relative">
      
      {/* Top Section: Question & Timer */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-6 pb-8 shadow-sm relative overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            
            <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-indigo-600 text-white text-xs font-bold uppercase tracking-widest rounded-full">
                        Round {roundNumber}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 font-mono text-sm">
                        Question {questionNumber} / 5
                    </span>
                </div>
                
                <h2 className="text-3xl md:text-5xl font-display font-bold text-slate-900 dark:text-white leading-tight drop-shadow-sm">
                    {question.text}
                </h2>

                <div className="grid grid-cols-2 gap-4 max-w-2xl">
                    {(['A', 'B', 'C', 'D'] as const).map(opt => (
                        <div key={opt} className={`flex items-center gap-3 p-2 rounded-lg border transition-colors ${
                            isAnswerRevealed && question.correctAnswer === opt 
                            ? 'bg-green-100 dark:bg-green-900/40 border-green-500' 
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                        }`}>
                            <span className={`w-8 h-8 flex items-center justify-center rounded-md font-bold text-sm ${
                                isAnswerRevealed && question.correctAnswer === opt 
                                ? 'bg-green-600 text-white' 
                                : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 shadow-sm'
                            }`}>
                                {opt}
                            </span>
                            <span className={`text-sm font-medium ${
                                isAnswerRevealed && question.correctAnswer === opt 
                                ? 'text-green-800 dark:text-green-100'
                                : 'text-slate-700 dark:text-slate-300'
                            }`}>
                                {question.options[opt]}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Timer */}
            <div className="flex-shrink-0">
                <Timer 
                    duration={timerDuration} 
                    isActive={isTimerActive} 
                    onTimeUp={onTimeUp} 
                    soundEnabled={soundEnabled}
                />
            </div>
        </div>
      </div>

      {/* Main Grid: 6 Teams */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full">
            {teams.map(team => (
                <TeamPanel
                    key={team.id}
                    team={team}
                    allocations={teamAllocations[team.id] || {A:0,B:0,C:0,D:0}}
                    setAllocations={(allocs) => onUpdateTeamAllocations(team.id, allocs)}
                    isLocked={isLocked}
                    showResult={isAnswerRevealed}
                    correctAnswer={question.correctAnswer}
                />
            ))}
        </div>
      </div>

      {/* Facilitator Control Bar (Hover to reveal at bottom) */}
      <div 
        className="fixed bottom-0 left-0 right-0 h-16 hover:h-24 transition-all duration-300 z-50 flex justify-center items-end pb-4 group"
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        <div className={`bg-slate-900/90 backdrop-blur-md text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-4 border border-slate-700 transform transition-transform duration-300 ${showControls ? 'translate-y-0' : 'translate-y-full group-hover:translate-y-0 opacity-0 group-hover:opacity-100'}`}>
            <span className="text-xs font-mono text-slate-400 uppercase tracking-widest mr-2 border-r border-slate-700 pr-4">
                Round Control
            </span>

            {!isTimerActive && !isAnswerRevealed && (
                 <button onClick={onTimerStart} className="flex items-center gap-2 bg-green-600 hover:bg-green-500 px-4 py-2 rounded-full font-bold text-sm transition-colors">
                    <Play size={16} fill="currentColor" /> Start Bets
                 </button>
            )}

            {isTimerActive && (
                <button onClick={onTimerStop} className="flex items-center gap-2 bg-red-600 hover:bg-red-500 px-4 py-2 rounded-full font-bold text-sm transition-colors animate-pulse">
                    <Pause size={16} fill="currentColor" /> Stop Timer
                </button>
            )}

            {!isTimerActive && !isAnswerRevealed && (
                <button onClick={onRevealAnswer} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-full font-bold text-sm transition-colors">
                    <Eye size={16} /> Reveal
                </button>
            )}

            {isAnswerRevealed && (
                <button onClick={onNextQuestion} className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-500 px-4 py-2 rounded-full font-bold text-sm transition-colors text-slate-900">
                    Next Question <ArrowRight size={16} />
                </button>
            )}
        </div>
      </div>

    </div>
  );
};

export default GameGrid;