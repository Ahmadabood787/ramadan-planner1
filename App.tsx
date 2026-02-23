import React, { useState, useEffect } from 'react';
import { Sun, Star, CheckCircle2, Circle, Calendar, Plus, Trash2, Phone, BookHeart, Activity, Utensils, Edit2, Check, User, Repeat, ChevronDown, Bot, Loader2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

// Types
type TaskCategory = 'religious' | 'sports' | 'food' | 'custom';
type RepetitionType = 'once' | 'every3days' | 'everyday';

type Task = {
  id: string;
  text: string;
  completed: boolean;
  category: TaskCategory;
  customCategoryName?: string;
  groupId?: string; 
  isDefault?: boolean;
  defaultId?: string;
};

type DayData = {
  day: number;
  tasks: Task[];
};

// Category Configuration (Colors & Icons)
const CATEGORY_CONFIG: Record<TaskCategory, { label: string, icon: any, color: string, bg: string, border: string }> = {
  religious: { label: 'ديني', icon: BookHeart, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  sports: { label: 'رياضي', icon: Activity, color: 'text-sky-500', bg: 'bg-sky-500/10', border: 'border-sky-500/20' },
  food: { label: 'أكل', icon: Utensils, color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
  custom: { label: 'مخصص', icon: Star, color: 'text-primary-500', bg: 'bg-primary-500/10', border: 'border-primary-500/20' }
};

// Default tasks for each day
const DEFAULT_TASKS: Omit<Task, 'id'>[] = [
  { text: 'صلاة الفجر', completed: false, category: 'religious', isDefault: true, defaultId: 't1', groupId: 'default-t1' },
  { text: 'ممارسة المشي لمدة 30 دقيقة', completed: false, category: 'sports', isDefault: true, defaultId: 't2', groupId: 'default-t2' },
  { text: 'الاستيقاظ الساعة 3 فجراً', completed: false, category: 'custom', customCategoryName: 'عمل', isDefault: true, defaultId: 't3', groupId: 'default-t3' },
];

// Initialize 30 days
const generateInitialData = (): DayData[] => {
  return Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    tasks: DEFAULT_TASKS.map((t, index) => ({ ...t, id: `${i + 1}-t${index}` })),
  }));
};

