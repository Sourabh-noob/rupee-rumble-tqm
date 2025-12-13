import React, { useState } from 'react';
import { Question } from '../types';
import { Save, Plus, Trash2, LogOut, RotateCcw, Clock, Play, Square } from 'lucide-react';

interface AdminDashboardProps {
  questions: Question[];
  setQuestions: (q: Question[]) => void;
  timerDuration: number;
  setTimerDuration: (d: number) => void;
  onLogout: () => void;
  onStartTimer: () => void;
  onStopTimer: () => void;
  onResetTimer: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  questions, 
  setQuestions, 
  timerDuration,
  setTimerDuration,
  onLogout,
  onStartTimer,
  onStopTimer,
  onResetTimer
}) => {
  const [localQuestions, setLocalQuestions] = useState<Question[]>(JSON.parse(JSON.stringify(questions)));
  const [localDuration, setLocalDuration] = useState(timerDuration);
  const [saveMessage, setSaveMessage] = useState('');

  const handleQuestionChange = (index: number, field: keyof Question | 'options', value: any, optionKey?: 'A'|'B'|'C'|'D') => {
    const updated = [...localQuestions];
    if (field === 'options' && optionKey) {
        updated[index].options[optionKey] = value;
    } else {
        (updated[index] as any)[field] = value;
    }
    setLocalQuestions(updated);
  };

  const addQuestion = () => {
    const newId = `q${localQuestions.length + 1}_${Date.now()}`;
    setLocalQuestions([
        ...localQuestions,
        {
            id: newId,
            text: 'New Question',
            options: { A: 'Option A', B: 'Option B', C: 'Option C', D: 'Option D' },
            correctAnswer: 'A'
        }
    ]);
  };

  const removeQuestion = (index: number) => {
    const updated = localQuestions.filter((_, i) => i !== index);
    setLocalQuestions(updated);
  };

  const handleSave = () => {
    setQuestions(localQuestions);
    setTimerDuration(localDuration);
    setSaveMessage('Settings Saved Successfully!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto p-8 space-y-8 overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
        <button 
            onClick={onLogout}
            className="flex items-center gap-2 bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 px-4 py-2 rounded-lg transition-colors border border-red-200 dark:border-red-900/30"
        >
            <LogOut size={16} /> Exit
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 space-y-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock size={20} className="text-indigo-500 dark:text-indigo-400"/> Game Settings
            </h2>
            <div className="flex items-center gap-4">
                <label className="text-slate-600 dark:text-slate-300">Timer Duration (seconds):</label>
                <input 
                    type="number"
                    value={localDuration}
                    onChange={(e) => setLocalDuration(parseInt(e.target.value) || 60)}
                    className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-3 py-2 text-slate-900 dark:text-white w-24"
                />
            </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 space-y-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Play size={20} className="text-green-500 dark:text-green-400"/> Live Controls
            </h2>
            <div className="flex flex-wrap gap-2">
                <button 
                    onClick={onStartTimer}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded transition-colors text-sm font-bold"
                >
                    <Play size={16} /> Start Timer
                </button>
                <button 
                    onClick={onStopTimer}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded transition-colors text-sm font-bold"
                >
                    <Square size={16} /> Stop Timer
                </button>
                <button 
                    onClick={onResetTimer}
                    className="flex-1 flex items-center justify-center gap-2 bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 rounded transition-colors text-sm font-bold"
                >
                    <RotateCcw size={16} /> Restart Timer
                </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
                Note: "Start Timer" will actively switch the game view to Playing mode if you exit dashboard.
            </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Question Editor</h2>
            <button 
                onClick={addQuestion}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors"
            >
                <Plus size={16} /> Add Question
            </button>
        </div>

        {localQuestions.map((q, index) => (
            <div key={q.id} className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4 shadow-sm">
                <div className="flex justify-between items-start">
                    <span className="text-xs text-slate-500 font-mono uppercase">Question {index + 1}</span>
                    <button 
                        onClick={() => removeQuestion(index)}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
                
                <div className="space-y-2">
                    <label className="text-xs text-slate-500 dark:text-slate-400">Question Text</label>
                    <textarea 
                        value={q.text}
                        onChange={(e) => handleQuestionChange(index, 'text', e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-900 dark:text-white text-sm"
                        rows={2}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(['A', 'B', 'C', 'D'] as const).map(opt => (
                        <div key={opt} className="flex items-center gap-2">
                            <div className={`w-8 h-8 flex items-center justify-center rounded font-bold text-sm ${q.correctAnswer === opt ? 'bg-green-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
                                {opt}
                            </div>
                            <input 
                                type="text"
                                value={q.options[opt]}
                                onChange={(e) => handleQuestionChange(index, 'options', e.target.value, opt)}
                                className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-900 dark:text-white text-sm"
                            />
                        </div>
                    ))}
                </div>

                <div className="flex items-center gap-4 pt-2">
                    <label className="text-xs text-slate-500 dark:text-slate-400">Correct Answer:</label>
                    <select 
                        value={q.correctAnswer}
                        onChange={(e) => handleQuestionChange(index, 'correctAnswer', e.target.value)}
                        className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-3 py-1 text-slate-900 dark:text-white text-sm"
                    >
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                    </select>
                </div>
            </div>
        ))}
      </div>

      <div className="sticky bottom-4 flex justify-end">
        <button 
            onClick={handleSave}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-green-900/20 transition-all transform hover:scale-105"
        >
            <Save size={20} /> Save Changes
        </button>
      </div>

      {saveMessage && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-full shadow-xl animate-fade-in-up">
            {saveMessage}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;