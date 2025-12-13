import React from 'react';
import { Allocations, Question } from '../types';
import { ArrowRight, CheckCircle, XCircle } from 'lucide-react';
import { EtherealShadow } from './ui/etheral-shadow';

interface ResultScreenProps {
  question: Question;
  allocations: Allocations;
  startBalance: number;
  onNext: () => void;
  isGameOver: boolean;
}

const ResultScreen: React.FC<ResultScreenProps> = ({
  question,
  allocations,
  startBalance,
  onNext,
  isGameOver,
}) => {
  const correctAnswer = question.correctAnswer;
  const keptAmount = allocations[correctAnswer];
  
  // Celebration condition: Positive ROI or high retention.
  const isGreatRound = startBalance > 0 && keptAmount >= startBalance; 
  const isGoodRound = startBalance > 0 && keptAmount >= startBalance * 0.5 && !isGreatRound;

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-8 animate-fade-in relative min-h-[600px] flex flex-col justify-center">
      
      {/* Custom Animations */}
      <style>{`
        @keyframes success-pulse {
          0% { transform: scale(1.02); box-shadow: 0 0 20px rgba(34, 197, 94, 0.4); border-color: rgba(34, 197, 94, 0.8); }
          50% { transform: scale(1.05); box-shadow: 0 0 40px rgba(34, 197, 94, 0.7); border-color: rgba(34, 197, 94, 1); }
          100% { transform: scale(1.02); box-shadow: 0 0 20px rgba(34, 197, 94, 0.4); border-color: rgba(34, 197, 94, 0.8); }
        }
        .animate-success-pulse {
          animation: success-pulse 2.5s infinite ease-in-out;
        }
        .glow-red {
          box-shadow: 0 0 25px rgba(239, 68, 68, 0.3);
        }
      `}</style>

      {/* Background Celebration */}
      {isGreatRound && (
          <div className="absolute inset-0 z-0 overflow-hidden rounded-3xl pointer-events-none">
              <EtherealShadow 
                color="rgba(234, 179, 8, 0.8)" // Gold
                animation={{ scale: 80, speed: 40 }}
                noise={{ opacity: 0.5, scale: 1 }}
                title="PERFECT TRADE"
                sizing="stretch"
              />
          </div>
      )}
      
      {isGoodRound && (
           <div className="absolute inset-0 z-0 overflow-hidden rounded-3xl pointer-events-none">
              <EtherealShadow 
                color="rgba(74, 222, 128, 0.6)" // Green
                animation={{ scale: 50, speed: 20 }}
                noise={{ opacity: 0.3, scale: 1 }}
                title="PROFITABLE"
                sizing="stretch"
              />
          </div>
      )}

      <div className="relative z-10 space-y-8">
        <div className="text-center space-y-4">
            <h2 className="text-3xl font-display font-bold text-slate-900 dark:text-white drop-shadow-md">ROUND SETTLEMENT</h2>
            <div className="inline-block px-6 py-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur rounded-full border border-slate-200 dark:border-slate-600 shadow-xl">
            Correct Answer: <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 ml-2">{correctAnswer}</span>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                const isCorrect = opt === correctAnswer;
                const amount = allocations[opt];
                
                return (
                    <div 
                        key={opt}
                        className={`relative p-6 rounded-xl border-2 flex flex-col items-center text-center overflow-hidden transition-all duration-500 cursor-default hover:shadow-[0_0_35px_rgba(250,204,21,0.5)] hover:border-yellow-400/60 hover:-translate-y-1 ${
                            isCorrect 
                            ? 'bg-green-100/40 dark:bg-green-900/40 animate-success-pulse z-10 backdrop-blur-md' 
                            : 'bg-red-100/40 dark:bg-red-900/20 border-red-200 dark:border-red-900/30 opacity-80 backdrop-blur-sm glow-red'
                        }`}
                    >
                        <div className={`text-4xl font-bold mb-2 ${isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                            {opt}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-300 mb-4 h-10 flex items-center justify-center font-medium">
                            {question.options[opt]}
                        </div>
                        <div className="font-mono text-xl mb-2 text-slate-900 dark:text-white font-bold">₹{amount}</div>
                        
                        {isCorrect ? (
                            <div className="flex items-center text-green-600 dark:text-green-400 text-sm font-bold gap-1 mt-auto">
                                <CheckCircle size={16} /> RETAINED
                            </div>
                        ) : (
                            <div className="flex items-center text-red-500 dark:text-red-400 text-sm font-bold gap-1 mt-auto">
                                <XCircle size={16} /> LOST
                            </div>
                        )}
                    </div>
                )
            })}
        </div>

        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-8 rounded-2xl border border-slate-200 dark:border-slate-700 text-center space-y-4 shadow-2xl">
            <div className="grid grid-cols-2 gap-8 max-w-lg mx-auto">
                <div>
                    <div className="text-slate-500 dark:text-slate-400 text-sm uppercase tracking-wider mb-1">Starting Balance</div>
                    <div className="font-mono text-2xl text-slate-700 dark:text-slate-300">₹{startBalance}</div>
                </div>
                <div>
                    <div className="text-slate-500 dark:text-slate-400 text-sm uppercase tracking-wider mb-1">New NAV</div>
                    <div className={`font-mono text-3xl font-bold ${keptAmount > 0 ? 'text-slate-900 dark:text-white' : 'text-red-600 dark:text-red-500'}`}>
                        ₹{keptAmount}
                    </div>
                </div>
            </div>
            
            {keptAmount === 0 ? (
                <div className="mt-8 p-4 bg-red-100/50 dark:bg-red-900/50 border border-red-200 dark:border-red-500/50 rounded-lg text-red-800 dark:text-red-200 backdrop-blur">
                    <h3 className="text-xl font-bold mb-2">BANKRUPT</h3>
                    <p>Your trading capital has been depleted.</p>
                </div>
            ) : null}
        </div>

        <div className="flex justify-center pt-8">
            <button
            onClick={onNext}
            className="group flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 px-12 rounded-xl transition-all shadow-lg shadow-indigo-900/30 hover:scale-105 hover-glow"
            >
            {keptAmount === 0 ? 'View Final Results' : isGameOver ? 'View Final Standings' : 'Next Round'}
            <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </button>
        </div>
      </div>
    </div>
  );
};

export default ResultScreen;