import React, { useState, useEffect } from 'react';
import { GameState, Team, Question, Allocations } from './types';
import EntryScreen from './components/EntryScreen';
import GameGrid from './components/GameGrid';
import AdminDashboard from './components/AdminDashboard';
import FinalStandings from './components/FinalStandings'; // Reusing existing, though logic may need tweak for single team vs multi.
import { generateGameQuestions } from './services/geminiService';
import { Sun, Moon, Users, Play } from 'lucide-react';

const TEAM_COUNT = 6;
const MAX_ROUNDS = 5;

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.SETUP);
  
  // Game Data
  const [teams, setTeams] = useState<Team[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  
  // Cursor
  const [activeRound, setActiveRound] = useState(1);
  const [activeQuestionNumber, setActiveQuestionNumber] = useState(1);
  
  // Live State
  const [teamAllocations, setTeamAllocations] = useState<Record<string, Allocations>>({});
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [timerDuration, setTimerDuration] = useState(30);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);

  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('theme');
        if (saved) return saved === 'dark';
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  useEffect(() => {
    if (isDarkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // Initial Load
  useEffect(() => {
    generateGameQuestions().then(qs => setQuestions(qs));
  }, []);

  // Initialize Default Teams
  const initializeTeams = (customNames?: string[]) => {
    const newTeams: Team[] = Array.from({ length: TEAM_COUNT }).map((_, i) => ({
        id: `team-${i + 1}`,
        name: customNames ? customNames[i] : `Team ${i + 1}`,
        members: 'Members',
        balance: 1000,
        history: []
    }));
    setTeams(newTeams);
    
    // Initialize allocations for them
    const initialAlloc: Record<string, Allocations> = {};
    newTeams.forEach(t => { initialAlloc[t.id] = { A: 0, B: 0, C: 0, D: 0 }; });
    setTeamAllocations(initialAlloc);
    
    setGameState(GameState.ADMIN_DASHBOARD);
  };

  // --- Game Flow Controllers ---

  const handleStartRound = (roundNum: number, questionNum: number) => {
    setActiveRound(roundNum);
    setActiveQuestionNumber(questionNum);
    setIsTimerActive(false);
    setIsAnswerRevealed(false);
    
    // Reset allocations for new question
    const resetAlloc: Record<string, Allocations> = {};
    teams.forEach(t => { resetAlloc[t.id] = { A: 0, B: 0, C: 0, D: 0 }; });
    setTeamAllocations(resetAlloc);
    
    setGameState(GameState.PLAYING);
  };

  const handleNextQuestion = () => {
    const nextQ = activeQuestionNumber + 1;
    if (nextQ > 5) {
        // Round Over -> Return to Admin? Or Auto next round?
        // Let's go back to Admin Dashboard to select next round or review.
        setGameState(GameState.ADMIN_DASHBOARD);
    } else {
        handleStartRound(activeRound, nextQ);
    }
  };

  const handleTimerStart = () => {
    setIsTimerActive(true);
    setIsAnswerRevealed(false);
  };

  const handleTimerStop = () => {
    setIsTimerActive(false);
  };

  const handleTimeUp = () => {
    setIsTimerActive(false);
    // Auto reveal? Or wait for facilitator?
    // Let's wait for facilitator to hit reveal.
  };

  const handleRevealAnswer = () => {
    setIsAnswerRevealed(true);
    setIsTimerActive(false); // Ensure locked

    // Calculate Results
    const currentQ = questions.find(q => q.roundNumber === activeRound && q.questionNumber === activeQuestionNumber);
    if (!currentQ) return;

    setTeams(prevTeams => prevTeams.map(team => {
        const alloc = teamAllocations[team.id] || {A:0,B:0,C:0,D:0};
        const kept = alloc[currentQ.correctAnswer];
        
        // Add history if needed, for now just update balance
        return {
            ...team,
            balance: kept,
            history: [...team.history, {
                roundNumber: activeRound,
                questionNumber: activeQuestionNumber,
                startBalance: team.balance,
                allocations: alloc,
                correctAnswer: currentQ.correctAnswer,
                endBalance: kept
            }]
        };
    }));
  };

  const updateTeamAllocation = (teamId: string, allocs: Allocations) => {
    setTeamAllocations(prev => ({
        ...prev,
        [teamId]: allocs
    }));
  };

  // --- View Rendering ---

  // Setup Screen (Replacement for EntryScreen)
  if (gameState === GameState.SETUP) {
      return (
          <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
              <div className="max-w-md w-full bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 text-center space-y-8">
                  <div>
                      <h1 className="text-4xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-yellow-600 mb-2">RUPEE RUMBLE</h1>
                      <p className="text-slate-500">Event Setup</p>
                  </div>
                  
                  <div className="space-y-4">
                      <div className="p-4 bg-slate-100 dark:bg-slate-900 rounded-lg flex items-center justify-between">
                          <span className="text-slate-600 dark:text-slate-400 font-bold flex items-center gap-2"><Users size={16}/> Team Count</span>
                          <span className="font-mono font-bold text-xl dark:text-white">6</span>
                      </div>
                      <button 
                        onClick={() => initializeTeams()}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2"
                      >
                        <Play size={20} /> Initialize Event
                      </button>
                      <button 
                        onClick={() => setGameState(GameState.ADMIN_DASHBOARD)} // Backdoor if needed
                        className="text-xs text-slate-400 hover:text-slate-300 underline"
                      >
                        Skip to Dashboard (Dev)
                      </button>
                  </div>
              </div>
          </div>
      )
  }

  if (gameState === GameState.ADMIN_DASHBOARD) {
      return (
          <AdminDashboard
            questions={questions}
            setQuestions={setQuestions}
            timerDuration={timerDuration}
            setTimerDuration={setTimerDuration}
            onLogout={() => setGameState(GameState.SETUP)}
            onStartRound={handleStartRound}
          />
      );
  }

  // PLAYING STATE (The Grid)
  const currentQ = questions.find(q => q.roundNumber === activeRound && q.questionNumber === activeQuestionNumber);

  if (gameState === GameState.PLAYING && currentQ) {
      return (
          <div className="h-screen flex flex-col">
              <div className="absolute top-4 right-4 z-50">
                <button onClick={toggleTheme} className="p-2 bg-white/10 backdrop-blur rounded-full text-white/50 hover:text-white">
                    {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
              </div>
              <GameGrid
                  teams={teams}
                  question={currentQ}
                  roundNumber={activeRound}
                  questionNumber={activeQuestionNumber}
                  timerDuration={timerDuration}
                  isTimerActive={isTimerActive}
                  onTimerStart={handleTimerStart}
                  onTimerStop={handleTimerStop}
                  onTimeUp={handleTimeUp}
                  teamAllocations={teamAllocations}
                  onUpdateTeamAllocations={updateTeamAllocation}
                  onNextQuestion={handleNextQuestion}
                  onRevealAnswer={handleRevealAnswer}
                  isAnswerRevealed={isAnswerRevealed}
              />
          </div>
      );
  }

  return <div>Loading...</div>;
};

export default App;
