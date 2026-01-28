
import React, { useState, useEffect } from 'react';
import { Question } from '../types';
import { Save, LogOut, ChevronRight, PlayCircle, Clock, Eye, EyeOff, Loader2, Zap } from 'lucide-react';
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
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-100 dark:bg-slate-900 pb-12">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 flex justify-between items-center z-10 shadow-sm">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                <Zap size={20} fill="currentColor" />
            </div>
            <h1 className="text-xl font-display font-bold text-slate-900 dark:text-white">Director Panel</h1>
        </div>
        <div className="flex gap-4">
             <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-1">
                <button onClick={() => setActiveTab('editor')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab === 'editor' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`}>Editor</button>
                <button onClick={() => setActiveTab('live')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab === 'live' ? 'bg-white dark:bg-slate-700 shadow text-green-600 dark:text-green-400' : 'text-slate-500'}`}>Live Controls</button>
             </div>
             <button onClick={onLogout} className="text-slate-400 hover:text-red-500 transition-colors p-2"><LogOut size={20} /></button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex">
        {activeTab === 'editor' && (
            <>
                <div className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 overflow-y-auto">
                    <div className="p-4 font-bold text-[10px] text-slate-400 uppercase tracking-[0.2em]">Navigation</div>
                    {[1, 2, 3, 4, 5, 6].map(r => (
                        <button key={r} onClick={() => setSelectedRound(r)} className={`w-full text-left px-6 py-4 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between transition-colors ${selectedRound === r ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-bold border-r-4 border-r-indigo-500' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>Round {r} <ChevronRight size={16} /></button>
                    ))}
                    <div className="p-4 mt-8 border-t border-slate-200 dark:border-slate-700">
                        <label className="text-[10px] font-bold text-slate-500 mb-2 block uppercase tracking-wider">Global Timer (sec)</label>
                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-3">
                            <Clock size={16} className="text-slate-400" />
                            <input type="number" value={timerDuration} onChange={(e) => setTimerDuration(parseInt(e.target.value) || 0)} className="bg-transparent w-full text-sm outline-none font-mono text-slate-900 dark:text-white" />
                        </div>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-8 relative">
                    <div className="max-w-4xl mx-auto space-y-8 pb-20">
                        <div className="flex justify-between items-end">
                            <h2 className="text-3xl font-display font-bold dark:text-white">Content: Round {selectedRound}</h2>
                            <p className="text-sm text-slate-500 font-mono">5 Questions Configured</p>
                        </div>
                        {roundQuestions.map((q) => (
                            <div key={q.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-3 px-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                                    <span className="font-mono text-[10px] font-black text-indigo-500 uppercase tracking-widest">PHASE {q.questionNumber}</span>
                                </div>
                                <div className="p-6 space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Question Prompt</label>
                                        <textarea value={q.text} onChange={(e) => handleQuestionChange(q.id, 'text', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900 dark:text-white transition-all" rows={2} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        {(['A', 'B', 'C', 'D'] as const).map(opt => (
                                            <div key={opt} className="space-y-1">
                                                <label className={`text-[10px] font-bold uppercase ${q.correctAnswer === opt ? 'text-green-600' : 'text-slate-400'}`}>Option {opt}</label>
                                                <div className="flex gap-2 items-center">
                                                    <input type="text" value={q.options[opt]} onChange={(e) => handleQuestionChange(q.id, 'options', e.target.value, opt)} className={`flex-1 bg-slate-50 dark:bg-slate-900 border rounded-lg p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 ${q.correctAnswer === opt ? 'border-green-500/50 ring-1 ring-green-500/20' : 'border-slate-200 dark:border-slate-700'}`} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-700">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Verified Answer:</label>
                                        <select value={q.correctAnswer} onChange={(e) => handleQuestionChange(q.id, 'correctAnswer', e.target.value)} className="bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-800 rounded-lg px-4 py-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 focus:outline-none">
                                            <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="fixed bottom-8 right-8">
                        <button onClick={handleSave} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-10 py-4 rounded-2xl shadow-2xl transition-all transform hover:-translate-y-1 active:scale-95">
                            <Save size={20} /> SYNC CHANGES
                        </button>
                        {saveMessage && <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs py-2 px-4 rounded-lg animate-bounce shadow-xl">✓ {saveMessage}</div>}
                    </div>
                </div>
            </>
        )}

        {activeTab === 'live' && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-950 overflow-y-auto">
                <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-8">
                    
                    {/* Left: Round Selector */}
                    <div className="md:col-span-1 space-y-4">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Select Active Round</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {[1, 2, 3, 4, 5, 6].map(r => (
                                    <button 
                                        key={r} 
                                        onClick={() => setLiveRound(r)} 
                                        className={`py-4 rounded-xl font-bold text-lg border-2 transition-all transform active:scale-95 ${liveRound === r ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 shadow-inner' : 'border-slate-100 dark:border-slate-700 text-slate-400 hover:border-slate-200'}`}
                                    >
                                        R{r}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Global Overlays</h3>
                            <button 
                                onClick={toggleLeaderboard} 
                                className={`w-full flex items-center justify-center gap-3 py-4 rounded-xl font-bold shadow-lg transition-all transform active:scale-95 ${isLeaderboardVisible ? 'bg-amber-500 text-white ring-4 ring-amber-500/20' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                            >
                                {isLeaderboardVisible ? <><EyeOff size={20} /> HIDE RANKINGS</> : <><Eye size={20} /> SHOW RANKINGS</>}
                            </button>
                        </div>
                    </div>

                    {/* Right: Question Launchers */}
                    <div className="md:col-span-2 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
                        <div className="p-8 text-center border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30">
                            <span className="inline-block px-3 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-[10px] font-black rounded-full mb-2 tracking-widest">MARKET COMMAND</span>
                            <h2 className="text-3xl font-display font-bold text-slate-900 dark:text-white">Round {liveRound} Sequence</h2>
                        </div>
                        
                        <div className="p-8 space-y-6">
                            <p className="text-sm text-slate-500 text-center px-8">Click a question to push it live to all participants. This will reset their current allocation phase.</p>
                            
                            <div className="grid grid-cols-1 gap-4">
                                {[1, 2, 3, 4, 5].map(qNum => {
                                    const qText = questions.find(q => q.roundNumber === liveRound && q.questionNumber === qNum)?.text || "...";
                                    return (
                                        <button 
                                            key={qNum}
                                            onClick={() => onStartRound(liveRound, qNum)}
                                            className="group relative flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all text-left"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center shadow-sm group-hover:border-indigo-300 transition-colors">
                                                    <span className="text-[10px] font-black text-slate-400 group-hover:text-indigo-500">Q</span>
                                                    <span className="text-xl font-black text-slate-700 dark:text-white group-hover:text-indigo-600">{qNum}</span>
                                                </div>
                                                <div className="max-w-[300px]">
                                                    <p className="text-xs text-slate-400 font-mono uppercase tracking-tighter mb-0.5">Start Question {qNum}</p>
                                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{qText}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm bg-white dark:bg-slate-800 px-4 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                                                <PlayCircle size={18} /> LAUNCH
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-700 text-center">
                             <div className="flex items-center justify-center gap-2 text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                Live Broadcasting Active
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
