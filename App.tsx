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
import { Sun, Moon, Volume2, VolumeX, Loader2, AlertCircle } from 'lucide-react';
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

  const stateRef = useRef({ team, allocations, currentRoundIndex, questions });
  
  useEffect(() => {
    stateRef.current = { team, allocations, currentRoundIndex, questions };
  }, [team, allocations, currentRoundIndex, questions]);

  const generateCommentary = async (currTeam: Team, currQ: Question) => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Host a trading game called Rupee Rumble. Team "${currTeam.name}" finished Round ${currQ.roundNumber} with ₹${currTeam.balance}. The answer was ${currQ.correctAnswer}. Give a snappy 1-sentence market host reaction.`,
      });
      setMarketCommentary(response.text || "");
    } catch (e) {
      console.error("AI Commentary failed", e);
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
    
    // Non-blocking sync to DB
    supabase.from('teams').upsert(updatedTeam).then();
    
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
  }, []);

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

  useEffect(() => {
    const initApp = async () => {
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
        setIsAppLoading(false);
      } catch (err) {
        console.error("Initialization Error:", err);
        setInitError("Market connectivity issues. Please refresh the page.");
        setIsAppLoading(false);
      }
    };

    initApp();

    const channel = supabase.channel('primary-game-channel')
        .on('postgres_changes', { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'game_state', 
            filter: `id=eq.${GAME_STATE_ID}` 
        }, (payload) => {
            const newState = payload.new as RemoteGameState;
            console.log("Realtime Update Received:", newState);
            
            setCurrentRoundIndex(prev => {
                if (newState.current_round_index !== prev) {
                    setAllocations({ A: 0, B: 0, C: 0, D: 0 });
                    setHasSubmitted(false);
                    setMarketCommentary("");
                    setShowResult(false);
                }
                return newState.current_round_index;
            });

            setIsTimerActive(!!newState.is_timer_active);
            setShowResult(!!newState.show_result);
            setShowLeaderboard(!!newState.show_leaderboard);
            if (newState.timer_duration) setTimerDuration(newState.timer_duration);
        })
        .subscribe((status) => {
          setIsConnected(status === 'SUBSCRIBED');
        });

    return () => { supabase.removeChannel(channel); };
  }, [questions.length]);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  if (isAppLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900">
      <Loader2 className="animate-spin h-10 w-10 text-indigo-500 mb-4" />
      <p className="text-slate-500 font-mono text-[10px] uppercase tracking-widest">Entering The Exchange...</p>
    </div>
  );

  if (initError) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 p-6 text-center">
      <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
      <h2 className="text-xl font-bold mb-4 text-white">{initError}</h2>
      <button onClick={() => window.location.reload()} className="bg-indigo-600 text-white px-8 py-3 rounded-xl shadow-lg">Retry Connection</button>
    </div>
  );

  if (gameState === GameState.SETUP) return <EntryScreen onJoin={(t) => { setTeam(t); setGameState(GameState.PLAYING); setStartBalance(t.balance); }} onAdminLogin={() => setGameState(GameState.ADMIN_DASHBOARD)} />;
  if (gameState === GameState.ADMIN_DASHBOARD) return <AdminDashboard questions={questions} setQuestions={setQuestions} timerDuration={timerDuration} setTimerDuration={setTimerDuration} onLogout={() => setGameState(GameState.SETUP)} onStartRound={handleAdminStartRound} />;

  const currentQuestion = questions[currentRoundIndex];

  // Fallback if team joins but round hasn't started
  if (!team || !currentQuestion) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
          <div className="p-10 text-center space-y-4">
              <Loader2 className="animate-spin h-8 w-8 text-indigo-500 mx-auto" />
              <p className="text-slate-500 font-mono text-sm uppercase">Waiting for the Host to open the market...</p>
          </div>
        </div>
      );
  }

  if (showLeaderboard) return <Leaderboard currentRound={currentQuestion.roundNumber} />;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors flex flex-col pb-10">
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 sticky top-0 z-30 flex justify-between items-center shadow-lg">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-indigo-600 flex items-center justify-center text-white font-black">{team.name.charAt(0)}</div>
                <h2 className="font-bold text-slate-900 dark:text-white truncate max-w-[120px]">₹{team.balance}</h2>
            </div>
            <div className="flex gap-1 items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500 animate-pulse'}`}></div>
                <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-2 text-slate-400 hover:text-indigo-500">{soundEnabled ? <Volume2 size={16}/> : <VolumeX size={16}/>}</button>
                <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 text-slate-400 hover:text-indigo-500">{isDarkMode ? <Sun size={16}/> : <Moon size={16} />}</button>
            </div>
        </header>

        <main className="flex-1 container mx-auto p-4 md:p-8 max-w-6xl">
            {showResult ? (
                <div className="space-y-6">
                    <ResultScreen question={currentQuestion} allocations={allocations} startBalance={startBalance} onNext={() => setShowResult(false)} isGameOver={team.balance === 0 || currentRoundIndex >= questions.length - 1} />
                    {marketCommentary && <div className="bg-indigo-600/10 border border-indigo-500/20 p-4 rounded-xl text-center italic text-indigo-400 text-xs animate-fade-in">"{marketCommentary}"</div>}
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col md:flex-row gap-6 items-center">
                        <div className="flex-1">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-500">Live Trading Round</span>
                            <h3 className="text-xl md:text-3xl font-display font-bold text-slate-900 dark:text-white mt-1 leading-tight">{currentQuestion.text}</h3>
                        </div>
                        <Timer key={`${currentRoundIndex}-${isTimerActive}`} duration={timerDuration} isActive={isTimerActive} onTimeUp={handleTimeUp} soundEnabled={soundEnabled} />
                    </div>
                    <AllocationBoard balance={team.balance} question={currentQuestion} allocations={allocations} setAllocations={setAllocations} isTimerActive={isTimerActive} hasSubmitted={hasSubmitted} onManualSubmit={() => setHasSubmitted(true)} />
                </div>
            )}
        </main>
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900 text-slate-700 py-1 text-[7px] font-mono text-center z-50 tracking-[0.4em] uppercase">Rupee Rumble • Market Connected</div>
    </div>
  );
};

export default App;