import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, Team, Question, Allocations } from './types';
import EntryScreen from './components/EntryScreen';
import AllocationBoard from './components/AllocationBoard';
import ResultScreen from './components/ResultScreen';
import FinalStandings from './components/FinalStandings';
import AdminDashboard from './components/AdminDashboard';
import Leaderboard from './components/Leaderboard';
import Timer from './components/Timer';
import { generateGameQuestions } from './services/geminiService';
import { supabase, GAME_STATE_ID, RemoteGameState } from './services/supabaseService';
import { Sun, Moon, Volume2, VolumeX, Wifi, WifiOff, Loader2, AlertCircle } from 'lucide-react';
import { playSound } from './utils/sound';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.SETUP);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });
  
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [timerDuration, setTimerDuration] = useState(40);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [team, setTeam] = useState<Team | null>(null);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [allocations, setAllocations] = useState<Allocations>({ A: 0, B: 0, C: 0, D: 0 });
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [startBalance, setStartBalance] = useState(1000);
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  // Use refs for values needed in the time-up callback to avoid stale closures
  const allocationsRef = useRef(allocations);
  const teamRef = useRef(team);
  const currentRoundIndexRef = useRef(currentRoundIndex);
  const questionsRef = useRef(questions);

  useEffect(() => {
    allocationsRef.current = allocations;
    teamRef.current = team;
    currentRoundIndexRef.current = currentRoundIndex;
    questionsRef.current = questions;
  }, [allocations, team, currentRoundIndex, questions]);

  useEffect(() => {
    generateGameQuestions()
      .then(qs => {
        setQuestions(qs);
        setIsAppLoading(false);
      })
      .catch(err => {
        setInitError("Market connectivity issues. Please reload.");
        setIsAppLoading(false);
      });
  }, []);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  // Realtime Connection
  useEffect(() => {
    const fetchInitialState = async () => {
        const { data, error } = await supabase.from('game_state').select('*').eq('id', GAME_STATE_ID).maybeSingle(); 
        if (data && !error) {
            console.log("Initial Supabase State:", data);
            setCurrentRoundIndex(data.current_round_index);
            setIsTimerActive(data.is_timer_active);
            setShowResult(data.show_result);
            setShowLeaderboard(data.show_leaderboard);
            setTimerDuration(data.timer_duration || 40);
        }
    };
    fetchInitialState();

    const channel = supabase.channel('realtime-game')
        .on('postgres_changes', { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'game_state', 
            filter: `id=eq.${GAME_STATE_ID}` 
        }, (payload) => {
            const newState = payload.new as RemoteGameState;
            console.log("Supabase Realtime Update Received:", newState);
            
            setCurrentRoundIndex(prev => {
                if (newState.current_round_index !== prev) {
                    setAllocations({ A: 0, B: 0, C: 0, D: 0 });
                    setHasSubmitted(false);
                }
                return newState.current_round_index;
            });
            setIsTimerActive(newState.is_timer_active);
            setShowResult(newState.show_result);
            setShowLeaderboard(newState.show_leaderboard);
            if (newState.timer_duration) setTimerDuration(newState.timer_duration);
        })
        .subscribe((status) => {
            console.log("Supabase Subscription Status:", status);
            setIsConnected(status === 'SUBSCRIBED');
        });

    return () => { supabase.removeChannel(channel); };
  }, []);

  const syncTeamToDatabase = useCallback(async (updatedTeam: Team) => {
      if (!updatedTeam) return;
      await supabase.from('teams').upsert({
          id: updatedTeam.id,
          name: updatedTeam.name,
          members: updatedTeam.members,
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

  const handleAdminStartRound = async (roundNum: number, questionNum: number) => {
    console.log(`Admin starting Round ${roundNum} Q${questionNum}`);
    const index = questions.findIndex(q => q.roundNumber === roundNum && q.questionNumber === questionNum);
    if (index !== -1) {
        await supabase.from('game_state').update({
            current_round_index: index,
            is_timer_active: true,
            show_result: false,
            show_leaderboard: false
        }).eq('id', GAME_STATE_ID);
    }
  };

  const handleRoundEnd = async () => {
    const currentTeam = teamRef.current;
    const currentIdx = currentRoundIndexRef.current;
    const currentQs = questionsRef.current;
    const currentAlloc = allocationsRef.current;

    if (!currentTeam || !currentQs[currentIdx]) return;
    
    const currentQ = currentQs[currentIdx];
    const keptAmount = currentAlloc[currentQ.correctAnswer];
    
    const updatedHistory = [...currentTeam.history, {
        roundNumber: currentQ.roundNumber,
        questionNumber: currentQ.questionNumber,
        startBalance: currentTeam.balance,
        allocations: { ...currentAlloc },
        correctAnswer: currentQ.correctAnswer,
        endBalance: keptAmount
    }];
    
    const updatedTeam = { ...currentTeam, balance: keptAmount, history: updatedHistory };
    setTeam(updatedTeam);
    await syncTeamToDatabase(updatedTeam);
    
    if (soundEnabled) {
        if (keptAmount >= currentTeam.balance && currentTeam.balance > 0) playSound('profit'); 
        else playSound('loss'); 
    }
    setShowResult(true);
  };

  const handleManualSubmit = () => setHasSubmitted(true);

  const handleTimeUp = useCallback(() => {
    console.log("Handle Time Up Triggered Locally");
    setHasSubmitted(true);
    setIsTimerActive(false);
    handleRoundEnd();
  }, [soundEnabled]);

  const currentQuestion = questions[currentRoundIndex];

  const renderContent = () => {
      if (isAppLoading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900">
          <Loader2 className="animate-spin h-12 w-12 text-indigo-600 mb-4" />
          <p className="text-slate-500 font-mono text-sm">Opening Exchange...</p>
        </div>
      );

      if (initError) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 p-8 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Sync Error</h2>
          <button onClick={() => window.location.reload()} className="bg-indigo-600 text-white px-6 py-2 rounded-lg mt-4">Retry</button>
        </div>
      );

      if (gameState === GameState.SETUP) return (
          <div className="min-h-screen flex flex-col relative pb-12">
              <div className="absolute top-4 left-4 flex gap-2 z-10">
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${isConnected ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                      {isConnected ? 'LIVE' : 'OFFLINE'}
                  </div>
              </div>
              <EntryScreen onJoin={handleJoin} onAdminLogin={() => setGameState(GameState.ADMIN_DASHBOARD)} />
          </div>
      );

      if (gameState === GameState.ADMIN_DASHBOARD) return (
          <AdminDashboard 
              questions={questions}
              setQuestions={setQuestions}
              timerDuration={timerDuration}
              setTimerDuration={setTimerDuration}
              onLogout={() => setGameState(GameState.SETUP)}
              onStartRound={handleAdminStartRound}
          />
      );

      if (gameState === GameState.GAME_OVER && team) return (
          <FinalStandings team={team} onRestart={() => setGameState(GameState.SETUP)} />
      );

      if (gameState === GameState.PLAYING && team && currentQuestion) {
          if (showLeaderboard) return <Leaderboard currentRound={currentQuestion.roundNumber} />;

          return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors flex flex-col pb-12">
                <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 sticky top-0 z-30 shadow-sm flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">{team.name.charAt(0)}</div>
                        <h2 className="font-bold text-slate-900 dark:text-white">{team.name} • ₹{team.balance}</h2>
                    </div>
                    <div className="flex gap-4 items-center">
                        <span className="text-xs font-mono text-slate-500">R{currentQuestion.roundNumber} Q{currentQuestion.questionNumber}</span>
                        <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 text-slate-400">{isDarkMode ? <Sun size={18}/> : <Moon size={18} />}</button>
                    </div>
                </header>

                <main className="flex-1 container mx-auto p-4 md:p-8 max-w-6xl flex flex-col">
                    {showResult ? (
                        <ResultScreen 
                            question={currentQuestion}
                            allocations={allocations}
                            startBalance={startBalance}
                            onNext={() => setShowResult(false)}
                            isGameOver={team.balance === 0 || currentRoundIndex >= questions.length - 1}
                        />
                    ) : (
                        <div className="space-y-8">
                            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-xl flex flex-col md:flex-row gap-6 items-center">
                                <div className="flex-1">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-500">Market Bulletin</span>
                                    <h3 className="text-2xl md:text-4xl font-display font-bold text-slate-900 dark:text-white mt-1">{currentQuestion.text}</h3>
                                </div>
                                {/* Key ensures Timer re-mounts on state transition */}
                                <Timer 
                                    key={`${currentRoundIndex}-${isTimerActive}`} 
                                    duration={timerDuration} 
                                    isActive={isTimerActive} 
                                    onTimeUp={handleTimeUp} 
                                    soundEnabled={soundEnabled} 
                                />
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
      return null;
  }

  return (
      <>
        {renderContent()}
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900 text-slate-500 py-1 text-[8px] font-mono text-center z-50 tracking-[0.3em]">RUPEE RUMBLE • {isConnected ? 'LINKED' : 'OFFLINE'}</div>
      </>
  );
};

export default App;