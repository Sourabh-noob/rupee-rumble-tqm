
import React, { useState, useEffect } from 'react';
import { Question } from '../types';
import { Save, LogOut, ChevronRight, PlayCircle, Clock, Eye, EyeOff, Loader2, Zap, LayoutGrid, MonitorPlay, Settings2 } from 'lucide-react';
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
      <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Loader2 className="animate-spin h-10 w-10 text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-100 dark:bg-slate-950 pb-12">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex justify-between items-center z-20 shadow-xl">
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                <Zap size={22} fill="currentColor" />
            </div>
            <div>
              <h1 className="text-lg font-display font-black text-slate-900 dark:text-white leading-none">COMMAND TERMINAL</h1>
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-1">Authorized Access Only</p>
            </div>
        </div>
        <div className="flex gap-4">
             <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
                <button onClick={() => setActiveTab('editor')} className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'editor' ? 'bg-white dark:bg-slate-700 shadow-lg text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                  <LayoutGrid size={14} /> Content Editor
                </button>
                <button onClick={() => setActiveTab('live')} className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'live' ? 'bg-white dark:bg-slate-700 shadow-lg text-green-600 dark:text-green-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                  <MonitorPlay size={14} /> Live Control
                </button>
             </div>
             <button onClick={onLogout} className="text-slate-400 hover:text-red-500 transition-colors p-2 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"><LogOut size={20} /></button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex">
        {activeTab === 'editor' && (
            <>
                <div className="w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 overflow-y-auto">
                    <div className="p-6 font-black text-[10px] text-slate-400 uppercase tracking-[0.3em]">Market Rounds</div>
                    {[1, 2, 3, 4, 5, 6].map(r => (
                        <button key={r} onClick={() => setSelectedRound(r)} className={`w-full text-left px-8 py-5 border-b border-slate-50 dark:border-slate-800/50 flex items-center justify-between transition-all ${selectedRound === r ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold border-r-4 border-r-indigo-500' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/30'}`}>
                          <span className="flex items-center gap-3">
                            <span className={`w-6 h-6 rounded flex items-center justify-center text-[10px] ${selectedRound === r ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-800'}`}>{r}</span>
                            Round {r}
                          </span>
                          <ChevronRight size={14} className={selectedRound === r ? 'opacity-100' : 'opacity-30'} />
                        </button>
                    ))}
                    <div className="p-6 mt-12">
                        <label className="text-[10px] font-black text-slate-400 mb-3 block uppercase tracking-[0.2em]">Global Timer</label>
                        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                            <Clock size={16} className="text-slate-400" />
                            <input type="number" value={timerDuration} onChange={(e) => setTimerDuration(parseInt(e.target.value) || 0)} className="bg-transparent w-full text-sm outline-none font-mono font-bold text-slate-900 dark:text-white" />
                            <span className="text-[10px] text-slate-400 font-bold">SEC</span>
                        </div>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-12 bg-slate-50 dark:bg-slate-950 relative">
                    <div className="max-w-4xl mx-auto space-y-8 pb-32">
                        <div className="flex justify-between items-baseline border-b border-slate-200 dark:border-slate-800 pb-4">
                            <h2 className="text-3xl font-display font-black dark:text-white tracking-tight">Round {selectedRound} Data</h2>
                            <span className="text-[10px] text-indigo-500 font-black uppercase tracking-widest">5 Active Sequences</span>
                        </div>
                        {roundQuestions.map((q) => (
                            <div key={q.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-xl hover:border-indigo-500/30 overflow-hidden">
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 px-8 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                                    <span className="font-mono text-[10px] font-black text-indigo-500 uppercase tracking-widest">PHASE 0{q.questionNumber}</span>
                                </div>
                                <div className="p-8 space-y-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Question Narrative</label>
                                        <textarea value={q.text} onChange={(e) => handleQuestionChange(q.id, 'text', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900 dark:text-white transition-all resize-none" rows={2} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-8">
                                        {(['A', 'B', 'C', 'D'] as const).map(opt => (
                                            <div key={opt} className="space-y-2">
                                                <label className={`text-[10px] font-black uppercase tracking-widest ${q.correctAnswer === opt ? 'text-green-500' : 'text-slate-400'}`}>Option {opt}</label>
                                                <input type="text" value={q.options[opt]} onChange={(e) => handleQuestionChange(q.id, 'options', e.target.value, opt)} className={`w-full bg-slate-50 dark:bg-slate-800/50 border rounded-xl p-4 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${q.correctAnswer === opt ? 'border-green-500/50 ring-2 ring-green-500/10' : 'border-slate-200 dark:border-slate-700'}`} />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-4 justify-end pt-6 border-t border-slate-100 dark:border-slate-800">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Set Settlement Answer:</label>
                                        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                                          {(['A', 'B', 'C', 'D'] as const).map(ans => (
                                            <button 
                                              key={ans}
                                              onClick={() => handleQuestionChange(q.id, 'correctAnswer', ans)}
                                              className={`w-10 h-10 rounded-lg text-xs font-black transition-all ${q.correctAnswer === ans ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                                            >
                                              {ans}
                                            </button>
                                          ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="fixed bottom-12 right-12 z-30">
                        <button onClick={handleSave} className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black px-12 py-5 rounded-2xl shadow-2xl shadow-indigo-600/40 transition-all transform hover:-translate-y-1 active:scale-95">
                            <Save size={20} /> SYNC DATABASE
                        </button>
                        {saveMessage && <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black py-2.5 px-6 rounded-full animate-bounce shadow-2xl border border-slate-700 uppercase tracking-widest">Update Successful</div>}
                    </div>
                </div>
            </>
        )}

        {activeTab === 'live' && (
            <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden">
                {/* Round Switcher Navigation */}
                <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 px-12 flex justify-between items-center shadow-sm">
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5, 6].map(r => (
                      <button 
                        key={r}
                        onClick={() => setLiveRound(r)}
                        className={`flex flex-col items-center justify-center w-20 h-20 rounded-2xl border-2 transition-all transform active:scale-95 ${liveRound === r ? 'bg-indigo-600 border-indigo-500 text-white shadow-xl shadow-indigo-500/30' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'}`}
                      >
                        <span className="text-[10px] font-black opacity-60 uppercase tracking-tighter mb-1">Round</span>
                        <span className="text-2xl font-black">{r}</span>
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Phase</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">Round {liveRound} Sequence</p>
                    </div>
                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-indigo-500">
                      <MonitorPlay size={24} />
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-12 flex gap-12">
                    {/* Left side: Grid of Questions */}
                    <div className="flex-1">
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                          {[1, 2, 3, 4, 5].map(qNum => {
                              const q = questions.find(q => q.roundNumber === liveRound && q.questionNumber === qNum);
                              return (
                                  <div 
                                      key={qNum}
                                      className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-2xl transition-all relative overflow-hidden"
                                  >
                                      <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                          <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/40 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-lg">
                                            {qNum}
                                          </div>
                                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phase {qNum}</span>
                                        </div>
                                        <div className="flex gap-1">
                                          {(['A', 'B', 'C', 'D'] as const).map(ans => (
                                            <span key={ans} className={`w-5 h-5 rounded flex items-center justify-center text-[8px] font-black ${q?.correctAnswer === ans ? 'bg-green-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                              {ans}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                      
                                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100 line-clamp-2 mb-6 min-h-[40px]">
                                        {q?.text || "Question text not loaded..."}
                                      </p>

                                      <button 
                                          onClick={() => onStartRound(liveRound, qNum)}
                                          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl transition-all transform active:scale-95 shadow-lg shadow-indigo-500/20"
                                      >
                                          <PlayCircle size={18} /> BROADCAST LIVE
                                      </button>
                                  </div>
                              );
                          })}
                          
                          {/* Round Summary Card */}
                          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl p-8 text-white flex flex-col justify-center items-center text-center shadow-2xl">
                             <Zap size={48} className="mb-4 text-indigo-200 animate-pulse" />
                             <h4 className="text-xl font-black mb-2">END OF ROUND {liveRound}</h4>
                             <p className="text-xs text-indigo-100 opacity-70 mb-6">Transition all users to the round summary screen before proceeding.</p>
                             <button className="bg-white text-indigo-600 px-8 py-3 rounded-xl font-black text-xs hover:bg-indigo-50 transition-colors uppercase tracking-widest shadow-xl">Push Settlement</button>
                          </div>
                      </div>
                    </div>

                    {/* Right side: Global Sidebar Controls */}
                    <div className="w-80 space-y-6">
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <div className="flex items-center gap-2 mb-6">
                              <Settings2 size={16} className="text-indigo-500" />
                              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Broadcast Controls</h3>
                            </div>
                            
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Market Rankings</p>
                                <button 
                                    onClick={toggleLeaderboard} 
                                    className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black shadow-lg transition-all transform active:scale-95 ${isLeaderboardVisible ? 'bg-amber-500 text-white ring-4 ring-amber-500/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                                >
                                    {isLeaderboardVisible ? <><EyeOff size={18} /> HIDE STANDINGS</> : <><Eye size={18} /> SHOW STANDINGS</>}
                                </button>
                              </div>

                              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Session Protocol</p>
                                <button className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 font-black text-xs border border-dashed border-slate-300 dark:border-slate-700 cursor-not-allowed">
                                  RESET GLOBAL STATE
                                </button>
                              </div>
                            </div>
                        </div>

                        <div className="bg-indigo-600/5 dark:bg-indigo-500/5 p-8 rounded-3xl border border-indigo-200/50 dark:border-indigo-800/50">
                          <div className="flex items-center gap-2 mb-4 text-indigo-600 dark:text-indigo-400">
                             <MonitorPlay size={18} />
                             <span className="text-[10px] font-black uppercase tracking-[0.2em]">Telemetry</span>
                          </div>
                          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                            Currently streaming live updates to connected terminals. All launches are final. Ensure settlement answers are verified before broadcast.
                          </p>
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
