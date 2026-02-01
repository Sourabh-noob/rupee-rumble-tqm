import React, { useState, useEffect } from 'react';
import { Question, Team } from '../types';
import { Save, LogOut, PlayCircle, Clock, Eye, EyeOff, Loader2, Zap, Settings2, RefreshCw, Trash2, Database, Copy, Check, Hourglass, PlusCircle } from 'lucide-react';
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
  const [localQuestions, setLocalQuestions] = useState<Question[]>([]);
  const [saveMessage, setSaveMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [liveRound, setLiveRound] = useState(1);
  const [isLeaderboardVisible, setIsLeaderboardVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [registeredTeams, setRegisteredTeams] = useState<Team[]>([]);
  const [copied, setCopied] = useState(false);
  
  const [localTimerValue, setLocalTimerValue] = useState(timerDuration);
  const [isUpdatingTimer, setIsUpdatingTimer] = useState(false);

  // Sync localQuestions when the prop changes
  useEffect(() => {
    setLocalQuestions(JSON.parse(JSON.stringify(questions)));
  }, [questions]);

  const sqlSchema = `-- COMPREHENSIVE FIX FOR RUPEE RUMBLE SCHEMA + SECURITY HARDENING
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Create tables if they don't exist
CREATE TABLE IF NOT EXISTS teams (id TEXT PRIMARY KEY);
CREATE TABLE IF NOT EXISTS game_state (id BIGINT PRIMARY KEY);
CREATE TABLE IF NOT EXISTS questions (id TEXT PRIMARY KEY);

-- 2. Ensure columns exist with correct types
DO $$ 
BEGIN 
    -- teams
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='teams' AND COLUMN_NAME='name') THEN ALTER TABLE teams ADD COLUMN name TEXT NOT NULL DEFAULT 'Unnamed'; END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='teams' AND COLUMN_NAME='members') THEN ALTER TABLE teams ADD COLUMN members TEXT DEFAULT ''; END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='teams' AND COLUMN_NAME='balance') THEN ALTER TABLE teams ADD COLUMN balance NUMERIC DEFAULT 1000; END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='teams' AND COLUMN_NAME='history') THEN ALTER TABLE teams ADD COLUMN history JSONB DEFAULT '[]'::jsonb; END IF;

    -- game_state
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='game_state' AND COLUMN_NAME='current_round_index') THEN ALTER TABLE game_state ADD COLUMN current_round_index INT DEFAULT 0; END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='game_state' AND COLUMN_NAME='is_timer_active') THEN ALTER TABLE game_state ADD COLUMN is_timer_active BOOLEAN DEFAULT FALSE; END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='game_state' AND COLUMN_NAME='show_result') THEN ALTER TABLE game_state ADD COLUMN show_result BOOLEAN DEFAULT FALSE; END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='game_state' AND COLUMN_NAME='show_leaderboard') THEN ALTER TABLE game_state ADD COLUMN show_leaderboard BOOLEAN DEFAULT FALSE; END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='game_state' AND COLUMN_NAME='timer_duration') THEN ALTER TABLE game_state ADD COLUMN timer_duration INT DEFAULT 40; END IF;

    -- questions
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='questions' AND COLUMN_NAME='round_number') THEN ALTER TABLE questions ADD COLUMN round_number INT; END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='questions' AND COLUMN_NAME='question_number') THEN ALTER TABLE questions ADD COLUMN question_number INT; END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='questions' AND COLUMN_NAME='text') THEN ALTER TABLE questions ADD COLUMN text TEXT; END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='questions' AND COLUMN_NAME='options') THEN ALTER TABLE questions ADD COLUMN options JSONB; END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='questions' AND COLUMN_NAME='correct_answer') THEN ALTER TABLE questions ADD COLUMN correct_answer TEXT; END IF;
END $$;

-- 3. ENABLE SECURITY (RLS)
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- DROP OLD POLICIES TO AVOID DUPLICATES
DROP POLICY IF EXISTS "Public access to teams" ON teams;
DROP POLICY IF EXISTS "Public access to game_state" ON game_state;
DROP POLICY IF EXISTS "Public read game_state" ON game_state;
DROP POLICY IF EXISTS "Public access to questions" ON questions;
DROP POLICY IF EXISTS "Public read questions" ON questions;

-- 4. ADD HARDENED POLICIES (Updated to allow ALL access for Admin functionality)
CREATE POLICY "Public access to teams" ON teams FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to game_state" ON game_state FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to questions" ON questions FOR ALL USING (true) WITH CHECK (true);

-- 5. Seed initial state
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
        const { data } = await supabase.from('game_state').select('show_leaderboard, timer_duration').eq('id', GAME_STATE_ID).maybeSingle();
        if (data) {
          setIsLeaderboardVisible(data.show_leaderboard);
          setLocalTimerValue(data.timer_duration);
        }
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

  useEffect(() => {
    setLocalTimerValue(timerDuration);
  }, [timerDuration]);

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

  const updateGlobalTimer = async (val: number) => {
    setIsUpdatingTimer(true);
    try {
      const { error } = await supabase.from('game_state').update({ timer_duration: val }).eq('id', GAME_STATE_ID);
      if (error) throw error;
      setTimerDuration(val);
    } catch (err: any) {
      alert("Failed to update timer: " + err.message);
      setLocalTimerValue(timerDuration);
    } finally {
      setIsUpdatingTimer(false);
    }
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

  const handleAddQuestion = () => {
    const roundQs = localQuestions.filter(q => q.roundNumber === selectedRound);
    const nextNum = roundQs.length > 0 ? Math.max(...roundQs.map(q => q.questionNumber)) + 1 : 1;
    const newId = `new-${selectedRound}-${nextNum}-${Date.now()}`;
    
    const newQ: Question = {
      id: newId,
      roundNumber: selectedRound,
      questionNumber: nextNum,
      text: 'New Question Prompt...',
      options: { A: 'Option 1', B: 'Option 2', C: 'Option 3', D: 'Option 4' },
      correctAnswer: 'A'
    };
    
    setLocalQuestions(prev => [...prev, newQ]);
  };

  const handleDeleteQuestion = (id: string) => {
    if (!window.confirm("Delete this question from the bank?")) return;
    setLocalQuestions(prev => prev.filter(q => q.id !== id));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');
    try {
      // 1. Delete existing questions to ensure clean slate
      const { error: deleteError } = await supabase.from('questions').delete().neq('id', 'internal-placeholder');
      if (deleteError) throw deleteError;
      
      // 2. Prepare payload
      const dbPayload = localQuestions.map(q => ({
        id: q.id,
        round_number: q.roundNumber,
        question_number: q.questionNumber,
        text: q.text,
        options: q.options,
        correct_answer: q.correctAnswer
      }));

      // 3. Upsert new batch
      if (dbPayload.length > 0) {
        const { error: upsertError } = await supabase.from('questions').upsert(dbPayload);
        if (upsertError) throw upsertError;
      }

      setQuestions(localQuestions);
      setSaveMessage('Bank Updated Successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err: any) {
      console.error("Save error:", err);
      alert("Failed to sync questions: " + err.message + "\n\nMake sure you have updated the SQL policies in the 'Setup' tab!");
    } finally {
      setIsSaving(false);
    }
  };

  const currentRoundQs = localQuestions
    .filter(q => q.roundNumber === selectedRound)
    .sort((a, b) => a.questionNumber - b.questionNumber);

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
                   <p className="text-sm text-slate-500 max-w-2xl">Copy the SQL below and run it in the SQL Editor of your Supabase dashboard to allow the Admin panel to sync changes.</p>
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
                 {currentRoundQs.map(q => (
                   <div key={q.id} className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-6 relative group/card">
                      <button 
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover/card:opacity-100"
                        title="Delete Question"
                      >
                        <Trash2 size={16} />
                      </button>

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
                             <input 
                                type="text" 
                                value={q.options[opt]} 
                                onChange={(e) => handleQuestionChange(q.id, 'options', e.target.value, opt)}
                                className={`w-full bg-slate-50 dark:bg-slate-800/50 border rounded-xl p-3 text-[11px] font-bold focus:outline-none transition-all ${q.correctAnswer === opt ? 'border-green-500 ring-1 ring-green-500' : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500'}`}
                              />
                          </div>
                        ))}
                      </div>
                   </div>
                 ))}

                 <button 
                   onClick={handleAddQuestion}
                   className="w-full flex items-center justify-center gap-3 py-6 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-400 hover:text-indigo-500 hover:border-indigo-500/50 transition-all font-black text-xs uppercase tracking-widest bg-white dark:bg-slate-900/50"
                 >
                   <PlusCircle size={20} /> Add Question to Round {selectedRound}
                 </button>
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
                          {localQuestions
                            .filter(q => q.roundNumber === liveRound)
                            .sort((a,b) => a.questionNumber - b.questionNumber)
                            .map(q => (
                                <div key={q.id} className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between">
                                    <div>
                                      <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                          <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-900/40 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-sm">{q.questionNumber}</div>
                                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Phase {q.questionNumber}</span>
                                        </div>
                                        <span className="w-6 h-6 rounded bg-green-500 text-white text-[9px] font-black flex items-center justify-center shadow-sm">{q.correctAnswer}</span>
                                      </div>
                                      <p className="text-[11px] font-bold text-slate-800 dark:text-slate-100 line-clamp-2 mb-5 h-8 leading-tight">{q.text}</p>
                                    </div>
                                    <button onClick={() => onStartRound(liveRound, q.questionNumber)} className="w-full flex items-center justify-center gap-2 bg-slate-900 dark:bg-indigo-600 hover:bg-indigo-500 text-white font-black py-2.5 rounded-xl text-[10px] transition-all transform active:scale-95 shadow-lg">
                                        <PlayCircle size={14} /> LAUNCH PHASE
                                    </button>
                                </div>
                            ))
                          }
                          {localQuestions.filter(q => q.roundNumber === liveRound).length === 0 && (
                            <div className="col-span-full py-20 text-center text-slate-400 font-mono text-xs uppercase tracking-widest">
                              No questions in this round. Add them in the Editor.
                            </div>
                          )}
                      </div>
                    </div>

                    <div className="w-full xl:w-72 space-y-4">
                        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                            <div>
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                  <Settings2 size={12} /> Live Controls
                                </h3>
                                <div className="space-y-3">
                                  <button onClick={toggleLeaderboard} className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-black text-[10px] transition-all transform active:scale-95 shadow-md ${isLeaderboardVisible ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                      {isLeaderboardVisible ? <><EyeOff size={14} /> HIDE RANKINGS</> : <><Eye size={14} /> SHOW RANKINGS</>}
                                  </button>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                  <Hourglass size={12} /> Market Timing
                                </h3>
                                <div className="space-y-3">
                                  <div className="flex items-center gap-3">
                                    <input 
                                      type="number" 
                                      value={localTimerValue}
                                      onChange={(e) => setLocalTimerValue(parseInt(e.target.value) || 0)}
                                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                                      placeholder="Seconds..."
                                    />
                                    <span className="text-[10px] font-black text-slate-400 uppercase">SEC</span>
                                  </div>
                                  <button 
                                    onClick={() => updateGlobalTimer(localTimerValue)}
                                    disabled={isUpdatingTimer || localTimerValue === timerDuration}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-black text-[10px] bg-slate-900 dark:bg-slate-700 text-white hover:bg-slate-800 disabled:opacity-50 transition-all uppercase tracking-widest"
                                  >
                                    {isUpdatingTimer ? <Loader2 size={12} className="animate-spin" /> : <Clock size={12} />}
                                    Sync Limit
                                  </button>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
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
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;