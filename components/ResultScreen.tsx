
import React, { useMemo } from 'react';
import { Allocations, Question } from '../types';
import { ArrowRight, CheckCircle, XCircle, TrendingUp, Sparkles, Trophy } from 'lucide-react';
import { EtherealShadow } from './ui/etheral-shadow';
import { motion, AnimatePresence } from 'framer-motion';

interface ResultScreenProps {
  question: Question;
  allocations: Allocations;
  startBalance: number;
  onNext: () => void;
  isGameOver: boolean;
}

const FloatingCurrency = () => {
  const particles = useMemo(() => Array.from({ length: 15 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    duration: 3 + Math.random() * 4,
    delay: Math.random() * 5,
    size: 10 + Math.random() * 20,
    opacity: 0.1 + Math.random() * 0.3
  })), []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: '110vh', opacity: 0, rotate: 0 }}
          animate={{ 
            y: '-10vh', 
            opacity: [0, p.opacity, 0],
            rotate: 360 
          }}
          transition={{ 
            duration: p.duration, 
            repeat: Infinity, 
            delay: p.delay,
            ease: "linear"
          }}
          style={{
            position: 'absolute',
            left: p.left,
            fontSize: p.size,
            color: 'gold',
            userSelect: 'none'
          }}
        >
          ₹
        </motion.div>
      ))}
    </div>
  );
};

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 300, damping: 24 }
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-8 relative min-h-[600px] flex flex-col justify-center overflow-hidden">
      
      {/* Custom Animations */}
      <style>{`
        @keyframes success-pulse {
          0% { transform: scale(1); box-shadow: 0 0 15px rgba(34, 197, 94, 0.4); border-color: rgba(34, 197, 94, 0.6); }
          50% { transform: scale(1.03); box-shadow: 0 0 30px rgba(34, 197, 94, 0.7); border-color: rgba(34, 197, 94, 1); }
          100% { transform: scale(1); box-shadow: 0 0 15px rgba(34, 197, 94, 0.4); border-color: rgba(34, 197, 94, 0.6); }
        }
        .animate-success-pulse {
          animation: success-pulse 3s infinite ease-in-out;
        }
        .glow-red {
          box-shadow: 0 0 20px rgba(239, 68, 68, 0.4);
        }
      `}</style>

      {/* Background Celebration */}
      {isGreatRound && (
          <>
            <div className="absolute inset-0 z-0 overflow-hidden rounded-3xl pointer-events-none">
                <EtherealShadow 
                  color="rgba(234, 179, 8, 0.4)" // Gold
                  animation={{ scale: 80, speed: 40 }}
                  noise={{ opacity: 0.2, scale: 1 }}
                  title="PERFECT TRADE"
                  sizing="stretch"
                />
            </div>
            <FloatingCurrency />
          </>
      )}
      
      {isGoodRound && (
           <div className="absolute inset-0 z-0 overflow-hidden rounded-3xl pointer-events-none">
              <EtherealShadow 
                color="rgba(74, 222, 128, 0.3)" // Green
                animation={{ scale: 50, speed: 20 }}
                noise={{ opacity: 0.1, scale: 1 }}
                title="PROFITABLE"
                sizing="stretch"
              />
          </div>
      )}

      <motion.div 
        className="relative z-10 space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="text-center space-y-4" variants={itemVariants}>
            <div className="flex items-center justify-center gap-3">
              {isGreatRound && <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ repeat: Infinity, duration: 2 }}><Trophy className="text-yellow-500" size={32}/></motion.div>}
              <h2 className="text-3xl font-display font-bold text-slate-900 dark:text-white drop-shadow-md">ROUND SETTLEMENT</h2>
              {isGreatRound && <motion.div animate={{ rotate: [0, -15, 15, 0] }} transition={{ repeat: Infinity, duration: 2 }}><Trophy className="text-yellow-500" size={32}/></motion.div>}
            </div>
            <motion.div 
              className="inline-block px-6 py-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur rounded-full border border-slate-200 dark:border-slate-600 shadow-xl"
              whileHover={{ scale: 1.05 }}
            >
              Correct Answer: <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 ml-2">{correctAnswer}</span>
            </motion.div>
        </motion.div>

        <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" variants={containerVariants}>
            {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                const isCorrect = opt === correctAnswer;
                const amount = allocations[opt];
                
                return (
                    <motion.div 
                        key={opt}
                        variants={itemVariants}
                        className={`relative p-6 rounded-xl border-2 flex flex-col items-center text-center overflow-hidden transition-all duration-500 cursor-default ${
                            isCorrect 
                            ? 'bg-green-100/40 dark:bg-green-900/40 animate-success-pulse z-10 backdrop-blur-md' 
                            : 'bg-red-100/40 dark:bg-red-900/20 border-red-200 dark:border-red-900/30 opacity-80 backdrop-blur-sm glow-red'
                        }`}
                        whileHover={isCorrect ? { scale: 1.05 } : { scale: 0.98 }}
                    >
                        {isCorrect && amount > 0 && (
                          <motion.div 
                            className="absolute top-1 right-1"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                          >
                            <Sparkles size={16} className="text-yellow-500" />
                          </motion.div>
                        )}
                        
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
                    </motion.div>
                )
            })}
        </motion.div>

        <motion.div 
          variants={itemVariants}
          className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-8 rounded-2xl border border-slate-200 dark:border-slate-700 text-center space-y-4 shadow-2xl overflow-hidden relative"
        >
            <div className="grid grid-cols-2 gap-8 max-w-lg mx-auto relative z-10">
                <div>
                    <div className="text-slate-500 dark:text-slate-400 text-sm uppercase tracking-wider mb-1">Starting Balance</div>
                    <div className="font-mono text-2xl text-slate-700 dark:text-slate-300">₹{startBalance}</div>
                </div>
                <div>
                    <div className="text-slate-500 dark:text-slate-400 text-sm uppercase tracking-wider mb-1">New NAV</div>
                    <motion.div 
                      className={`font-mono text-3xl font-black ${keptAmount > 0 ? 'text-slate-900 dark:text-white' : 'text-red-600 dark:text-red-500'}`}
                      animate={isGreatRound ? { scale: [1, 1.1, 1], color: ['#fff', '#eab308', '#fff'] } : {}}
                      transition={{ duration: 0.8, repeat: isGreatRound ? Infinity : 0 }}
                    >
                        ₹{keptAmount}
                    </motion.div>
                </div>
            </div>
            
            <AnimatePresence>
              {keptAmount === 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 p-4 bg-red-100/50 dark:bg-red-900/50 border border-red-200 dark:border-red-500/50 rounded-lg text-red-800 dark:text-red-200 backdrop-blur"
                >
                    <h3 className="text-xl font-bold mb-2">BANKRUPT</h3>
                    <p>Your trading capital has been depleted.</p>
                </motion.div>
              )}
              {isGreatRound && (
                 <motion.div 
                   initial={{ opacity: 0, scale: 0.8 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className="mt-6 flex items-center justify-center gap-2 text-yellow-600 dark:text-yellow-400 font-black uppercase tracking-tighter"
                 >
                   <TrendingUp size={20} /> Capital Preserved! Perfect Execution
                 </motion.div>
              )}
            </AnimatePresence>
        </motion.div>

        <motion.div className="flex justify-center pt-8" variants={itemVariants}>
            <button
            onClick={onNext}
            className="group flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 px-12 rounded-xl transition-all shadow-lg shadow-indigo-900/30 hover:scale-105 hover-glow"
            >
            {keptAmount === 0 ? 'View Final Results' : isGameOver ? 'View Final Standings' : 'Next Round'}
            <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ResultScreen;
