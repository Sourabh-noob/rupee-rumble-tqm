import React, { useState, useEffect } from 'react';
import { GameState, Team, Question, Allocations } from './types';
import EntryScreen from './components/EntryScreen';
import AllocationBoard from './components/AllocationBoard';
import ResultScreen from './components/ResultScreen';
import FinalStandings from './components/FinalStandings';
import AdminDashboard from './components/AdminDashboard';
import Timer from './components/Timer';
import { generateGameQuestions } from './services/geminiService';
import { Loader, Lock, Hourglass } from 'lucide-react';

const MAX_ROUNDS = 5;

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.ENTRY);
  const [team, setTeam] = useState<Team | null>(null);
  const [roundIndex, setRoundIndex] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  
  // Lifted state for allocations to handle auto-submission
  const [draftAllocations, setDraftAllocations] = useState<Allocations>({ A: 0, B: 0, C: 0, D: 0 });
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [currentAllocations, setCurrentAllocations] = useState<Allocations | null>(null);

  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isTimerFinished, setIsTimerFinished] = useState(false);
  const [timerDuration, setTimerDuration] = useState(40); // Default to 40 seconds

  // Initialize questions on load
  useEffect(() => {
    if (questions.length === 0) {
        generateGameQuestions().then(qs => setQuestions(qs));
    }
  }, []);

  // Auto-start timer when entering PLAYING state
  useEffect(() => {
    if (gameState === GameState.PLAYING) {
        setIsTimerActive(true);
        setIsTimerFinished(false);
        setHasSubmitted(false);
        setDraftAllocations({ A: 0, B: 0, C: 0, D: 0 }); // Reset board
    }
  }, [gameState]);

  const handleJoin = (newTeam: Team) => {
    setTeam(newTeam);
    setGameState(GameState.LOADING_QUESTIONS);
    setTimeout(() => setGameState(GameState.PLAYING), 1500);
  };

  const handleAdminLogin = () => {
    // Pause timer logic if needed, but for now just switch view
    setIsTimerActive(false);
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
    setHasSubmitted(false);
    setDraftAllocations({ A: 0, B: 0, C: 0, D: 0 });
  };

  // Called when manual submit button is pressed
  const handleManualSubmit = () => {
    setHasSubmitted(true);
    // We do NOT transition state yet. We wait for the timer.
  };

  // Called when Timer hits 0
  const handleTimeUp = () => {
    setIsTimerActive(false);
    setIsTimerFinished(true);
    
    // Auto-submit the current draft allocations
    finalizeRound(draftAllocations);
  };

  const finalizeRound = (allocations: Allocations) => {
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
        // Resetting these will be handled by the useEffect on GameState.PLAYING
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
                            
                            {/* We now show the timer immediately in PLAYING state */}
                            <Timer 
                                duration={timerDuration} 
                                isActive={isTimerActive} 
                                onTimeUp={handleTimeUp} 
                            />
                        </div>

                        {/* Allocation Board */}
                        <AllocationBoard 
                            balance={team?.balance || 0}
                            question={currentQuestion}
                            allocations={draftAllocations}
                            setAllocations={setDraftAllocations}
                            isTimerActive={isTimerActive}
                            hasSubmitted={hasSubmitted}
                            onManualSubmit={handleManualSubmit}
                        />
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