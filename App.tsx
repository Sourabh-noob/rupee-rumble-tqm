import React, { useState, useEffect } from 'react';
import { GameState, Team, Question, Allocations } from './types';
import EntryScreen from './components/EntryScreen';
import AllocationBoard from './components/AllocationBoard';
import ResultScreen from './components/ResultScreen';
import FinalStandings from './components/FinalStandings';
import AdminDashboard from './components/AdminDashboard';
import Timer from './components/Timer';
import { generateGameQuestions } from './services/geminiService';
import { Loader, Lock } from 'lucide-react';

const MAX_ROUNDS = 5;

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.ENTRY);
  const [team, setTeam] = useState<Team | null>(null);
  const [roundIndex, setRoundIndex] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentAllocations, setCurrentAllocations] = useState<Allocations | null>(null);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isTimerFinished, setIsTimerFinished] = useState(false);
  const [timerDuration, setTimerDuration] = useState(60);

  // Initialize questions on load
  useEffect(() => {
    if (questions.length === 0) {
        generateGameQuestions().then(qs => setQuestions(qs));
    }
  }, []);

  const handleJoin = (newTeam: Team) => {
    setTeam(newTeam);
    setGameState(GameState.LOADING_QUESTIONS);
    setTimeout(() => setGameState(GameState.PLAYING), 1500);
  };

  const handleAdminLogin = () => {
    setGameState(GameState.ADMIN_DASHBOARD);
  };

  const startRoundTimer = () => {
    setIsTimerActive(true);
    setIsTimerFinished(false);
    if (gameState !== GameState.PLAYING) setGameState(GameState.PLAYING);
  };

  const stopRoundTimer = () => {
    setIsTimerActive(false);
    setIsTimerFinished(true);
  };
  
  const resetRoundTimer = () => {
    setIsTimerActive(false);
    setIsTimerFinished(false);
  };

  const handleTimeUp = () => {
    setIsTimerActive(false);
    setIsTimerFinished(true);
  };

  const submitAllocations = (allocations: Allocations) => {
    setIsTimerActive(false);
    setCurrentAllocations(allocations);
    
    if (!team || !questions[roundIndex]) return;

    const currentQuestion = questions[roundIndex];
    const keptBalance = allocations[currentQuestion.correctAnswer];
    
    const roundResult = {
        roundNumber: roundIndex + 1,
        startBalance: team.balance,
        allocations: allocations,
        correctAnswer: currentQuestion.correctAnswer,
        endBalance: keptBalance
    };

    setTeam(prev => prev ? ({
        ...prev,
        balance: keptBalance,
        history: [...prev.history, roundResult]
    }) : null);

    setGameState(GameState.ROUND_RESULT);
  };

  const nextRound = () => {
    if (!team) return;

    if (team.balance === 0 || roundIndex >= MAX_ROUNDS - 1) {
        setGameState(GameState.GAME_OVER);
    } else {
        setRoundIndex(prev => prev + 1);
        setCurrentAllocations(null);
        resetRoundTimer();
        setGameState(GameState.PLAYING);
    }
  };

  const restartGame = () => {
    setTeam(null);
    setRoundIndex(0);
    resetRoundTimer();
    setGameState(GameState.ENTRY);
  };

  // Render Content Switcher
  const renderContent = () => {
    if (gameState === GameState.ADMIN_DASHBOARD) {
        return (
            <AdminDashboard 
                questions={questions}
                setQuestions={setQuestions}
                timerDuration={timerDuration}
                setTimerDuration={setTimerDuration}
                onLogout={() => {
                    // Return to appropriate state
                    if (team) {
                        setGameState(GameState.PLAYING);
                    } else {
                        setGameState(GameState.ENTRY);
                    }
                }}
                onStartTimer={startRoundTimer}
                onStopTimer={stopRoundTimer}
                onResetTimer={resetRoundTimer}
            />
        );
    }

    if (gameState === GameState.ENTRY) {
        return <EntryScreen onJoin={handleJoin} onAdminLogin={handleAdminLogin} />;
    }

    if (gameState === GameState.LOADING_QUESTIONS) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-white space-y-4">
                <Loader className="animate-spin w-12 h-12 text-yellow-500" />
                <p className="font-display text-xl animate-pulse">Entering the Arena...</p>
            </div>
        );
    }

    if (gameState === GameState.GAME_OVER && team) {
        return <FinalStandings team={team} onRestart={restartGame} />;
    }

    const currentQuestion = questions[roundIndex];

    // Playing State
    return (
        <div className="flex-1 flex flex-col">
            {/* Top Bar */}
            <header className="bg-slate-800 border-b border-slate-700 p-4 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div>
                            <h1 className="font-bold text-white leading-tight">{team?.name}</h1>
                            <div className="text-xs text-slate-400">Round {roundIndex + 1} of {MAX_ROUNDS}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <div className="text-xs text-slate-400 uppercase tracking-widest">Current NAV</div>
                            <div className="text-2xl font-mono font-bold text-yellow-400">₹{team?.balance}</div>
                        </div>
                        {/* Admin Shortcut for in-game control */}
                        <button 
                            onClick={handleAdminLogin}
                            className="p-2 bg-slate-700 rounded-full hover:bg-slate-600 text-slate-400 transition-colors"
                            title="Admin Controls"
                        >
                            <Lock size={14} />
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
                {gameState === GameState.PLAYING && currentQuestion && (
                    <div className="max-w-4xl mx-auto space-y-8">
                        {/* Question Card */}
                        <div className="text-center space-y-6">
                            <div className="inline-block px-4 py-1 bg-slate-800 rounded-full text-slate-400 text-sm font-mono border border-slate-700">
                                QUESTION {roundIndex + 1}
                            </div>
                            <h2 className="text-2xl md:text-4xl font-display font-bold leading-tight">
                                {currentQuestion.text}
                            </h2>

                            {/* Options Preview - Visible before timer starts */}
                            {!isTimerActive && !isTimerFinished && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto my-8">
                                    {(['A', 'B', 'C', 'D'] as const).map(opt => (
                                        <div key={opt} className="bg-slate-800 border border-slate-700 p-4 rounded-xl flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-600 flex items-center justify-center font-bold font-display text-white shrink-0">
                                                {opt}
                                            </div>
                                            <div className="text-left text-slate-300 font-medium">
                                                {currentQuestion.options[opt]}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            {!isTimerActive && !isTimerFinished && !currentAllocations && (
                                <button 
                                    onClick={startRoundTimer}
                                    className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-3 px-8 rounded-full shadow-lg shadow-yellow-900/20 text-lg transition-all transform hover:scale-105"
                                >
                                    START TIMER
                                </button>
                            )}

                            {(isTimerActive || isTimerFinished) && (
                                <Timer 
                                    duration={timerDuration} 
                                    isActive={isTimerActive} 
                                    onTimeUp={handleTimeUp} 
                                />
                            )}
                            
                            {isTimerFinished && !currentAllocations && (
                                <div className="text-red-400 font-bold animate-pulse">TIME'S UP! SUBMIT NOW!</div>
                            )}
                        </div>

                        {/* Allocation Board */}
                        {(isTimerActive || isTimerFinished) && (
                            <AllocationBoard 
                                balance={team?.balance || 0}
                                question={currentQuestion}
                                isTimerActive={true} 
                                onConfirm={submitAllocations}
                            />
                        )}
                    </div>
                )}

                {gameState === GameState.ROUND_RESULT && team && currentAllocations && currentQuestion && (
                    <ResultScreen 
                        question={currentQuestion}
                        allocations={currentAllocations}
                        startBalance={team.history[team.history.length-1].startBalance}
                        onNext={nextRound}
                        isGameOver={team.balance === 0 || roundIndex >= MAX_ROUNDS - 1}
                    />
                )}
            </main>
        </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {renderContent()}
      
      {/* Global Footer */}
      <footer className="w-full bg-slate-950 border-t border-slate-800 p-4 text-center">
          <p className="text-slate-500 font-display text-sm tracking-wider">
              The QuizMasters wish you luck
          </p>
      </footer>
    </div>
  );
};

export default App;
