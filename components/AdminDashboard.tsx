import React, { useState } from 'react';
import { Question } from '../types';
import { Save, LogOut, ChevronRight, PlayCircle, Clock } from 'lucide-react';

interface AdminDashboardProps {
  questions: Question[];
  setQuestions: (q: Question[]) => void;
  timerDuration: number;
  setTimerDuration: (d: number) => void;
  onLogout: () => void;
  // Live Control Props
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
  
  // Editor State
  const [selectedRound, setSelectedRound] = useState(1);
  const [localQuestions, setLocalQuestions] = useState<Question[]>(JSON.parse(JSON.stringify(questions)));
  const [saveMessage, setSaveMessage] = useState('');

  // Live State
  const [liveRound, setLiveRound] = useState(1);

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

  // Filter questions for the selected round editor
  const roundQuestions = localQuestions.filter(q => q.roundNumber === selectedRound).sort((a,b) => a.questionNumber - b.questionNumber);

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-100 dark:bg-slate-900 pb-12">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 flex justify-between items-center z-10">
        <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Admin Control</h1>
        <div className="flex gap-4">
             <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-1">
                <button 
                    onClick={() => setActiveTab('editor')}
                    className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab === 'editor' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`}
                >
                    Round Editor
                </button>
                <button 
                    onClick={() => setActiveTab('live')}
                    className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab === 'live' ? 'bg-white dark:bg-slate-700 shadow text-green-600 dark:text-green-400' : 'text-slate-500'}`}
                >
                    Live Control
                </button>
             </div>
             <button onClick={onLogout} className="text-slate-500 hover:text-red-500 transition-colors">
                <LogOut size={20} />
             </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">
        
        {/* TAB: EDITOR */}
        {activeTab === 'editor' && (
            <>
                {/* Sidebar: Round Selector */}
                <div className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 overflow-y-auto">
                    <div className="p-4 font-bold text-xs text-slate-400 uppercase tracking-wider">Select Round</div>
                    {[1, 2, 3, 4, 5].map(r => (
                        <button
                            key={r}
                            onClick={() => setSelectedRound(r)}
                            className={`w-full text-left px-6 py-4 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between transition-colors ${selectedRound === r ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-bold border-r-4 border-r-indigo-500' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                        >
                            Round {r} <ChevronRight size={16} />
                        </button>
                    ))}
                    
                    <div className="p-4 mt-8 border-t border-slate-200 dark:border-slate-700">
                        <label className="text-xs text-slate-500 mb-2 block">Global Timer (sec)</label>
                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded p-2">
                            <Clock size={16} className="text-slate-400" />
                            <input 
                                type="number" 
                                value={timerDuration}
                                onChange={(e) => setTimerDuration(parseInt(e.target.value) || 0)}
                                className="bg-transparent w-full text-sm outline-none font-mono text-slate-900 dark:text-white"
                            />
                        </div>
                    </div>
                </div>

                {/* Main: Question List */}
                <div className="flex-1 overflow-y-auto p-8 relative">
                    <div className="max-w-4xl mx-auto space-y-8 pb-20">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold dark:text-white">Editing Round {selectedRound}</h2>
                            <span className="text-sm text-slate-500">5 Questions Max</span>
                        </div>

                        {roundQuestions.map((q) => (
                            <div key={q.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-3 px-6 border-b border-slate-200 dark:border-slate-700 flex justify-between">
                                    <span className="font-mono text-xs font-bold text-slate-500 uppercase">Question {q.questionNumber}</span>
                                </div>
                                <div className="p-6 space-y-4">
                                    <textarea 
                                        value={q.text}
                                        onChange={(e) => handleQuestionChange(q.id, 'text', e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900 dark:text-white"
                                        placeholder="Question Text"
                                        rows={2}
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        {(['A', 'B', 'C', 'D'] as const).map(opt => (
                                            <div key={opt} className="flex gap-2 items-center">
                                                <div className={`w-8 h-8 flex items-center justify-center rounded text-xs font-bold ${q.correctAnswer === opt ? 'bg-green-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
                                                    {opt}
                                                </div>
                                                <input 
                                                    type="text"
                                                    value={q.options[opt]}
                                                    onChange={(e) => handleQuestionChange(q.id, 'options', e.target.value, opt)}
                                                    className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded p-2 text-xs text-slate-900 dark:text-white"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-2 justify-end">
                                        <label className="text-xs text-slate-500">Correct Answer:</label>
                                        <select 
                                            value={q.correctAnswer}
                                            onChange={(e) => handleQuestionChange(q.id, 'correctAnswer', e.target.value)}
                                            className="bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-xs text-slate-900 dark:text-white"
                                        >
                                            <option value="A">A</option>
                                            <option value="B">B</option>
                                            <option value="C">C</option>
                                            <option value="D">D</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Floating Save Button */}
                    <div className="absolute bottom-6 right-8">
                        <button 
                            onClick={handleSave}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold px-8 py-3 rounded-full shadow-xl shadow-green-900/20 hover:scale-105 transition-transform"
                        >
                            <Save size={20} /> Save Changes
                        </button>
                        {saveMessage && <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs py-1 px-3 rounded">{saveMessage}</div>}
                    </div>
                </div>
            </>
        )}

        {/* TAB: LIVE CONTROL */}
        {activeTab === 'live' && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-950">
                <div className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
                    <div className="p-8 text-center border-b border-slate-200 dark:border-slate-700">
                        <h2 className="text-3xl font-display font-bold text-slate-900 dark:text-white mb-2">Live Game Director</h2>
                        <p className="text-slate-500">Select a round to initiate on the big screen.</p>
                    </div>
                    
                    <div className="p-8 space-y-8">
                        <div className="space-y-4">
                            <label className="text-sm font-bold text-slate-400 uppercase tracking-wider block">Target Round</label>
                            <div className="grid grid-cols-5 gap-2">
                                {[1, 2, 3, 4, 5].map(r => (
                                    <button
                                        key={r}
                                        onClick={() => setLiveRound(r)}
                                        className={`py-4 rounded-xl font-bold text-lg border-2 transition-all ${liveRound === r ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:border-slate-300'}`}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-6 border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-between">
                            <div>
                                <div className="text-sm text-indigo-800 dark:text-indigo-300 font-bold mb-1">Ready to Launch</div>
                                <div className="text-xs text-indigo-600 dark:text-indigo-400">Round {liveRound} • Question 1</div>
                            </div>
                            <button
                                onClick={() => onStartRound(liveRound, 1)}
                                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-lg font-bold shadow-lg shadow-indigo-500/30 hover:scale-105 transition-transform"
                            >
                                <PlayCircle size={20} /> START ROUND
                            </button>
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
