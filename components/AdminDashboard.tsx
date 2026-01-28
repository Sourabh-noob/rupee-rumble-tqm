
import React, { useState, useEffect } from 'react';
import { Question, Team } from '../types';
import { Save, LogOut, ChevronRight, PlayCircle, Clock, Eye, EyeOff, Loader2, Zap, LayoutGrid, MonitorPlay, Settings2, RefreshCw, Radio, Trash2, AlertTriangle, Users } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'editor' | 'live' | 'roster'>('live');
  const [selectedRound, setSelectedRound] = useState(1);
  const [localQuestions, setLocalQuestions] = useState<Question[]>(JSON.parse(JSON.stringify(questions)));
  const [saveMessage, setSaveMessage] = useState('');
  const [liveRound, setLiveRound] = useState(1);
  const [isLeaderboardVisible, setIsLeaderboardVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [registeredTeams, setRegisteredTeams] = useState<Team[]>([]);

  const fetchTeams = async () => {
    const { data } = await supabase.from('teams').select('*').order('balance', { ascending: false });
    if (data) setRegisteredTeams(data as Team[]);
  };

  useEffect(() => {
    const init = async () => {
      try {
        const { data } = await supabase.from('game_state').select('show_leaderboard').eq('id', GAME_STATE_ID).maybeSingle();
        if (data) setIsLeaderboardVisible(data.show_leaderboard);
        await fetchTeams();
      } catch (err) {
        console.error("Dashboard init error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    init();

    // Live listener for new teams joining
    const channel = supabase.channel('roster-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => {
        fetchTeams();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const toggleLeaderboard = async () => {
    const newVal = !isLeaderboardVisible;
    const { error } = await supabase.from('game_state').update({ show_leaderboard: newVal }).eq('id', GAME_STATE_ID);
    if (error) return alert(`Error: ${error.message}`);
    setIsLeaderboardVisible(newVal);
  };

  const handleResetSession = async () => {
    setSyncing(true);
    try {
      await supabase.from('teams').delete().neq('id', '0');
      await supabase.from('game_state').update({ 
        current_round_index: 0, 
        is_timer_active: false,
        show_result: false,
        show_leaderboard: false
      }).eq('id', GAME_STATE_ID);
      setRegisteredTeams([]);
      alert("Session Reset: All team data wiped.");
      setShowResetConfirm(false);
    } catch (err: any) {
      alert("Reset failed: " + err.message);
    } finally {
      setSyncing(false);
    }
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
              <p className="text-[8px] font-mono text-green-500 uppercase tracking-widest mt-1">{registeredTeams.length} Teams Registered</p>
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
                <button onClick={() => setActiveTab('roster')} className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all ${activeTab === 'roster' ? 'bg-white dark:bg-slate-700 shadow text-amber-600 dark:text-amber-400' : 'text-slate-500'}`}>
                  Roster
                </button>
             </div>
             <button onClick={onLogout} className="text-slate-400 hover:text-red-500 transition-colors p-2 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"><LogOut size={16} /></button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex">
        {activeTab === 'editor' && (
            <div className="flex-1 overflow-y-auto p-8 bg-slate-50 dark:bg-slate-950">
               {/* Editor content same as before but simplified for space */}
               <div className="max-w-3xl mx-auto space-y-6">
                 <h2 className="text-xl font-black">Question Bank</h2>
                 {roundQuestions.map(q => (
                   <div key={q.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                     <p className="text-xs font-mono text-indigo-500 mb-2">PHASE {q.questionNumber}</p>
                     <p className="font-bold">{q.text}</p>
                   </div>
                 ))}
                 <button onClick={handleSave} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold">Save All</button>
               </div>
            </div>
        )}

        {activeTab === 'roster' && (
          <div className="flex-1 overflow-y-auto p-8 bg-slate-50 dark:bg-slate-950">
             <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                   <h2 className="text-3xl font-black tracking-tighter">LIVE ROSTER</h2>
                   <button onClick={fetchTeams} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-indigo-500 transition-colors"><RefreshCw size={18} /></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                   {registeredTeams.map(team => (
                     <div key={team.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-xl">
                          {team.name.charAt(0)}
                        </div>
                        <div>
                           <p className="font-black text-slate-900 dark:text-white leading-none">{team.name}</p>
                           <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest">{team.members}</p>
                           <p className="text-xs font-mono font-bold text-green-500 mt-2">₹{team.balance}</p>
                        </div>
                     </div>
                   ))}
                   {registeredTeams.length === 0 && (
                     <div className="col-span-full py-20 text-center space-y-4">
                        <Users size={48} className="mx-auto text-slate-300" />
                        <p className="text-slate-500 font-bold">No teams registered yet. Tell players to join via the landing page.</p>
                     </div>
                   )}
                </div>
             </div>
          </div>
        )}

        {activeTab === 'live' && (
            <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden">
                <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-3 px-6 flex justify-between items-center shadow-sm">
                  <div className="flex gap-1.5 overflow-x-auto pb-1">
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
                </div>

                <div className="flex-1 overflow-hidden flex flex-col xl:flex-row p-6 gap-6">
                    <div className="flex-1 overflow-y-auto space-y-4">
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
                                          <span className="w-6 h-6 rounded bg-green-500 text-white text-[9px] font-black flex items-center justify-center shadow-sm">{q?.correctAnswer}</span>
                                        </div>
                                        <p className="text-[11px] font-bold text-slate-800 dark:text-slate-100 line-clamp-2 mb-5 h-8 leading-tight">{q?.text || "..."}</p>
                                      </div>
                                      <button onClick={() => onStartRound(liveRound, qNum)} className="w-full flex items-center justify-center gap-2 bg-slate-900 dark:bg-indigo-600 hover:bg-indigo-500 text-white font-black py-2.5 rounded-xl text-[10px] transition-all transform active:scale-95 shadow-lg">
                                          <PlayCircle size={14} /> LAUNCH PHASE
                                      </button>
                                  </div>
                              );
                          })}
                      </div>
                    </div>

                    <div className="w-full xl:w-72 space-y-4">
                        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                              <Settings2 size={12} /> Live Controls
                            </h3>
                            <div className="space-y-3">
                              <button onClick={toggleLeaderboard} className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-black text-[10px] transition-all transform active:scale-95 shadow-md ${isLeaderboardVisible ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                  {isLeaderboardVisible ? <><EyeOff size={14} /> HIDE RANKINGS</> : <><Eye size={14} /> SHOW RANKINGS</>}
                              </button>
                              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                {showResetConfirm ? (
                                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-500/50 space-y-3">
                                    <p className="text-[9px] text-red-800 dark:text-red-300 font-black">RESET EVERYTHING?</p>
                                    <div className="flex gap-2">
                                      <button onClick={handleResetSession} className="flex-1 bg-red-600 text-white text-[9px] font-black py-2 rounded-lg">WIPE ALL</button>
                                      <button onClick={() => setShowResetConfirm(false)} className="flex-1 bg-slate-200 dark:bg-slate-700 text-[9px] font-black py-2 rounded-lg">NO</button>
                                    </div>
                                  </div>
                                ) : (
                                  <button onClick={() => setShowResetConfirm(true)} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-black text-[10px] bg-red-100/50 text-red-600 hover:bg-red-600 hover:text-white transition-all">
                                      <Trash2 size={14} /> RESET SESSION
                                  </button>
                                )}
                              </div>
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
