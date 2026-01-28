
import React, { useState, useEffect } from 'react';
import { Question } from '../types';
import { Save, LogOut, ChevronRight, PlayCircle, Clock, Eye, EyeOff, Loader2, Zap, LayoutGrid, MonitorPlay, Settings2, RefreshCw, Radio, Trash2, AlertTriangle } from 'lucide-react';
import { supabase, GAME_STATE_ID } from '../services/supabaseService';

interface AdminDashboardProps {
  questions: Question[];
  setQuestions: (q: Question[]) => void;
  timerDuration: number;
  setTimerDuration: (d: number) => void;
  onLogout: () => void;
  onStartRound: (roundNum: number, questionNum: number) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  questions, 
  setQuestions, 
  timerDuration,
  setTimerDuration,
  onLogout,
  onStartRound
}) => {
  const [activeTab, setActiveTab] = useState<'editor' | 'live'>('editor');
  const [selectedRound, setSelectedRound] = useState(1);
  const [localQuestions, setLocalQuestions] = useState<Question[]>(JSON.parse(JSON.stringify(questions)));
  const [saveMessage, setSaveMessage] = useState('');
  const [liveRound, setLiveRound] = useState(1);
  const [isLeaderboardVisible, setIsLeaderboardVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    const fetchLeaderboardStatus = async () => {
      try {
        const { data, error } = await supabase.from('game_state').select('show_leaderboard').eq('id', GAME_STATE_ID).maybeSingle();
        if (data) setIsLeaderboardVisible(data.show_leaderboard);
      } catch (err) {
        console.error("Dashboard init error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLeaderboardStatus();
  }, []);

  const toggleLeaderboard = async () => {
    const newVal = !isLeaderboardVisible;
    const { error } = await supabase.from('game_state').update({ show_leaderboard: newVal }).eq('id', GAME_STATE_ID);
    
    if (error) {
        console.error("Failed to update leaderboard:", error);
        alert(`Error: ${error.message}`);
        return;
    }
    setIsLeaderboardVisible(newVal);
  };

  const handleResetSession = async () => {
    setSyncing(true);
    try {
      // Clear all teams from the database
      const { error } = await supabase.from('teams').delete().neq('id', '0'); // Delete all rows
      if (error) throw error;
      
      // Also reset game state to round 1 index 0
      await supabase.from('game_state').update({ 
        current_round_index: 0, 
        is_timer_active: false,
        show_result: false,
        show_leaderboard: false
      }).eq('id', GAME_STATE_ID);
      
      alert("Session Reset: All team data has been wiped for a new round.");
      setShowResetConfirm(false);
    } catch (err: any) {
      alert("Reset failed: " + err.message);
    } finally {
      setSyncing(false);
    }
  };

  const forceRefresh = async () => {
    setSyncing(true);
    await supabase.from('game_state').select('id').eq('id', GAME_STATE_ID);
    setTimeout(() => setSyncing(false), 800);
  };

  const handleQuestionChange = (id: string, field: keyof Question | 'options', value: any, optionKey?: 'A'|'B'|'C'|'D') => {
    setLocalQuestions(prev => prev.map(q => {
        if (q.id !== id) return q;
        if (field === 'options' && optionKey) {
            return { ...q, options: { ...q.options, [optionKey]: value } };
        }
        return { ...q, [field]: value };
    }));
  };

  const handleSave = () => {
    setQuestions(localQuestions);
    setSaveMessage('Saved!');
    setTimeout(() => setSaveMessage(''), 2000);
  };

  const roundQuestions = localQuestions.filter(q => q.roundNumber === selectedRound).sort((a,b) => a.questionNumber - b.questionNumber);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="animate-spin h-10 w-10 text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-100 dark:bg-slate-950">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-3 px-6 flex justify-between items-center z-30 shadow-xl">
        <div className="flex items-center gap-4">
            <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg">
                <Zap size={18} fill="currentColor" />
            </div>
            <div>
              <h1 className="text-sm font-black text-slate-900 dark:text-white leading-none uppercase tracking-tighter">Director Console</h1>
              <div className="flex items-center gap-1.5 mt-1">
                 <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                 <p className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">Server: Online</p>
              </div>
            </div>
        </div>
        
        <div className="flex gap-4 items-center">
             <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
                <button onClick={() => setActiveTab('editor')} className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all ${activeTab === 'editor' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`}>
                  Editor
                </button>
                <button onClick={() => setActiveTab('live')} className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all ${activeTab === 'live' ? 'bg-white dark:bg-slate-700 shadow text-green-600 dark:text-green-400' : 'text-slate-500'}`}>
                  Live
                </button>
             </div>
             <button onClick={onLogout} className="text-slate-400 hover:text-red-500 transition-colors p-2 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"><LogOut size={16} /></button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex">
        {activeTab === 'editor' && (
            <>
                <div className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 overflow-y-auto">
                    <div className="p-5 font-black text-[9px] text-slate-400 uppercase tracking-[0.3em]">Market Rounds</div>
                    {[1, 2, 3, 4, 5, 6].map(r => (
                        <button key={r} onClick={() => setSelectedRound(r)} className={`w-full text-left px-6 py-4 border-b border-slate-50 dark:border-slate-800/50 flex items-center justify-between transition-all ${selectedRound === r ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold border-r-4 border-r-indigo-500' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/30'}`}>
                          <span className="text-xs font-bold">Round {r}</span>
                          <ChevronRight size={12} className={selectedRound === r ? 'opacity-100' : 'opacity-30'} />
                        </button>
                    ))}
                    <div className="p-6 mt-8">
                        <label className="text-[9px] font-black text-slate-400 mb-2 block uppercase tracking-widest">Round Timer</label>
                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                            <Clock size={14} className="text-slate-400" />
                            <input type="number" value={timerDuration} onChange={(e) => setTimerDuration(parseInt(e.target.value) || 0)} className="bg-transparent w-full text-xs font-mono font-bold text-slate-900 dark:text-white outline-none" />
                        </div>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-8 bg-slate-50 dark:bg-slate-950 relative">
                    <div className="max-w-3xl mx-auto space-y-6 pb-24">
                        <div className="flex justify-between items-baseline border-b border-slate-200 dark:border-slate-800 pb-4">
                            <h2 className="text-xl font-black dark:text-white tracking-tight">Round {selectedRound} Configuration</h2>
                        </div>
                        {roundQuestions.map((q) => (
                            <div key={q.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 px-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                                    <span className="font-mono text-[9px] font-black text-indigo-500 uppercase tracking-widest">Question {q.questionNumber}</span>
                                </div>
                                <div className="p-6 space-y-4">
                                    <textarea value={q.text} onChange={(e) => handleQuestionChange(q.id, 'text', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900 dark:text-white transition-all resize-none" rows={2} />
                                    <div className="grid grid-cols-2 gap-4">
                                        {(['A', 'B', 'C', 'D'] as const).map(opt => (
                                            <div key={opt} className="flex items-center gap-2">
                                                <span className={`text-[10px] font-black ${q.correctAnswer === opt ? 'text-green-500' : 'text-slate-400'}`}>{opt}</span>
                                                <input type="text" value={q.options[opt]} onChange={(e) => handleQuestionChange(q.id, 'options', e.target.value, opt)} className={`w-full bg-slate-50 dark:bg-slate-800/50 border rounded-lg p-2 text-[10px] font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all ${q.correctAnswer === opt ? 'border-green-500/50' : 'border-slate-200 dark:border-slate-700'}`} />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-2 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Correct Answer:</span>
                                        <div className="flex gap-1">
                                          {(['A', 'B', 'C', 'D'] as const).map(ans => (
                                            <button key={ans} onClick={() => handleQuestionChange(q.id, 'correctAnswer', ans)} className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${q.correctAnswer === ans ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>{ans}</button>
                                          ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="fixed bottom-8 right-8 z-30">
                        <button onClick={handleSave} className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black px-10 py-4 rounded-xl shadow-2xl shadow-indigo-600/40 transition-all active:scale-95">
                            <Save size={18} /> SYNC CHANGES
                        </button>
                    </div>
                </div>
            </>
        )}

        {activeTab === 'live' && (
            <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden">
                <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-3 px-6 flex justify-between items-center shadow-sm">
                  <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                    {[1, 2, 3, 4, 5, 6].map(r => (
                      <button 
                        key={r}
                        onClick={() => setLiveRound(r)}
                        className={`flex flex-col items-center justify-center min-w-[64px] h-14 rounded-xl border transition-all active:scale-95 ${liveRound === r ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:border-slate-300'}`}
                      >
                        <span className="text-[8px] font-black uppercase tracking-tighter opacity-70">Round</span>
                        <span className="text-lg font-black leading-none">{r}</span>
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-4">
                    <button onClick={forceRefresh} className={`flex items-center gap-2 text-[10px] font-black bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-indigo-500 transition-all ${syncing ? 'opacity-50' : ''}`}>
                      <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
                      {syncing ? 'SYNCING...' : 'FORCE REFRESH'}
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col xl:flex-row p-6 gap-6">
                    {/* Main Sequence Grid */}
                    <div className="flex-1 overflow-y-auto space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Radio size={14} className="text-red-500" />
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white">Active Round {liveRound} Sequence</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {[1, 2, 3, 4, 5].map(qNum => {
                              const q = questions.find(q => q.roundNumber === liveRound && q.questionNumber === qNum);
                              return (
                                  <div key={qNum} className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between">
                                      <div>
                                        <div className="flex items-center justify-between mb-3">
                                          <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-900/40 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-sm">{qNum}</div>
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Phase {qNum}</span>
                                          </div>
                                          <span className="w-6 h-6 rounded bg-green-500 text-white text-[9px] font-black flex items-center justify-center shadow-sm" title={`Correct: ${q?.correctAnswer}`}>{q?.correctAnswer}</span>
                                        </div>
                                        <p className="text-[11px] font-bold text-slate-800 dark:text-slate-100 line-clamp-2 mb-5 h-8 leading-tight">
                                          {q?.text || "..."}
                                        </p>
                                      </div>
                                      <button onClick={() => onStartRound(liveRound, qNum)} className="w-full flex items-center justify-center gap-2 bg-slate-900 dark:bg-indigo-600 hover:bg-indigo-500 text-white font-black py-2.5 rounded-xl text-[10px] transition-all transform active:scale-95 shadow-lg">
                                          <PlayCircle size={14} /> LAUNCH PHASE
                                      </button>
                                  </div>
                              );
                          })}
                          
                          <div className="bg-indigo-600 rounded-2xl p-5 text-white flex flex-col justify-center items-center text-center shadow-lg group relative overflow-hidden">
                             <div className="absolute top-0 left-0 w-full h-1 bg-white/20" />
                             <h4 className="text-xs font-black mb-1">ROUND SETTLEMENT</h4>
                             <p className="text-[9px] opacity-70 mb-4 px-2">Finalize current round data for all users.</p>
                             <button className="w-full bg-white text-indigo-600 py-2.5 rounded-xl text-[10px] font-black shadow-lg active:scale-95">PUSH SUMMARY</button>
                          </div>
                      </div>
                    </div>

                    {/* Sidebar Control Column */}
                    <div className="w-full xl:w-72 space-y-4">
                        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                              <Settings2 size={12} /> Global View Overlays
                            </h3>
                            <div className="space-y-3">
                              <button 
                                  onClick={toggleLeaderboard} 
                                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-black text-[10px] transition-all transform active:scale-95 shadow-md ${isLeaderboardVisible ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900'}`}
                              >
                                  {isLeaderboardVisible ? <><EyeOff size={14} /> HIDE RANKINGS</> : <><Eye size={14} /> SHOW RANKINGS</>}
                              </button>

                              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                {showResetConfirm ? (
                                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-500/50 space-y-3">
                                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-[10px] uppercase">
                                      <AlertTriangle size={14} /> Critical Action
                                    </div>
                                    <p className="text-[9px] text-red-800 dark:text-red-300">This will wipe all team rankings and entrants for a new session.</p>
                                    <div className="flex gap-2">
                                      <button onClick={handleResetSession} className="flex-1 bg-red-600 text-white text-[9px] font-black py-2 rounded-lg hover:bg-red-700 transition-colors">WIPE ALL</button>
                                      <button onClick={() => setShowResetConfirm(false)} className="flex-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[9px] font-black py-2 rounded-lg">CANCEL</button>
                                    </div>
                                  </div>
                                ) : (
                                  <button 
                                      onClick={() => setShowResetConfirm(true)} 
                                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-black text-[10px] bg-red-100/50 dark:bg-red-900/10 text-red-600 hover:bg-red-600 hover:text-white transition-all transform active:scale-95"
                                  >
                                      <Trash2 size={14} /> RESET ALL ENTRANTS
                                  </button>
                                )}
                              </div>
                            </div>
                        </div>

                        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 text-indigo-400">
                          <div className="flex items-center gap-2 mb-3">
                             <MonitorPlay size={14} />
                             <span className="text-[9px] font-black uppercase tracking-widest">Live Telemetry</span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-mono border-b border-white/5 pb-1">
                              <span className="opacity-50">Latency</span>
                              <span className="text-green-500">24ms</span>
                            </div>
                            <div className="flex justify-between text-[10px] font-mono border-b border-white/5 pb-1">
                              <span className="opacity-50">Connected</span>
                              <span className="text-indigo-400">Stable</span>
                            </div>
                            <p className="text-[9px] leading-relaxed mt-4 opacity-70 italic">
                              * All live broadcasts instantly reset participant terminals to the selected phase.
                            </p>
                          </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
