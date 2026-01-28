
import React, { useState, useEffect } from 'react';
import { Question, Team } from '../types';
import { Save, LogOut, ChevronRight, PlayCircle, Clock, Eye, EyeOff, Loader2, Zap, LayoutGrid, MonitorPlay, Settings2, RefreshCw, Radio, Trash2, AlertTriangle, Users, Database, Copy, Check, Edit3 } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'editor' | 'live' | 'roster' | 'setup'>('live');
  const [selectedRound, setSelectedRound] = useState(1);
  const [localQuestions, setLocalQuestions] = useState<Question[]>(JSON.parse(JSON.stringify(questions)));
  const [saveMessage, setSaveMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [liveRound, setLiveRound] = useState(1);
  const [isLeaderboardVisible, setIsLeaderboardVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [registeredTeams, setRegisteredTeams] = useState<Team[]>([]);
  const [copied, setCopied] = useState(false);

  const sqlSchema = `-- COMPREHENSIVE FIX FOR RUPEE RUMBLE SCHEMA
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Ensure 'teams' table has all required columns
CREATE TABLE IF NOT EXISTS teams (id TEXT PRIMARY KEY);

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='teams' AND COLUMN_NAME='name') THEN
        ALTER TABLE teams ADD COLUMN name TEXT NOT NULL DEFAULT 'Unnamed Team';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='teams' AND COLUMN_NAME='members') THEN
        ALTER TABLE teams ADD COLUMN members TEXT DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='teams' AND COLUMN_NAME='balance') THEN
        ALTER TABLE teams ADD COLUMN balance NUMERIC DEFAULT 1000;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='teams' AND COLUMN_NAME='history') THEN
        ALTER TABLE teams ADD COLUMN history JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- 2. Ensure 'game_state' table
CREATE TABLE IF NOT EXISTS game_state (
  id BIGINT PRIMARY KEY,
  current_round_index INT DEFAULT 0,
  is_timer_active BOOLEAN DEFAULT FALSE,
  show_result BOOLEAN DEFAULT FALSE,
  show_leaderboard BOOLEAN DEFAULT FALSE,
  timer_duration INT DEFAULT 40
);

-- 3. Ensure 'questions' table
CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  round_number INT NOT NULL,
  question_number INT NOT NULL,
  text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer TEXT NOT NULL
);

-- 4. Seed initial state
INSERT INTO game_state (id, current_round_index, is_timer_active, show_result, show_leaderboard, timer_duration)
VALUES (1, 0, false, false, false, 40)
ON CONFLICT (id) DO NOTHING;`;

  const fetchTeams = async () => {
    const { data, error } = await supabase.from('teams').select('*').order('balance', { ascending: false });
    if (data) setRegisteredTeams(data as Team[]);
    if (error) console.error("Roster fetch error:", error.message);
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

    const channel = supabase.channel('roster-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => {
        fetchTeams();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

  const handleQuestionChange = (id: string, field: string, value: any, optionKey?: string) => {
    setLocalQuestions(prev => prev.map(q => {
      if (q.id !== id) return q;
      if (field === 'options' && optionKey) {
        return { ...q, options: { ...q.options, [optionKey]: value } };
      }
      return { ...q, [field]: value };
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');
    try {
      const dbPayload = localQuestions.map(q => ({
        id: q.id,
        round_number: q.roundNumber,
        question_number: q.questionNumber,
        text: q.text,
        options: q.options,
        correct_answer: q.correctAnswer
      }));

      const { error } = await supabase.from('questions').upsert(dbPayload);
      
      if (error) throw error;

      setQuestions(localQuestions);
      setSaveMessage('Bank Updated Successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err: any) {
      console.error("Save error:", err);
      alert("Failed to sync questions: " + err.message + "\n\nTip: Run the updated SQL in the Setup tab.");
    } finally {
      setIsSaving(false);
    }
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
        
        <div className="flex gap-2 items-center">
             <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700 overflow-x-auto max-w-[400px]">
                <button onClick={() => setActiveTab('editor')} className={`whitespace-nowrap flex items-center gap-2 px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-wider transition-all ${activeTab === 'editor' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`}>
                  Editor
                </button>
                <button onClick={() => setActiveTab('live')} className={`whitespace-nowrap flex items-center gap-2 px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-wider transition-all ${activeTab === 'live' ? 'bg-white dark:bg-slate-700 shadow text-green-600 dark:text-green-400' : 'text-slate-500'}`}>
                  Live
                </button>
                <button onClick={() => setActiveTab('roster')} className={`whitespace-nowrap flex items-center gap-2 px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-wider transition-all ${activeTab === 'roster' ? 'bg-white dark:bg-slate-700 shadow text-amber-600 dark:text-amber-400' : 'text-slate-500'}`}>
                  Roster
                </button>
                <button onClick={() => setActiveTab('setup')} className={`whitespace-nowrap flex items-center gap-2 px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-wider transition-all ${activeTab === 'setup' ? 'bg-white dark:bg-slate-700 shadow text-rose-600 dark:text-rose-400' : 'text-slate-500'}`}>
                  Setup
                </button>
             </div>
             <button onClick={onLogout} className="text-slate-400 hover:text-red-500 transition-colors p-2 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"><LogOut size={16} /></button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex">
        {activeTab === 'setup' && (
          <div className="flex-1 overflow-y-auto p-8 bg-slate-50 dark:bg-slate-950">
             <div className="max-w-4xl mx-auto space-y-8">
                <div className="space-y-2">
                   <h2 className="text-3xl font-black tracking-tighter flex items-center gap-3">
                      <Database className="text-rose-500" /> Database Synchronization
                   </h2>
                   <p className="text-sm text-slate-500 max-w-2xl">Copy the SQL below and run it in the SQL Editor of your Supabase dashboard. This version fixes missing columns in existing tables.</p>
                </div>
                
                <div className="relative group">
                   <pre className="bg-slate-900 text-indigo-300 p-8 rounded-2xl font-mono text-xs overflow-x-auto border border-slate-800 shadow-2xl leading-relaxed">
                      {sqlSchema}
                   </pre>
                   <button 
                      onClick={copyToClipboard}
                      className="absolute top-4 right-4 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-lg"
                   >
                      {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy SQL</>}
                   </button>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'editor' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-3 px-6 flex justify-between items-center shadow-sm">
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                {[1, 2, 3, 4, 5, 6].map(r => (
                  <button 
                    key={r}
                    onClick={() => setSelectedRound(r)}
                    className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedRound === r ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-600'}`}
                  >
                    Round {r}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-4">
                {saveMessage && <span className="text-[10px] font-black text-green-500 animate-pulse">{saveMessage}</span>}
                <button 
                  onClick={handleSave} 
                  disabled={isSaving}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                  PERSIST TO DATABASE
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 bg-slate-50 dark:bg-slate-950">
               <div className="max-w-4xl mx-auto space-y-8 pb-20">
                 {roundQuestions.map(q => (
                   <div key={q.id} className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
                      <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black">
                            {q.questionNumber}
                          </div>
                          <h3 className="text-sm font-black uppercase tracking-widest">Phase {q.questionNumber}</h3>
                        </div>
                        <div className="flex items-center gap-3">
                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Correct:</span>
                           <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                              {(['A', 'B', 'C', 'D'] as const).map(ans => (
                                <button 
                                  key={ans} 
                                  onClick={() => handleQuestionChange(q.id, 'correctAnswer', ans)}
                                  className={`w-8 h-8 rounded-md text-[10px] font-black transition-all ${q.correctAnswer === ans ? 'bg-green-500 text-white shadow-md' : 'text-slate-400 hover:bg-slate-200'}`}
                                >
                                  {ans}
                                </button>
                              ))}
                           </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Question Prompt</label>
                        <textarea 
                          value={q.text} 
                          onChange={(e) => handleQuestionChange(q.id, 'text', e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all text-slate-900 dark:text-white resize-none"
                          rows={3}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(['A', 'B', 'C', 'D'] as const).map(opt => (
                          <div key={opt} className="space-y-2">
                             <div className="flex justify-between items-center px-1">
                               <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Option {opt}</label>
                             </div>
                             <div className="flex items-center gap-2">
                               <input 
                                  type="text" 
                                  value={q.options[opt]} 
                                  onChange={(e) => handleQuestionChange(q.id, 'options', e.target.value, opt)}
                                  className={`w-full bg-slate-50 dark:bg-slate-800/50 border rounded-xl p-3 text-[11px] font-bold focus:outline-none transition-all ${q.correctAnswer === opt ? 'border-green-500 ring-1 ring-green-500' : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500'}`}
                                />
                             </div>
                          </div>
                        ))}
                      </div>
                   </div>
                 ))}
               </div>
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
                          {team.name ? team.name.charAt(0) : '?'}
                        </div>
                        <div>
                           <p className="font-black text-slate-900 dark:text-white leading-none">{team.name || "Unknown Team"}</p>
                           <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest line-clamp-1">{team.members || "No members listed"}</p>
                           <p className="text-xs font-mono font-bold text-green-500 mt-2">₹{team.balance || 0}</p>
                        </div>
                     </div>
                   ))}
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
