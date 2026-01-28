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
import { GoogleGenAI } from "@google/genai";

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.SETUP);
  const [isDarkMode, setIsDarkMode] = useState(true);
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
  const [marketCommentary, setMarketCommentary] = useState<string>("");

  // Refs to avoid stale closures in callbacks
  const stateRef = useRef({ team, allocations, currentRoundIndex, questions });
  useEffect(() => {
    stateRef.current = { team, allocations, currentRoundIndex, questions };
  }, [team, allocations, currentRoundIndex, questions]);

  // Initial Load
  useEffect(() => {
    const init = async () => {
      try {
        const qs = await generateGameQuestions();
        setQuestions(qs);
        
        const { data, error } = await supabase.from('game_state').select('*').eq('id', GAME_STATE_ID).maybeSingle(); 
        if (data && !error) {
            setCurrentRoundIndex(data.current_round_index);
            setIsTimerActive(data.is_timer_active);
            setShowResult(data.show_result);
            setShowLeaderboard(data.show_leaderboard);
            setTimerDuration(data.timer_duration || 40);
        }
      } catch (err) {
        setInitError("Market connectivity issues. Please reload.");
      } finally {
        setIsAppLoading(false);
      }
    };
    init();

    const channel = supabase.channel('realtime-game')
        .on('postgres_changes', { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'game_state', 
            filter: `id=eq.${GAME_STATE_ID}` 
        }, (payload) => {
            const newState = payload.new as RemoteGameState;
            setCurrentRoundIndex(prev => {
                if (newState.current_round_index !== prev) {
                    setAllocations({ A: 0, B: 0, C: 0, D: 0 });
                    setHasSubmitted(false);
                    setMarketCommentary("");
                }
                return newState.current_round_index;
            });
            setIsTimerActive(newState.is_timer_active);
            setShowResult(newState.show_result);
            setShowLeaderboard(newState.show_leaderboard);
            if (newState.timer_duration) setTimerDuration(newState.timer_duration);
        })
        .subscribe((status) => setIsConnected(status === 'SUBSCRIBED'));

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  const generateCommentary = async (currTeam: Team, currQ: Question) => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are the Rupee Rumble market host. Team "${currTeam.name}" just finished Q${currQ.questionNumber} with a balance of ₹${currTeam.balance}. The correct answer was ${currQ.correctAnswer}. Give a snappy 1-sentence market reaction.`,
      });
      setMarketCommentary(response.text || "");
    } catch (e) {
      console.error("Commentary failed", e);
    }
  };

  const handleRoundEnd = async () => {
    const { team: currentTeam, currentRoundIndex: idx, questions: currentQs, allocations: currentAlloc } = stateRef.current;
    if (!currentTeam || !currentQs[idx]) return;
    
    const currentQ = currentQs[idx];
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
    
    await supabase.from('teams').upsert({
        id: updatedTeam.id,
        name: updatedTeam.name,
        members: updatedTeam.members,
        balance: updatedTeam.balance,
        history: updatedTeam.history
    });
    
    if (soundEnabled) {
        if (keptAmount >= currentTeam.balance && currentTeam.balance > 0) playSound('profit'); 
        else playSound('loss'); 
    }
    setShowResult(true);
    generateCommentary(updatedTeam, currentQ);
  };

  const handleTimeUp = useCallback(() => {
    setHasSubmitted(true);
    setIsTimerActive(false);
    handleRoundEnd();
  }, [soundEnabled]);

  const handleJoin = async (newTeam: Team) => {
    setTeam(newTeam);
    setGameState(GameState.PLAYING);
    setStartBalance(newTeam.balance);
    await supabase.from('teams').upsert(newTeam);
  };

  const handleAdminStartRound = async (roundNum: number, qNum: number) => {
    const idx = questions.findIndex(q => q.roundNumber === roundNum && q.questionNumber === qNum);
    if (idx !== -1) {
        await supabase.from('game_state').update({
            current_round_index: idx,
            is_timer_active: true,
            show_result: false,
            show_leaderboard: false
        }).eq('id', GAME_STATE_ID);
    }
  };

  const currentQuestion = questions[currentRoundIndex];

  if (isAppLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900">
      <Loader2 className="animate-spin h-12 w-12 text-indigo-600 mb-4" />
      <p className="text-slate-500 font-mono text-sm uppercase tracking-widest">Opening Markets...</p>
    </div>
  );

  if (initError) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 p-8 text-center">
      <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
      <h2 className="text-2xl font-bold mb-2">Sync Error</h2>
      <button onClick={() => window.location.reload()} className="bg-indigo-600 text-white px-6 py-2 rounded-lg mt-4">Retry Connection</button>
    </div>
  );

  if (gameState === GameState.SETUP) return (
    <div className="min-h-screen relative flex flex-col">
       <div className={`absolute top-4 left-4 flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold z-50 ${isConnected ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
         {isConnected ? 'STABLE' : 'CONNECTING...'}
       </div>
       <EntryScreen onJoin={handleJoin} onAdminLogin={() => setGameState(GameState.ADMIN_DASHBOARD)} />
    </div>
  );

  if (gameState === GameState.ADMIN_DASHBOARD) return (
    <AdminDashboard 
        questions={questions} setQuestions={setQuestions}
        timerDuration={timerDuration} setTimerDuration={setTimerDuration}
        onLogout={() => setGameState(GameState.SETUP)}
        onStartRound={handleAdminStartRound}
    />
  );

  if (team && currentQuestion) {
      if (showLeaderboard) return <Leaderboard currentRound={currentQuestion.roundNumber} />;

      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors flex flex-col pb-12">
            <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 sticky top-0 z-30 shadow-sm flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">{team.name.charAt(0)}</div>
                    <h2 className="font-bold text-slate-900 dark:text-white truncate max-w-[150px] md:max-w-none">{team.name} • ₹{team.balance}</h2>
                </div>
                <div className="flex gap-2 items-center">
                    <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-2 text-slate-400">
                        {soundEnabled ? <Volume2 size={18}/> : <VolumeX size={18}/>}
                    </button>
                    <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 text-slate-400">
                        {isDarkMode ? <Sun size={18}/> : <Moon size={18} />}
                    </button>
                </div>
            </header>

            <main className="flex-1 container mx-auto p-4 md:p-8 max-w-6xl flex flex-col">
                {showResult ? (
                    <div className="space-y-6">
                        <ResultScreen 
                            question={currentQuestion}
                            allocations={allocations}
                            startBalance={startBalance}
                            onNext={() => setShowResult(false)}
                            isGameOver={team.balance === 0 || currentRoundIndex >= questions.length - 1}
                        />
                        {marketCommentary && (
                            <div className="bg-indigo-600/10 border border-indigo-500/20 p-4 rounded-xl text-center italic text-indigo-400 text-sm animate-fade-in">
                                "{marketCommentary}" — Global Exchange
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-8">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-xl flex flex-col md:flex-row gap-6 items-center relative overflow-hidden">
                            <div className="flex-1 relative z-10">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-500">Live Trade: Round {currentQuestion.roundNumber}</span>
                                <h3 className="text-2xl md:text-4xl font-display font-bold text-slate-900 dark:text-white mt-1">{currentQuestion.text}</h3>
                            </div>
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
                            onManualSubmit={() => setHasSubmitted(true)}
                        />
                    </div>
                )}
            </main>
            <div className="fixed bottom-0 left-0 right-0 bg-slate-900 text-slate-600 py-1 text-[8px] font-mono text-center z-50 tracking-[0.3em]">
                RUPEE RUMBLE • {isConnected ? 'LINKED' : 'STANDALONE'}
            </div>
        </div>
      );
  }

  return null;
};

export default App;