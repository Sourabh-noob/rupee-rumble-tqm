import React, { useState, useEffect } from 'react';
import { GameState, Team, Question, Allocations } from './types';
import EntryScreen from './components/EntryScreen';
import AllocationBoard from './components/AllocationBoard';
import ResultScreen from './components/ResultScreen';
import FinalStandings from './components/FinalStandings';
import AdminDashboard from './components/AdminDashboard';
import Timer from './components/Timer';
import { generateGameQuestions, generateTeamLogo } from './services/geminiService';
import { Sun, Moon, Volume2, VolumeX } from 'lucide-react';
import { playSound } from './utils/sound';

const App: React.FC = () => {
  // Application State
  const [gameState, setGameState] = useState<GameState>(GameState.SETUP);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Game Settings (Editable via Admin)
  const [timerDuration, setTimerDuration] = useState(40);

  // Game Data
  const [questions, setQuestions] = useState<Question[]>([]);
  const [team, setTeam] = useState<Team | null>(null);

  // Round State
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0); // Index in the flat questions array
  const [allocations, setAllocations] = useState<Allocations>({ A: 0, B: 0, C: 0, D: 0 });
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [startBalance, setStartBalance] = useState(1000); // Balance at start of current round

  // Initialize Theme
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Load Questions
  useEffect(() => {
    generateGameQuestions().then(qs => {
        setQuestions(qs);
    });
  }, []);

  // --- Handlers ---

  const handleJoin = async (newTeam: Team) => {
    setTeam(newTeam);
    setGameState(GameState.PLAYING);
    // Don't generate logo anymore per request for solid color
    startRound(newTeam.balance);
  };

  const startRound = (currentBalance: number) => {
    setAllocations({ A: 0, B: 0, C: 0, D: 0 });
    setHasSubmitted(false);
    setShowResult(false);
    setIsTimerActive(true);
    setStartBalance(currentBalance);
  };

  const handleAdminStartRound = (roundNum: number, questionNum: number) => {
    // 1. Find the index in the flat questions array
    const index = questions.findIndex(q => q.roundNumber === roundNum && q.questionNumber === questionNum);
    
    if (index !== -1) {
        setCurrentRoundIndex(index);
        
        // 2. Admin controls Game State (Backend Logic)
        // Reset Round State globally
        setAllocations({ A: 0, B: 0, C: 0, D: 0 });
        setHasSubmitted(false);
        setShowResult(false);
        setIsTimerActive(true);
        
        // Note: We do NOT force the view to change to PLAYING here.
        // The Admin stays in dashboard. If a team is logged in (on this or another synchronized client), 
        // they will see the new round content because currentRoundIndex is updated.
        // For single-browser demo, if the user is in Admin, they stay in Admin.
    }
  };

  const handleManualSubmit = () => {
    setHasSubmitted(true);
    // Timer continues running until 0
  };

  const handleTimeUp = () => {
    setHasSubmitted(true);
    setIsTimerActive(false);
    handleRoundEnd();
  };

  const handleRoundEnd = () => {
    if (!team || !questions[currentRoundIndex]) return;

    const currentQ = questions[currentRoundIndex];
    const correctAnswer = currentQ.correctAnswer;
    const keptAmount = allocations[correctAnswer];

    // Update Team State
    const updatedHistory = [
        ...team.history,
        {
            roundNumber: currentQ.roundNumber,
            questionNumber: currentQ.questionNumber,
            startBalance: team.balance,
            allocations: allocations,
            correctAnswer: correctAnswer,
            endBalance: keptAmount
        }
    ];

    setTeam({
        ...team,
        balance: keptAmount,
        history: updatedHistory
    });

    if (soundEnabled) {
        if (keptAmount >= team.balance && team.balance > 0) {
            playSound('profit'); 
        } else {
            playSound('loss'); 
        }
    }

    setShowResult(true);
  };

  const handleNextRound = () => {
    if (!team) return;

    // Check Game Over
    if (team.balance === 0 || currentRoundIndex >= questions.length - 1) {
        setGameState(GameState.GAME_OVER);
        return;
    }

    setCurrentRoundIndex(prev => prev + 1);
    startRound(team.balance);
  };

  const handleRestart = () => {
    setTeam(null);
    setCurrentRoundIndex(0);
    setGameState(GameState.SETUP);
  };

  // --- Render Views ---
  
  const renderContent = () => {
      // 1. Setup / Entry
      if (gameState === GameState.SETUP) {
        return (
            <div className="min-h-screen flex flex-col relative pb-12">
                <div className="absolute top-4 right-4 flex gap-2 z-10">
                    <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                        {isDarkMode ? <Sun className="text-white"/> : <Moon />}
                    </button>
                </div>
                <EntryScreen 
                    onJoin={handleJoin} 
                    onAdminLogin={() => setGameState(GameState.ADMIN_DASHBOARD)}
                />
            </div>
        );
      }

      // 2. Admin Dashboard
      if (gameState === GameState.ADMIN_DASHBOARD) {
        return (
            <AdminDashboard 
                questions={questions}
                setQuestions={setQuestions}
                timerDuration={timerDuration}
                setTimerDuration={setTimerDuration}
                onLogout={() => setGameState(GameState.SETUP)}
                onStartRound={handleAdminStartRound}
            />
        );
      }

      // 3. Final Standings
      if (gameState === GameState.GAME_OVER && team) {
          return (
              <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors pb-12">
                  <FinalStandings team={team} onRestart={handleRestart} />
              </div>
          );
      }

      // 4. Game Loop (Playing)
      const currentQuestion = questions[currentRoundIndex];

      if (gameState === GameState.PLAYING && team && currentQuestion) {
          return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors flex flex-col pb-12">
                {/* Header */}
                <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 sticky top-0 z-30 shadow-sm">
                    <div className="max-w-7xl mx-auto flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            {/* Replaced Avatar Image with Solid Color Div */}
                            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold border border-slate-300 dark:border-slate-600 shadow-md">
                                {team.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h2 className="font-bold text-slate-900 dark:text-white leading-tight">{team.name}</h2>
                                <div className="text-xs text-slate-500 font-mono">Current NAV: ₹{team.balance}</div>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            <div className="hidden md:block text-right">
                                <div className="text-xs text-slate-400 uppercase tracking-wider font-bold">Round {currentQuestion.roundNumber}</div>
                                <div className="text-sm font-bold text-slate-700 dark:text-slate-300">Question {currentQuestion.questionNumber} / 5</div>
                            </div>
                            <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                            </button>
                            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                 {isDarkMode ? <Sun size={20}/> : <Moon size={20} />}
                            </button>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 container mx-auto p-4 md:p-8 max-w-6xl flex flex-col">
                    {showResult ? (
                        <ResultScreen 
                            question={currentQuestion}
                            allocations={allocations}
                            startBalance={startBalance}
                            onNext={handleNextRound}
                            isGameOver={team.balance === 0 || currentRoundIndex >= questions.length - 1}
                        />
                    ) : (
                        <div className="space-y-8 animate-fade-in">
                            {/* Question Section */}
                            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-xl relative overflow-hidden">
                                 <div className="flex flex-col md:flex-row gap-8 items-start">
                                    <div className="flex-1 space-y-6 relative z-10">
                                        <span className="inline-block px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-bold uppercase tracking-wider">
                                            Market Query
                                        </span>
                                        <h3 className="text-2xl md:text-3xl font-display font-bold text-slate-900 dark:text-white leading-relaxed">
                                            {currentQuestion.text}
                                        </h3>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <Timer 
                                            duration={timerDuration} 
                                            isActive={isTimerActive} 
                                            onTimeUp={handleTimeUp}
                                            soundEnabled={soundEnabled} 
                                        />
                                    </div>
                                 </div>
                            </div>

                            {/* Allocation Board */}
                            <AllocationBoard 
                                balance={team.balance}
                                question={currentQuestion}
                                allocations={allocations}
                                setAllocations={setAllocations}
                                isTimerActive={isTimerActive}
                                hasSubmitted={hasSubmitted}
                                onManualSubmit={handleManualSubmit}
                            />
                        </div>
                    )}
                </main>
            </div>
          );
      }
      
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      );
  }

  return (
      <>
        {renderContent()}
        {/* Persistent Footer */}
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900 text-slate-400 py-2 text-center text-xs font-mono uppercase tracking-[0.2em] z-50 border-t border-slate-800 shadow-lg">
            The QuizMasterz wish you luck
        </div>
      </>
  );
};

export default App;