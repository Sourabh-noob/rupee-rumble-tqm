
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
        contents: `Host reaction: Team "${currTeam.name}" finished Round ${currQ.roundNumber} with ₹${currTeam.balance}. The answer was ${currQ.correctAnswer}. One snappy sentence for a high-stakes trading game.`,
      });
      setMarketCommentary(response.text || "");
    } catch (e) {
      console.error("AI Commentary failed:", e);
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
    
    // Sync to Supabase
    supabase.from('teams').upsert({
      id: updatedTeam.id,
      name: updatedTeam.name,
      members: updatedTeam.members,
      balance: updatedTeam.balance,
      history: updatedTeam.history
    }).then(({ error }) => {
      if (error) console.error("Leaderboard sync failed:", error.message);
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
  }, []);

  const handleJoin = async (newTeam: Team) => {
    return new Promise<void>(async (resolve, reject) => {
      try {
        const { error } = await supabase.from('teams').upsert({
          id: newTeam.id,
          name: newTeam.name,
          members: newTeam.members,
          balance: newTeam.balance,
          history: newTeam.history
        });
        
        if (error) {
          if (error.message.includes("column") || error.message.includes("cache")) {
             alert(`DATABASE SCHEMA ERROR: The column "${error.message.split('"')[1]}" could not be found. 
             
Please log in as Director and go to the "Setup" tab to fix your Supabase tables.`);
          } else {
             alert("Failed to join exchange: " + error.message);
          }
          reject(error);
          return;
        }

        setTeam(newTeam);
        setGameState(GameState.PLAYING);
        setStartBalance(newTeam.balance);
        resolve();
      } catch (err: any) {
        console.warn("Could not register team in central database.", err.message);
        reject(err);
      }
    });
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

  useEffect(() => {
    const initApp = async () => {
      try {
        // 1. Try to fetch questions from Supabase first
        const { data: dbQs, error: qError } = await supabase.from('questions').select('*');
        
        let finalQs: Question[] = [];
        
        if (dbQs && dbQs.length > 0) {
          // Map DB format to local interface
          finalQs = dbQs.map(q => ({
            id: q.id,
            roundNumber: q.round_number,
            questionNumber: q.question_number,
            text: q.text,
            options: q.options,
            correctAnswer: q.correct_answer
          }));
          console.log("Loaded questions from database.");
        } else {
          // 2. Fallback to hardcoded questions if DB is empty or fails
          console.warn("No questions found in database. Using local defaults.");
          finalQs = await generateGameQuestions();
          
          // Optionally seed the database if it's the first run (silent)
          if (!qError) {
             const seed = finalQs.map(q => ({
                id: q.id,
                round_number: q.roundNumber,
                question_number: q.questionNumber,
                text: q.text,
                options: q.options,
                correct_answer: q.correctAnswer
             }));
             supabase.from('questions').upsert(seed).then();
          }
        }
        
        setQuestions(finalQs);
        
        // 3. Load Remote Game State
        const { data: stateData } = await supabase
          .from('game_state')
          .select('*')
          .eq('id', GAME_STATE_ID)
          .maybeSingle(); 
        
        if (stateData) {
            setCurrentRoundIndex(stateData.current_round_index || 0);
            setIsTimerActive(!!stateData.is_timer_active);
            setShowResult(!!stateData.show_result);
            setShowLeaderboard(!!stateData.show_leaderboard);
            setTimerDuration(stateData.timer_duration || 40);
        }
      } catch (err: any) {
        console.error("Initialization Critical Error:", err);
        setInitError(err.message || "Could not initialize market data.");
      } finally {
        setIsAppLoading(false);
      }
    };

    initApp();

    const channel = supabase.channel('room-1')
        .on('postgres_changes', { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'game_state', 
            filter: `id=eq.${GAME_STATE_ID}` 
        }, (payload) => {
            const newState = payload.new as RemoteGameState;
            if (!newState) return;
            
            if (newState.current_round_index !== undefined) {
              setCurrentRoundIndex(prev => {
                if (newState.current_round_index !== prev) {
                    setAllocations({ A: 0, B: 0, C: 0, D: 0 });
                    setHasSubmitted(false);
                    setMarketCommentary("");
                    setShowResult(false);
                }
                return newState.current_round_index;
              });
            }

            if (newState.is_timer_active !== undefined) setIsTimerActive(!!newState.is_timer_active);
            if (newState.show_result !== undefined) setShowResult(!!newState.show_result);
            if (newState.show_leaderboard !== undefined) setShowLeaderboard(!!newState.show_leaderboard);
            if (newState.timer_duration !== undefined) setTimerDuration(newState.timer_duration);
        })
        .subscribe((status) => {
          setIsConnected(status === 'SUBSCRIBED');
        });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('class'); // ensure tailwind mode
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  if (isAppLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900">
      <Loader2 className="animate-spin h-12 w-12 text-indigo-500 mb-4" />
      <p className="text-slate-500 font-mono text-[10px] uppercase tracking-[0.3em]">Connecting to Exchange...</p>
    </div>
  );

  if (initError) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-6 text-center">
      <AlertCircle className="h-16 w-16 text-red-500 mb-6" />
      <h2 className="text-2xl font-display font-bold mb-2 text-white">CONNECTION TERMINATED</h2>
      <p className="text-slate-400 mb-8 max-w-sm mx-auto font-mono text-xs">{initError}</p>
      <button onClick={() => window.location.reload()} className="bg-white text-black font-black px-10 py-4 rounded-full">REBOOT</button>
    </div>
  );

  if (gameState === GameState.SETUP) return <EntryScreen onJoin={handleJoin} onAdminLogin={() => setGameState(GameState.ADMIN_DASHBOARD)} />;
  if (gameState === GameState.ADMIN_DASHBOARD) return <AdminDashboard questions={questions} setQuestions={setQuestions} timerDuration={timerDuration} setTimerDuration={setTimerDuration} onLogout={() => setGameState(GameState.SETUP)} onStartRound={handleAdminStartRound} />;

  const currentQuestion = questions[currentRoundIndex];

  if (showLeaderboard) return <Leaderboard currentRound={currentQuestion?.roundNumber || 1} />;

  if (!team || !currentQuestion) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900">
          <Loader2 className="animate-spin h-8 w-8 text-slate-700 mb-6" />
          <p className="text-slate-500 font-mono text-[10px] uppercase tracking-[0.4em] animate-pulse">Waiting for Floor Manager...</p>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors flex flex-col pb-10">
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 sticky top-0 z-40 flex justify-between items-center shadow-xl">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black">{team.name ? team.name.charAt(0) : '?'}</div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter leading-none mb-1">Portfolio Value</span>
                  <h2 className="font-mono font-black text-slate-900 dark:text-white leading-none">₹{team.balance || 0}</h2>
                </div>
            </div>
            <div className="flex gap-2 items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500 animate-pulse'}`}></div>
                <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-2 text-slate-400 hover:text-indigo-500 transition-colors bg-slate-100 dark:bg-slate-800 rounded-lg">{soundEnabled ? <Volume2 size={16}/> : <VolumeX size={16}/>}</button>
                <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 text-slate-400 hover:text-indigo-500 transition-colors bg-slate-100 dark:bg-slate-800 rounded-lg">{isDarkMode ? <Sun size={16}/> : <Moon size={16} />}</button>
            </div>
        </header>

        <main className="flex-1 container mx-auto p-4 md:p-8 max-w-6xl">
            {showResult ? (
                <div className="space-y-6">
                    <ResultScreen question={currentQuestion} allocations={allocations} startBalance={startBalance} onNext={() => setShowResult(false)} isGameOver={team.balance === 0 || currentRoundIndex >= questions.length - 1} />
                    {marketCommentary && (
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl text-center shadow-lg animate-fade-in flex items-center justify-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0">AI</div>
                        <p className="italic text-slate-600 dark:text-slate-300 text-sm font-medium">"{marketCommentary}"</p>
                      </div>
                    )}
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col md:flex-row gap-8 items-center transition-all">
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-indigo-500 text-white text-[10px] font-black rounded uppercase">Round {currentQuestion.roundNumber}</span>
                              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Live Trading Sequence</span>
                            </div>
                            <h3 className="text-xl md:text-4xl font-display font-bold text-slate-900 dark:text-white leading-tight">{currentQuestion.text}</h3>
                        </div>
                        <Timer key={`${currentRoundIndex}-${isTimerActive}`} duration={timerDuration} isActive={isTimerActive} onTimeUp={handleTimeUp} soundEnabled={soundEnabled} />
                    </div>
                    <AllocationBoard balance={team.balance} question={currentQuestion} allocations={allocations} setAllocations={setAllocations} isTimerActive={isTimerActive} hasSubmitted={hasSubmitted} onManualSubmit={() => setHasSubmitted(true)} />
                </div>
            )}
        </main>
        <footer className="fixed bottom-0 left-0 right-0 bg-slate-900 text-slate-600 py-1.5 text-[8px] font-mono text-center z-50 tracking-[0.5em] uppercase border-t border-slate-800">
          Rupee Rumble Digital Exchange • Secure Protocol v2.5 • All Trades Final
        </footer>
    </div>
  );
};

export default App;
