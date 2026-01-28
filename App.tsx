
import React, { useState, useEffect, useCallback } from 'react';
import { GameState, Team, Question, Allocations } from './types';
import EntryScreen from './components/EntryScreen';
import AllocationBoard from './components/AllocationBoard';
import ResultScreen from './components/ResultScreen';
import FinalStandings from './components/FinalStandings';
import AdminDashboard from './components/AdminDashboard';
import Timer from './components/Timer';
import { generateGameQuestions } from './services/geminiService';
import { supabase, GAME_STATE_ID, RemoteGameState } from './services/supabaseService';
import { Sun, Moon, Volume2, VolumeX, Wifi, WifiOff } from 'lucide-react';
import { playSound } from './utils/sound';

const App: React.FC = () => {
  // Application State
  const [gameState, setGameState] = useState<GameState>(GameState.SETUP);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
        // Fixed: window.mediaQuery is incorrect. Standard way is window.matchMedia.
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  // Game Settings
  const [timerDuration, setTimerDuration] = useState(40);

  // Game Data
  const [questions, setQuestions] = useState<Question[]>([]);
  const [team, setTeam] = useState<Team | null>(null);

  // Round State
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [allocations, setAllocations] = useState<Allocations>({ A: 0, B: 0, C: 0, D: 0 });
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [startBalance, setStartBalance] = useState(1000);

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

  // --- Supabase Real-time Sync ---
  useEffect(() => {
    // 1. Initial Fetch of Global State
    const fetchInitialState = async () => {
        const { data, error } = await supabase
            .from('game_state')
            .select('*')
            .eq('id', GAME_STATE_ID)
            .single();
        
        if (data && !error) {
            setCurrentRoundIndex(data.current_round_index);
            setIsTimerActive(data.is_timer_active);
            setShowResult(data.show_result);
            setIsConnected(true);
        }
    };
    fetchInitialState();

    // 2. Subscribe to Changes
    const channel = supabase.channel('realtime-game')
        .on('postgres_changes', { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'game_state', 
            filter: `id=eq.${GAME_STATE_ID}` 
        }, (payload) => {
            const newState = payload.new as RemoteGameState;
            console.log('Syncing Remote State:', newState);
            
            // Sync Round/Question
            if (newState.current_round_index !== currentRoundIndex) {
                setCurrentRoundIndex(newState.current_round_index);
                // Reset local betting state for new round
                setAllocations({ A: 0, B: 0, C: 0, D: 0 });
                setHasSubmitted(false);
            }
            
            // Sync Timer & Results
            setIsTimerActive(newState.is_timer_active);
            setShowResult(newState.show_result);
        })
        .subscribe((status) => {
            setIsConnected(status === 'SUBSCRIBED');
        });

    return () => {
        supabase.removeChannel(channel);
    };
  }, [currentRoundIndex]);

  // --- Anti-Cheating Logic ---
  useEffect(() => {
    if (gameState === GameState.PLAYING) {
      const handleCopy = (e: ClipboardEvent) => e.preventDefault();
      const handleContextMenu = (e: MouseEvent) => e.preventDefault();
      const handleDragStart = (e: DragEvent) => e.preventDefault();
      const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C' || e.key === 'a' || e.key === 'A')) {
          e.preventDefault();
        }
      };
      window.addEventListener('copy', handleCopy);
      window.addEventListener('contextmenu', handleContextMenu);
      window.addEventListener('dragstart', handleDragStart);
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('copy', handleCopy);
        window.removeEventListener('contextmenu', handleContextMenu);
        window.removeEventListener('dragstart', handleDragStart);
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [gameState]);

  // --- Persistence Handlers ---

  const syncTeamToDatabase = useCallback(async (updatedTeam: Team) => {
      if (!updatedTeam) return;
      await supabase.from('teams').upsert({
          id: updatedTeam.id,
          name: updatedTeam.name,
          balance: updatedTeam.balance,
          history: updatedTeam.history
      });
  }, []);

  const handleJoin = async (newTeam: Team) => {
    setTeam(newTeam);
    setGameState(GameState.PLAYING);
    setStartBalance(newTeam.balance);
    await syncTeamToDatabase(newTeam);
  };

  // --- Admin Handlers (Push to Supabase) ---

  const handleAdminStartRound = async (roundNum: number, questionNum: number) => {
    const index = questions.findIndex(q => q.roundNumber === roundNum && q.questionNumber === questionNum);
    if (index !== -1) {
        // Update Supabase Source of Truth
        await supabase.from('game_state').update({
            current_round_index: index,
            is_timer_active: true,
            show_result: false
        }).eq('id', GAME_STATE_ID);
    }
  };

  const handleManualSubmit = () => {
    setHasSubmitted(true);
  };

  const handleTimeUp = () => {
    setHasSubmitted(true);
    setIsTimerActive(false);
    // Note: In a real multi-device setup, the Admin would trigger the settlement
    // But for better UX, the player settles locally and sends result to DB
    handleRoundEnd();
  };

  const handleRoundEnd = async () => {
    if (!team || !questions[currentRoundIndex]) return;

    const currentQ = questions[currentRoundIndex];
    const correctAnswer = currentQ.correctAnswer;
    const keptAmount = allocations[correctAnswer];

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

    const updatedTeam = {
        ...team,
        balance: keptAmount,
        history: updatedHistory
    };

    setTeam(updatedTeam);
    await syncTeamToDatabase(updatedTeam);

    if (soundEnabled) {
        if (keptAmount >= team.balance && team.balance > 0) playSound('profit'); 
        else playSound('loss'); 
    }

    // Usually, Admin reveals results. If we want it automatic:
    // await supabase.from('game_state').update({ show_result: true }).eq('id', GAME_STATE_ID);
    setShowResult(true);
  };

  const handleNextRound = () => {
    if (!team) return;
    if (team.balance === 0 || currentRoundIndex >= questions.length - 1) {
        setGameState(GameState.GAME_OVER);
        return;
    }
    setStartBalance(team.balance);
    // Note: The actual change of round happens via Admin Dashboard sync
  };

  const handleRestart = () => {
    setTeam(null);
    setCurrentRoundIndex(0);
    setGameState(GameState.SETUP);
  };

  // --- Render Views ---
  
  const renderContent = () => {
      if (gameState === GameState.SETUP) {
        return (
            <div className="min-h-screen flex flex-col relative pb-12">
                <div className="absolute top-4 left-4 flex gap-2 z-10">
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${isConnected ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                        {isConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
                        {isConnected ? 'Real-time Linked' : 'Sync Offline'}
                    </div>
                </div>
                <div className="absolute top-4 right-4 flex gap-2 z-10">
                    <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors hover-glow">
                        {isDarkMode ? <Sun className="text-white"/> : <Moon />}
                    </button>
                </div>
                <EntryScreen onJoin={handleJoin} onAdminLogin={() => setGameState(GameState.ADMIN_DASHBOARD)} />
            </div>
        );
      }

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

      if (gameState === GameState.GAME_OVER && team) {
          return (
              <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors pb-12">
                  <FinalStandings team={team} onRestart={handleRestart} />
              </div>
          );
      }

      const currentQuestion = questions[currentRoundIndex];

      if (gameState === GameState.PLAYING && team && currentQuestion) {
          const roundQs = questions.filter(q => q.roundNumber === currentQuestion.roundNumber);
          const totalInRound = roundQs.length;

          return (
            <div className={`min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors flex flex-col pb-12 select-none`}>
                <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 sticky top-0 z-30 shadow-sm">
                    <div className="max-w-7xl mx-auto flex justify-between items-center">
                        <div className="flex items-center gap-4">
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
                                <div className="text-sm font-bold text-slate-700 dark:text-slate-300">Question {currentQuestion.questionNumber} / {totalInRound}</div>
                            </div>
                            <div className={`p-2 rounded-full ${isConnected ? 'text-green-500' : 'text-red-500'}`} title={isConnected ? 'Synced' : 'Connecting...'}>
                                <Wifi size={18} />
                            </div>
                            <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover-glow rounded-full">
                                {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                            </button>
                            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover-glow rounded-full">
                                 {isDarkMode ? <Sun size={20}/> : <Moon size={20} />}
                            </button>
                        </div>
                    </div>
                </header>

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
                            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-xl relative overflow-hidden">
                                 <div className="flex flex-col md:flex-row gap-8 items-start">
                                    <div className="flex-1 space-y-6 relative z-10">
                                        <span className="inline-block px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-bold uppercase tracking-wider">
                                            Market Query
                                        </span>
                                        <h3 className="text-3xl md:text-5xl font-display font-bold text-slate-900 dark:text-white leading-tight tracking-tight drop-shadow-sm">
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
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900 text-slate-400 py-2 text-center text-xs font-mono uppercase tracking-[0.2em] z-50 border-t border-slate-800 shadow-lg">
            The QuizMasters wish you luck • {isConnected ? 'SYNCED' : 'OFFLINE'}
        </div>
      </>
  );
};

export default App;
