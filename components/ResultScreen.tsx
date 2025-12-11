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
  const lostAmount = startBalance - keptAmount;
  
  // Celebration condition: Positive ROI or high retention.
  const isGreatRound = startBalance > 0 && keptAmount >= startBalance; 
  const isGoodRound = startBalance > 0 && keptAmount >= startBalance * 0.5 && !isGreatRound;

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-8 animate-fade-in relative min-h-[600px] flex flex-col justify-center">
      
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
            <h2 className="text-3xl font-display font-bold text-white drop-shadow-md">ROUND SETTLEMENT</h2>
            <div className="inline-block px-6 py-3 bg-slate-800/90 backdrop-blur rounded-full border border-slate-600 shadow-xl">
            Correct Answer: <span className="text-2xl font-bold text-yellow-400 ml-2">{correctAnswer}</span>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                const isCorrect = opt === correctAnswer;
                const amount = allocations[opt];
                
                return (
                    <div 
                        key={opt}
                        className={`relative p-6 rounded-xl border-2 flex flex-col items-center text-center overflow-hidden transition-all duration-500 ${
                            isCorrect 
                            ? 'bg-green-900/40 border-green-500 shadow-xl shadow-green-900/30 scale-105 backdrop-blur-sm' 
                            : 'bg-red-900/20 border-red-900/30 opacity-80 backdrop-blur-sm'
                        }`}
                    >
                        <div className={`text-4xl font-bold mb-2 ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                            {opt}
                        </div>
                        <div className="text-sm text-slate-300 mb-4 h-10 flex items-center justify-center font-medium">
                            {question.options[opt]}
                        </div>
                        <div className="font-mono text-xl mb-2 text-white font-bold">₹{amount}</div>
                        
                        {isCorrect ? (
                            <div className="flex items-center text-green-400 text-sm font-bold gap-1 mt-auto">
                                <CheckCircle size={16} /> RETAINED
                            </div>
                        ) : (
                            <div className="flex items-center text-red-400 text-sm font-bold gap-1 mt-auto">
                                <XCircle size={16} /> LOST
                            </div>
                        )}
                    </div>
                )
            })}
        </div>

        <div className="bg-slate-800/80 backdrop-blur-xl p-8 rounded-2xl border border-slate-700 text-center space-y-4 shadow-2xl">
            <div className="grid grid-cols-2 gap-8 max-w-lg mx-auto">
                <div>
                    <div className="text-slate-400 text-sm uppercase tracking-wider mb-1">Starting Balance</div>
                    <div className="font-mono text-2xl text-slate-300">₹{startBalance}</div>
                </div>
                <div>
                    <div className="text-slate-400 text-sm uppercase tracking-wider mb-1">New NAV</div>
                    <div className={`font-mono text-3xl font-bold ${keptAmount > 0 ? 'text-white' : 'text-red-500'}`}>
                        ₹{keptAmount}
                    </div>
                </div>
            </div>
            
            {keptAmount === 0 ? (
                <div className="mt-8 p-4 bg-red-900/50 border border-red-500/50 rounded-lg text-red-200 backdrop-blur">
                    <h3 className="text-xl font-bold mb-2">BANKRUPT</h3>
                    <p>Your trading capital has been depleted.</p>
                </div>
            ) : null}
        </div>

        <div className="flex justify-center pt-8">
            <button
            onClick={onNext}
            className="group flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 px-12 rounded-xl transition-all shadow-lg shadow-indigo-900/30 hover:scale-105"
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