export default function App() {
  // Auth State
  const [userPhone, setUserPhone] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [tempPhone, setTempPhone] = useState('');
  const [tempName, setTempName] = useState('');

  // App State
  const [daysData, setDaysData] = useState<DayData[]>([]);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [isLoaded, setIsLoaded] = useState(false);
  const [savedCustomCategories, setSavedCustomCategories] = useState<string[]>(['عمل', 'صحة']);

  // New Task State
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<string>('religious');
  const [newCustomCategoryName, setNewCustomCategoryName] = useState('');
  const [newTaskRepetition, setNewTaskRepetition] = useState<RepetitionType>('once');

  // Edit State
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTaskText, setEditTaskText] = useState('');
  const [editTaskCategory, setEditTaskCategory] = useState<string>('religious');
  const [editCustomCategoryName, setEditCustomCategoryName] = useState('');

  // AI Assistant State
  const [aiInput, setAiInput] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Load data from localStorage on mount
  useEffect(() => {
    document.documentElement.classList.remove('dark');

    const savedPhone = localStorage.getItem('ramadanPlannerPhone');
    const savedName = localStorage.getItem('ramadanPlannerName');
    if (savedPhone) setUserPhone(savedPhone);
    if (savedName) setUserName(savedName);

    const savedData = localStorage.getItem('ramadanPlannerDataV6');
    if (savedData) {
      setDaysData(JSON.parse(savedData));
    } else {
      setDaysData(generateInitialData());
    }

    const savedCats = localStorage.getItem('ramadanPlannerCategories');
    if (savedCats) {
      setSavedCustomCategories(JSON.parse(savedCats));
    }

    setIsLoaded(true);
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('ramadanPlannerDataV6', JSON.stringify(daysData));
      localStorage.setItem('ramadanPlannerCategories', JSON.stringify(savedCustomCategories));
    }
  }, [daysData, savedCustomCategories, isLoaded]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempPhone.trim().length >= 9 && tempName.trim().length > 0) {
      setUserPhone(tempPhone);
      setUserName(tempName);
      localStorage.setItem('ramadanPlannerPhone', tempPhone);
      localStorage.setItem('ramadanPlannerName', tempName);
    }
  };

  const handleLogout = () => {
    setUserPhone(null);
    setUserName(null);
    localStorage.removeItem('ramadanPlannerPhone');
    localStorage.removeItem('ramadanPlannerName');
  };

  // --- AI Chat Function ---
  const askAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim()) return;

    setIsAiLoading(true);
    setAiResponse('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: aiInput,
      });
      
      if (response.text) {
        setAiResponse(response.text);
      } else {
        setAiResponse('عذراً، حدث خطأ في الخادم.');
      }
    } catch (error) {
      console.error("خطأ:", error);
      setAiResponse('حدث خطأ في الاتصال بالمساعد الذكي.');
    } finally {
      setIsAiLoading(false);
    }
  };

  if (!isLoaded) return null;

  // --- Login Screen ---
  if (!userPhone || !userName) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 transition-colors duration-300 font-sans" dir="rtl">
        <div className="max-w-md w-full bg-white backdrop-blur-xl rounded-[2rem] shadow-2xl border border-slate-200 p-8 sm:p-10 text-center relative overflow-hidden">
          <div className="absolute top-[-20%] left-[-10%] w-40 h-40 rounded-full bg-primary-500/10 blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-40 h-40 rounded-full bg-blue-500/10 blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10">
            <div className="w-24 h-24 bg-gradient-to-br from-primary-400/20 to-primary-600/20 rounded-full flex items-center justify-center mx-auto mb-8 border border-primary-500/20 shadow-[0_0_30px_rgba(89,111,53,0.15)]">
              <Sun className="w-12 h-12 text-primary-500 fill-primary-500/20" />
            </div>
            <h1 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">مرحباً بك</h1>
            <p className="text-slate-500 mb-8 text-lg">أدخل اسمك ورقم جوالك للبدء في متابعة جدولك الرمضاني</p>
            
            <form onSubmit={handleLogin}>
              <div className="relative mb-4">
                <User className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input 
                  type="text" 
                  required
                  placeholder="الاسم الكريم"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pr-14 pl-5 text-right text-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all text-slate-900 placeholder:text-slate-400"
                  value={tempName}
                  onChange={e => setTempName(e.target.value)}
                />
              </div>
              <div className="relative mb-8">
                <Phone className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input 
                  type="tel" 
                  required
                  dir="ltr"
                  placeholder="05X XXX XXXX"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pr-14 pl-5 text-left text-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all text-slate-900 placeholder:text-slate-400"
                  value={tempPhone}
                  onChange={e => setTempPhone(e.target.value)}
                />
              </div>
              <button type="submit" className="w-full bg-gradient-to-r from-primary-500 to-primary-400 hover:from-primary-600 hover:to-primary-500 text-white text-lg font-bold rounded-2xl py-4 shadow-lg shadow-primary-500/25 transition-all transform hover:scale-[1.02] active:scale-[0.98]">
                ابدأ المهام
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // --- Main App ---
  const currentDayData = daysData.find(d => d.day === selectedDay) || daysData[0];

  const calculateDayProgress = (day: DayData) => {
    if (day.tasks.length === 0) return 0;
    const completed = day.tasks.filter(t => t.completed).length;
    return Math.round((completed / day.tasks.length) * 100);
  };

  const calculateOverallProgress = () => {
    let totalTasks = 0;
    let completedTasks = 0;
    daysData.forEach(day => {
      totalTasks += day.tasks.length;
      completedTasks += day.tasks.filter(t => t.completed).length;
    });
    if (totalTasks === 0) return 0;
    return Math.round((completedTasks / totalTasks) * 100);
  };

  const toggleTask = (taskId: string) => {
    setDaysData(prev => prev.map(day => {
      if (day.day !== selectedDay) return day;
      return {
        ...day,
        tasks: day.tasks.map(task => 
          task.id === taskId ? { ...task, completed: !task.completed } : task
        )
      };
    }));
  };

  const handleQuickCategoryChange = (taskId: string, newCategoryValue: string) => {
    let newCategory: TaskCategory = 'custom';
    let customName: string | undefined = undefined;

    if (newCategoryValue === 'religious' || newCategoryValue === 'sports' || newCategoryValue === 'food') {
      newCategory = newCategoryValue;
    } else if (newCategoryValue.startsWith('custom:')) {
      newCategory = 'custom';
      customName = newCategoryValue.split(':')[1];
    }

    setDaysData(prev => prev.map(day => {
      const taskToEdit = currentDayData.tasks.find(t => t.id === taskId);
      const groupId = taskToEdit?.groupId;
      
      if (groupId) {
        return {
          ...day,
          tasks: day.tasks.map(task => 
            task.groupId === groupId 
              ? { ...task, category: newCategory, customCategoryName: customName } 
              : task
          )
        };
      } else {
        if (day.day !== selectedDay) return day;
        return {
          ...day,
          tasks: day.tasks.map(task => 
            task.id === taskId 
              ? { ...task, category: newCategory, customCategoryName: customName } 
              : task
          )
        };
      }
    }));
  };

  const deleteCustomCategory = (catName: string) => {
    if (window.confirm(`هل أنت متأكد من حذف الفئة "${catName}"؟`)) {
      setSavedCustomCategories(prev => prev.filter(c => c !== catName));
      if (newTaskCategory === `custom:${catName}`) {
        setNewTaskCategory('religious');
      }
      if (editTaskCategory === `custom:${catName}`) {
        setEditTaskCategory('religious');
      }
    }
  };

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    
    let finalCategory: TaskCategory = 'custom';
    let finalCustomName: string | undefined = undefined;

    if (newTaskCategory === 'religious' || newTaskCategory === 'sports' || newTaskCategory === 'food') {
      finalCategory = newTaskCategory;
    } else if (newTaskCategory.startsWith('custom:')) {
      finalCategory = 'custom';
      finalCustomName = newTaskCategory.split(':')[1];
    } else if (newTaskCategory === 'new_custom') {
      if (!newCustomCategoryName.trim()) return;
      finalCategory = 'custom';
      finalCustomName = newCustomCategoryName.trim();
      
      if (!savedCustomCategories.includes(finalCustomName)) {
        setSavedCustomCategories(prev => [...prev, finalCustomName!]);
      }
    }

    const groupId = `group-${Date.now()}`;
    const targetDays: number[] = [];

    if (newTaskRepetition === 'once') {
      targetDays.push(selectedDay);
    } else if (newTaskRepetition === 'everyday') {
      for (let i = selectedDay; i <= 30; i++) targetDays.push(i);
    } else if (newTaskRepetition === 'every3days') {
      for (let i = selectedDay; i <= 30; i += 3) targetDays.push(i);
    }

    setDaysData(prev => prev.map(day => {
      if (targetDays.includes(day.day)) {
        const newTask: Task = {
          id: `${day.day}-${groupId}`,
          text: newTaskText.trim(),
          completed: false,
          category: finalCategory,
          customCategoryName: finalCustomName,
          groupId: newTaskRepetition !== 'once' ? groupId : undefined
        };
        return { ...day, tasks: [...day.tasks, newTask] };
      }
      return day;
    }));

    setNewTaskText('');
    setNewTaskCategory('religious');
    setNewCustomCategoryName('');
    setNewTaskRepetition('once');
  };

  const deleteTask = (taskId: string) => {
    setDaysData(prev => prev.map(day => {
      if (day.day !== selectedDay) return day;
      return {
        ...day,
        tasks: day.tasks.filter(task => task.id !== taskId)
      };
    }));
  };

  const startEditing = (task: Task) => {
    setEditingTaskId(task.id);
    setEditTaskText(task.text);
    
    if (task.category === 'custom' && task.customCategoryName) {
      setEditTaskCategory(`custom:${task.customCategoryName}`);
    } else {
      setEditTaskCategory(task.category);
    }
    setEditCustomCategoryName('');
  };

  const cancelEditing = () => {
    setEditingTaskId(null);
    setEditTaskText('');
    setEditCustomCategoryName('');
  };

  const saveEdit = (taskId: string) => {
    if (!editTaskText.trim()) return;
    
    let finalCategory: TaskCategory = 'custom';
    let finalCustomName: string | undefined = undefined;

    if (editTaskCategory === 'religious' || editTaskCategory === 'sports' || editTaskCategory === 'food') {
      finalCategory = editTaskCategory;
    } else if (editTaskCategory.startsWith('custom:')) {
      finalCategory = 'custom';
      finalCustomName = editTaskCategory.split(':')[1];
    } else if (editTaskCategory === 'new_custom') {
      if (!editCustomCategoryName.trim()) return;
      finalCategory = 'custom';
      finalCustomName = editCustomCategoryName.trim();
      
      if (!savedCustomCategories.includes(finalCustomName)) {
        setSavedCustomCategories(prev => [...prev, finalCustomName!]);
      }
    }
    
    const taskToEdit = currentDayData.tasks.find(t => t.id === taskId);
    const groupId = taskToEdit?.groupId;

    setDaysData(prev => prev.map(day => {
      if (groupId) {
        return {
          ...day,
          tasks: day.tasks.map(task => 
            task.groupId === groupId 
              ? { 
                  ...task, 
                  text: editTaskText.trim(), 
                  category: finalCategory,
                  customCategoryName: finalCustomName
                } 
              : task
          )
        };
      } else {
        if (day.day !== selectedDay) return day;
        return {
          ...day,
          tasks: day.tasks.map(task => 
            task.id === taskId 
              ? { 
                  ...task, 
                  text: editTaskText.trim(), 
                  category: finalCategory,
                  customCategoryName: finalCustomName
                } 
              : task
          )
        };
      }
    }));
    setEditingTaskId(null);
  };

  const overallProgress = calculateOverallProgress();
  const currentDayProgress = calculateDayProgress(currentDayData);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 selection:bg-primary-500/30 font-sans pb-20 transition-colors duration-300" dir="rtl">
      {/* Header */}
      <header className="relative overflow-hidden bg-white border-b border-slate-200 pt-8 pb-10 px-6 transition-colors duration-300">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-30 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-96 h-96 rounded-full bg-primary-500/10 blur-3xl"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-96 h-96 rounded-full bg-blue-500/10 blur-3xl"></div>
        </div>
        
        <div className="max-w-4xl mx-auto relative z-10 flex flex-col">
          
          {/* Row 1: Greeting & Controls */}
          <div className="flex items-center justify-between mb-8">
            <div className="text-xl sm:text-2xl font-bold text-slate-700">
              مرحباً {userName}
            </div>
            <button onClick={handleLogout} className="text-sm font-medium text-slate-500 hover:text-red-500 transition-colors bg-slate-100 px-4 py-2 rounded-xl">
              تسجيل الخروج
            </button>
          </div>

          {/* Row 2: Main Title & Logo */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">مهامي الرمضانية</h1>
            
            <svg className="w-10 h-10 sm:w-12 sm:h-12 text-primary-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          </div>
          
          {/* Row 3: Full Width Monthly Progress */}
          <div className="w-full bg-slate-50 p-5 rounded-2xl border border-slate-100">
            <div className="flex justify-between items-end mb-3">
              <span className="text-base font-semibold text-slate-600">إنجاز الشهر الكريم</span>
              <span className="text-2xl font-black text-primary-500">{overallProgress}%</span>
            </div>
            <div className="w-full h-4 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-l from-primary-500 to-primary-300 transition-all duration-1000 ease-out relative"
                style={{ width: `${overallProgress}%` }}
              >
                <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]"></div>
              </div>
            </div>
          </div>

        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 mt-8">
        
        {/* Days Horizontal Scroll */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4 px-1">
            <Calendar className="w-5 h-5 text-slate-500" />
            <h2 className="text-lg font-bold text-slate-800">أيام الشهر</h2>
          </div>
          <div className="flex overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 gap-3 snap-x">
            {daysData.map((day) => {
              const progress = calculateDayProgress(day);
              const isSelected = selectedDay === day.day;
              const isCompleted = progress === 100;

              return (
                <button
                  key={day.day}
                  onClick={() => setSelectedDay(day.day)}
                  className={`snap-start shrink-0 relative flex flex-col items-center justify-center w-16 h-20 rounded-2xl transition-all duration-200 border ${
                    isSelected 
                      ? 'bg-primary-500 border-primary-400 text-white shadow-[0_0_15px_rgba(89,111,53,0.4)] scale-105' 
                      : isCompleted
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <span className={`text-xs font-medium mb-1 ${isSelected ? 'text-primary-100' : 'opacity-70'}`}>اليوم</span>
                  <span className="text-xl font-black">{day.day}</span>
                  
                  <div className="absolute bottom-2 w-8 h-1 bg-black/10 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${isSelected ? 'bg-white' : isCompleted ? 'bg-emerald-500' : 'bg-primary-500'}`}
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Content */}
        <div className="bg-white border border-slate-200 rounded-[2rem] p-6 sm:p-8 shadow-xl backdrop-blur-sm transition-colors duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-100">
            <div>
              <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                <Star className="w-8 h-8 text-primary-500 fill-primary-500/20" />
                مهام اليوم {selectedDay}
              </h2>
              <p className="text-slate-500 mt-2 text-base">أكمل مهامك لتعيش حياة ناجحة</p>
            </div>
            
            <div className="flex items-center gap-4 bg-slate-50 px-5 py-4 rounded-2xl border border-slate-200">
              <div className="text-right">
                <div className="text-sm font-medium text-slate-500 mb-1">إنجاز اليوم</div>
                <div className="text-2xl font-black text-slate-900">{currentDayProgress}%</div>
              </div>
              <div className="relative w-14 h-14 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-200"
                    strokeWidth="3"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-primary-500 transition-all duration-1000 ease-out"
                    strokeDasharray={`${currentDayProgress}, 100`}
                    strokeWidth="3"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Tasks List */}
          <div className="space-y-4 mb-8">
            {currentDayData.tasks.map((task) => {
              const catConfig = CATEGORY_CONFIG[task.category] || CATEGORY_CONFIG['custom'];
              const Icon = catConfig.icon;
              const isEditing = editingTaskId === task.id;
              
              // Display label: use custom name if provided, otherwise default category label
              const displayLabel = task.category === 'custom' && task.customCategoryName 
                ? task.customCategoryName 
                : catConfig.label;

              if (isEditing) {
                return (
                  <div key={task.id} className="bg-white border-2 border-primary-500/50 rounded-2xl p-5 shadow-lg transition-all">
                    <div className="flex flex-col gap-3">
                      <input 
                        type="text" 
                        value={editTaskText}
                        onChange={e => setEditTaskText(e.target.value)}
                        placeholder="نص المهمة..."
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                        autoFocus
                      />
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex items-center gap-2">
                          <select 
                            value={editTaskCategory}
                            onChange={e => setEditTaskCategory(e.target.value)}
                            className="bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 sm:w-48"
                          >
                            <option value="religious">ديني</option>
                            <option value="sports">رياضي</option>
                            <option value="food">أكل</option>
                            {savedCustomCategories.map(cat => (
                              <option key={`custom:${cat}`} value={`custom:${cat}`}>{cat}</option>
                            ))}
                            <option value="new_custom">+ إضافة فئة جديدة...</option>
                          </select>
                          {editTaskCategory.startsWith('custom:') && (
                            <button
                              type="button"
                              onClick={() => deleteCustomCategory(editTaskCategory.split(':')[1])}
                              className="p-3 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                              title="حذف هذه الفئة"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                        
                        {editTaskCategory === 'new_custom' && (
                          <input 
                            type="text" 
                            value={editCustomCategoryName}
                            onChange={e => setEditCustomCategoryName(e.target.value)}
                            placeholder="اسم الفئة (مثال: صحة)"
                            className="flex-1 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                          />
                        )}
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                      <button 
                        onClick={cancelEditing} 
                        className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors font-medium"
                      >
                        إلغاء
                      </button>
                      <button 
                        onClick={() => saveEdit(task.id)} 
                        disabled={editTaskCategory === 'new_custom' && !editCustomCategoryName.trim()}
                        className="px-4 py-2 rounded-xl bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 transition-colors flex items-center gap-2 font-medium shadow-md shadow-primary-500/20"
                      >
                        <Check className="w-4 h-4" /> حفظ
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div 
                  key={task.id}
                  className={`group flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl border-2 transition-all duration-300 ${
                    task.completed 
                      ? 'bg-emerald-50/50 border-emerald-200' 
                      : 'bg-white border-slate-100 hover:border-primary-200 shadow-sm hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-4 flex-1">
                    <button 
                      onClick={() => toggleTask(task.id)}
                      className={`shrink-0 mt-1 sm:mt-0 transition-colors duration-300 ${task.completed ? 'text-emerald-500' : 'text-slate-300 group-hover:text-primary-500'}`}
                    >
                      {task.completed ? <CheckCircle2 className="w-8 h-8" /> : <Circle className="w-8 h-8" />}
                    </button>
                    
                    <div className="flex-1 text-right">
                      <span className={`block text-lg sm:text-xl font-semibold transition-all duration-300 ${
                        task.completed ? 'text-slate-400 line-through decoration-emerald-300' : 'text-slate-800'
                      }`}>
                        {task.text}
                      </span>
                      
                      {/* Category Badge with Quick Change */}
                      <div className="flex items-center gap-2 mt-2">
                        <div className={`relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border cursor-pointer hover:opacity-80 transition-opacity ${catConfig.bg} ${catConfig.color} ${catConfig.border}`}>
                          <Icon className="w-3.5 h-3.5" />
                          {displayLabel}
                          <ChevronDown className="w-3 h-3 ml-1 opacity-50" />
                          
                          <select 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            value={task.category === 'custom' ? `custom:${task.customCategoryName}` : task.category}
                            onChange={(e) => handleQuickCategoryChange(task.id, e.target.value)}
                          >
                            <option value="religious">ديني</option>
                            <option value="sports">رياضي</option>
                            <option value="food">أكل</option>
                            {savedCustomCategories.map(cat => (
                              <option key={`custom:${cat}`} value={`custom:${cat}`}>{cat}</option>
                            ))}
                          </select>
                        </div>

                        {task.groupId && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                            <Repeat className="w-3 h-3" /> متكررة
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 sm:border-r border-slate-100 sm:pr-5">
                    <button 
                      onClick={() => startEditing(task)}
                      className="flex items-center gap-1.5 px-3 py-2 text-slate-500 hover:text-primary-500 hover:bg-primary-50 rounded-xl transition-colors"
                      title="تعديل المهمة"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span className="text-sm font-medium">تعديل</span>
                    </button>
                    
                    <button 
                      onClick={() => deleteTask(task.id)}
                      className="flex items-center gap-1.5 px-3 py-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      title="حذف المهمة"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="text-sm font-medium">حذف</span>
                    </button>
                  </div>
                </div>
              );
            })}
            
            {currentDayData.tasks.length === 0 && (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Star className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">لا توجد مهام لهذا اليوم. أضف مهمة جديدة للبدء!</p>
              </div>
            )}
          </div>

          {/* Add Task Form */}
          <div className="mt-8 bg-slate-50 p-5 sm:p-6 rounded-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary-500" /> إضافة مهمة جديدة
            </h3>
            <form onSubmit={addTask} className="flex flex-col gap-4">
              <input
                type="text"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                placeholder="نص المهمة..."
                className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl py-3 px-4 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all placeholder:text-slate-400 text-base font-medium"
              />
              
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center gap-2">
                  <select
                    value={newTaskCategory}
                    onChange={(e) => setNewTaskCategory(e.target.value)}
                    className="bg-white border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all text-sm font-medium sm:w-40 cursor-pointer"
                  >
                    <option value="religious">ديني</option>
                    <option value="sports">رياضي</option>
                    <option value="food">أكل</option>
                    {savedCustomCategories.map(cat => (
                      <option key={`custom:${cat}`} value={`custom:${cat}`}>{cat}</option>
                    ))}
                    <option value="new_custom">+ إضافة فئة جديدة...</option>
                  </select>
                  {newTaskCategory.startsWith('custom:') && (
                    <button
                      type="button"
                      onClick={() => deleteCustomCategory(newTaskCategory.split(':')[1])}
                      className="p-3 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                      title="حذف هذه الفئة"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {newTaskCategory === 'new_custom' && (
                  <input
                    type="text"
                    value={newCustomCategoryName}
                    onChange={(e) => setNewCustomCategoryName(e.target.value)}
                    placeholder="اسم الفئة (مثال: صحة)"
                    className="flex-1 bg-white border border-slate-200 text-slate-900 rounded-xl py-3 px-4 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all placeholder:text-slate-400 text-sm font-medium"
                  />
                )}

                <select
                  value={newTaskRepetition}
                  onChange={(e) => setNewTaskRepetition(e.target.value as RepetitionType)}
                  className="bg-white border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all text-sm font-medium sm:w-48 cursor-pointer"
                >
                  <option value="once">ليوم واحد</option>
                  <option value="every3days">كل 3 أيام</option>
                  <option value="everyday">طوال الشهر</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={!newTaskText.trim() || (newTaskCategory === 'new_custom' && !newCustomCategoryName.trim())}
                className="w-full sm:w-auto self-end mt-2 px-8 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 disabled:opacity-50 disabled:hover:bg-primary-500 transition-all transform active:scale-95 font-bold shadow-md shadow-primary-500/20"
              >
                إضافة المهمة
              </button>
            </form>
          </div>

          {/* AI Assistant Section */}
          <div className="mt-8 bg-slate-50 p-5 sm:p-6 rounded-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary-500" /> المساعد الذكي
            </h3>
            <form onSubmit={askAI} className="flex flex-col gap-4">
              <textarea
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder="اسأل المساعد الذكي عن أي شيء يخص رمضان..."
                className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl py-3 px-4 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all placeholder:text-slate-400 text-base font-medium resize-none h-24"
              />
              <button
                type="submit"
                disabled={!aiInput.trim() || isAiLoading}
                className="w-full sm:w-auto self-end px-8 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 disabled:opacity-50 disabled:hover:bg-primary-500 transition-all transform active:scale-95 font-bold shadow-md shadow-primary-500/20 flex items-center justify-center gap-2"
              >
                {isAiLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'إرسال'}
              </button>
            </form>
            {aiResponse && (
              <div className="mt-4 p-4 bg-white border border-slate-200 rounded-xl text-slate-700 whitespace-pre-wrap">
                {aiResponse}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
