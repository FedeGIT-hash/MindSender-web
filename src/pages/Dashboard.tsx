import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  setHours,
  setMinutes
} from 'date-fns';
import { es } from 'date-fns/locale';
import gsap from 'gsap';
import { Plus, ChevronLeft, ChevronRight, LogOut, BookOpen, FileText, CheckCircle2, Circle, Settings, Camera, User, X, Save, Bot, Moon, Sun, Bell, BellRing, AlertTriangle, Info, Clock, Trash2, ShieldCheck, Activity, Sparkles, Zap, Brain, Coffee, Layout, CreditCard, CalendarCheck } from 'lucide-react';
import SenderAI from '../components/AI/SenderAI';
import MembershipsSection from '../components/Dashboard/MembershipsSection';
import { useTheme } from '../context/ThemeContext';

import { Link } from 'react-router-dom';
import { lightFormat } from 'date-fns/lightFormat';

interface Task {
  id: string;
  subject: string;
  description: string;
  due_date: string;
  is_completed: boolean;
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [notifications] = useState([
    { id: 1, title: 'Bienvenido', message: 'Gracias por usar MindSender Beta. ¡Disfruta organizando!', type: 'info', time: 'Ahora' },
    { id: 2, title: 'Sistema Actualizado', message: 'Recien actualizado.', type: 'system', time: 'Hace 5m' }
  ]);
  const [newTask, setNewTask] = useState({ subject: '', description: '', due_time: '12:00' });
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState('');
  const [isDev, setIsDev] = useState(false);
  const [plan, setPlan] = useState<'free' | 'pro' | 'elite'>('free');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'agenda' | 'memberships'>('agenda');

  const [isNavExpanded, setIsNavExpanded] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current + 20) {
        setIsNavExpanded(true); // Scrolling down -> Stretch
      } else if (currentScrollY < lastScrollY.current - 20) {
        setIsNavExpanded(false); // Scrolling up -> Shrink
      }
      lastScrollY.current = currentScrollY;
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Creative Header State
  const [mantraIndex, setMantraIndex] = useState(() => {
    const saved = localStorage.getItem('mindSender_currentMode');
    return saved ? parseInt(saved) : 0;
  });

  const mantras = [
    { text: "Modo Creativo", icon: <Sparkles size={14} className="text-amber-400" /> },
    { text: "Focus Total", icon: <Zap size={14} className="text-yellow-400" /> },
    { text: "Flow State", icon: <Brain size={14} className="text-violet-400" /> },
    { text: "Break Time", icon: <Coffee size={14} className="text-emerald-400" /> },
    { text: "Descanso", icon: <CheckCircle2 size={11} className="text-purple-400" /> },
  ];

  useEffect(() => {
    localStorage.setItem('mindSender_currentMode', mantraIndex.toString());
  }, [mantraIndex]);

  const cycleMantra = () => {
    setMantraIndex((prev) => (prev + 1) % mantras.length);
  };

  const modalRef = useRef<HTMLDivElement>(null);
  const settingsModalRef = useRef<HTMLDivElement>(null);
  const settingsOverlayRef = useRef<HTMLDivElement>(null);
  const notificationsModalRef = useRef<HTMLDivElement>(null);
  const notificationsOverlayRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const appointmentsRef = useRef<HTMLDivElement>(null);

  const fetchTasks = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id);
    
    if (error) console.error('Error fetching tasks:', error);
    if (data) setTasks(data);
  };

  const fetchProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('full_name, plan, role')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return;
    }

    if (data) {
      if (data.full_name) {
        setUserName(data.full_name);
      }

      if (data.plan === 'pro' || data.plan === 'elite') {
        setPlan(data.plan);
      } else {
        setPlan('free');
      }

      if (data.role === 'admin') {
        setIsDev(true);
      }
    }
  };

  useEffect(() => {
    if (user?.user_metadata) {
      setUserName(user.user_metadata.full_name || user.email?.split('@')[0] || 'Usuario');
      setAvatarUrl(user.user_metadata.avatar_url || null);
      setIsDev(user.user_metadata.role === 'admin'); 
      if (user.user_metadata.plan === 'pro' || user.user_metadata.plan === 'elite') {
        setPlan(user.user_metadata.plan);
      } else {
        setPlan('free');
      }
    }
    
    if (user) {
      fetchTasks();
      fetchProfile();
    }

    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
    
    tl.fromTo(
      headerRef.current,
      { y: -24, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5 }
    )
      .fromTo(
        '.dashboard-control',
        { y: 16, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, stagger: 0.08 },
        '-=0.2'
      )
      .fromTo(
        '.calendar-card',
        { y: 16, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4 },
        '-=0.2'
      );

    return () => {
      tl.kill();
    };
  }, [user]);

  const openNotifications = () => {
    setIsNotificationsOpen(true);
    setTimeout(() => {
      if (notificationsModalRef.current && notificationsOverlayRef.current) {
        gsap.set(notificationsModalRef.current, { x: '100%', opacity: 0 });
        gsap.set(notificationsOverlayRef.current, { opacity: 0 });
        
        gsap.to(notificationsOverlayRef.current, { opacity: 1, duration: 0.3 });
        gsap.to(notificationsModalRef.current, { 
          x: '0%', 
          opacity: 1, 
          duration: 0.5, 
          ease: 'power3.out' 
        });
      }
    }, 10);
  };

  const closeNotifications = () => {
    if (notificationsModalRef.current && notificationsOverlayRef.current) {
      gsap.to(notificationsModalRef.current, { 
        x: '100%', 
        opacity: 0, 
        duration: 0.4, 
        ease: 'power3.in' 
      });
      gsap.to(notificationsOverlayRef.current, { 
        opacity: 0, 
        duration: 0.3, 
        delay: 0.1,
        onComplete: () => setIsNotificationsOpen(false) 
      });
    }
  };

  const handlePrevMonth = () => {
    gsap.to('.calendar-grid-content', {
      x: 20,
      opacity: 0,
      duration: 0.2,
      onComplete: () => {
        setCurrentDate(subMonths(currentDate, 1));
        gsap.fromTo('.calendar-grid-content',
          { x: -20, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.3, ease: 'power2.out' }
        );
      }
    });
  };

  const handleNextMonth = () => {
    gsap.to('.calendar-grid-content', {
      x: -20,
      opacity: 0,
      duration: 0.2,
      onComplete: () => {
        setCurrentDate(addMonths(currentDate, 1));
        gsap.fromTo('.calendar-grid-content',
          { x: 20, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.3, ease: 'power2.out' }
        );
      }
    });
  };

  const onDateClick = (date: Date) => {
    setSelectedDate(date);
    setEditingTask(null);
    setNewTask({ subject: '', description: '', due_time: '12:00' });
    openModal();
  };

  const handleEditTask = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTask(task);
    setSelectedDate(new Date(task.due_date));
    const taskDate = new Date(task.due_date);
    const hours = taskDate.getHours().toString().padStart(2, '0');
    const minutes = taskDate.getMinutes().toString().padStart(2, '0');
    setNewTask({ 
      subject: task.subject, 
      description: task.description, 
      due_time: `${hours}:${minutes}` 
    });
    openModal();
  };

  const openModal = () => {
    setIsModalOpen(true);
    setTimeout(() => {
      if (modalRef.current && overlayRef.current) {
        gsap.set(modalRef.current, { scale: 0.96, opacity: 0, y: 12 });
        gsap.set(overlayRef.current, { opacity: 0 });
        gsap.to(overlayRef.current, { opacity: 1, duration: 0.2, ease: 'power2.out' });
        gsap.to(modalRef.current, { 
          scale: 1, 
          opacity: 1, 
          y: 0, 
          duration: 0.25, 
          ease: 'power2.out' 
        });
      }
    }, 10);
  };

  const closeModal = () => {
    if (modalRef.current && overlayRef.current) {
      gsap.to(modalRef.current, { 
        scale: 0.98, 
        opacity: 0, 
        y: 8,
        duration: 0.18, 
        ease: 'power2.in',
        onComplete: () => {
          setIsModalOpen(false);
          setEditingTask(null);
          setNewTask({ subject: '', description: '', due_time: '12:00' });
        }
      });
      gsap.to(overlayRef.current, { opacity: 0, duration: 0.18, delay: 0.05 });
    }
  };

  const openSettings = () => {
    setIsSettingsOpen(true);
    setTimeout(() => {
      if (settingsModalRef.current && settingsOverlayRef.current) {
        gsap.set(settingsModalRef.current, { x: '100%', opacity: 0 });
        gsap.set(settingsOverlayRef.current, { opacity: 0 });
        
        gsap.to(settingsOverlayRef.current, { opacity: 1, duration: 0.3 });
        gsap.to(settingsModalRef.current, { 
          x: '0%', 
          opacity: 1, 
          duration: 0.5, 
          ease: 'power3.out' 
        });
      }
    }, 10);
  };

  const closeSettings = () => {
    if (settingsModalRef.current && settingsOverlayRef.current) {
      gsap.to(settingsModalRef.current, { 
        x: '100%', 
        opacity: 0, 
        duration: 0.4, 
        ease: 'power3.in' 
      });
      gsap.to(settingsOverlayRef.current, { 
        opacity: 0, 
        duration: 0.3, 
        delay: 0.1,
        onComplete: () => setIsSettingsOpen(false) 
      });
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Debe seleccionar una imagen para subir.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setAvatarUrl(data.publicUrl);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Error al subir la imagen. Asegúrate de que el bucket "avatars" exista en Supabase.');
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: userName,
          avatar_url: avatarUrl
        }
      });

      if (error) throw error;
      
      // Also try to update profiles table if it exists
      if (user) {
        await supabase
          .from('profiles')
          .update({ full_name: userName }) // We might not have avatar_url column in profiles yet
          .eq('id', user.id);
      }

      closeSettings();
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !user) return;
    
    setLoading(true);
    
    const [hours, minutes] = newTask.due_time.split(':').map(Number);
    const dueDate = setMinutes(setHours(selectedDate, hours), minutes);

  console.log('dueDate:', dueDate);
  const dueDateISO = dueDate.toISOString();
  console.log('dueDateISO:', dueDateISO);
  lightFormat(dueDate, 'yyyy-MM-dd HH:mm:ss');
  

    try {
      if (editingTask) {
        const { data, error } = await supabase
          .from('tasks')
          .update({
            subject: newTask.subject,
            description: newTask.description,
            due_date: dueDate.toISOString(),
          })
          .eq('id', editingTask.id)
          .select();

        if (error) throw error;
        if (data) {
          setTasks(tasks.map(t => t.id === editingTask.id ? data[0] : t));
        }
      } else {
        const { data, error } = await supabase
          .from('tasks')
          .insert([
            {
              user_id: user.id,
              subject: newTask.subject,
              description: newTask.description,
              due_date: dueDate.toISOString(),
              is_completed: false
            }
          ])
          .select();

        if (error) throw error;
        if (data) {
          setTasks([...tasks, data[0]]);
        }
      }

      setNewTask({ subject: '', description: '', due_time: '12:00' });
      closeModal();
    } catch (error) {
      console.error('Error handling task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!editingTask) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', editingTask.id);

      if (error) throw error;
      
      setTasks(tasks.filter(t => t.id !== editingTask.id));
      closeModal();
    } catch (error) {
      console.error('Error deleting task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleComplete = async (e: React.MouseEvent, taskToToggle: Task) => {
    e.stopPropagation();
    
    // Optimistic update
    const updatedTasks = tasks.map(t => 
        t.id === taskToToggle.id ? { ...t, is_completed: !t.is_completed } : t
    );
    setTasks(updatedTasks);

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ is_completed: !taskToToggle.is_completed })
        .eq('id', taskToToggle.id);

      if (error) {
        // Revert if error
        console.error('Error updating task:', error);
        setTasks(tasks);
      }
    } catch (error) {
      console.error('Error updating task:', error);
      setTasks(tasks);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const todayTasks = tasks.filter(t => isSameDay(new Date(t.due_date), new Date()) && !t.is_completed);

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Domingo
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
    const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    const days = eachDayOfInterval({
      start: startDate,
      end: endDate,
    });

    return (
      <div className="calendar-card bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Calendar Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-4">
            <h2 className="text-xl sm:text-2xl font-bold capitalize text-gray-900 dark:text-white flex items-center gap-2">
              {format(currentDate, 'MMMM', { locale: es })}
              <span className="text-gray-400 font-normal text-lg">
                {format(currentDate, 'yyyy', { locale: es })}
              </span>
            </h2>
          </div>
          <div className="flex gap-1">
            <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-600 dark:text-gray-300">
              <ChevronLeft size={20} />
            </button>
            <button onClick={handleNextMonth} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-600 dark:text-gray-300">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900">
          {/* Weekdays */}
          <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
            {weekDays.map((day) => (
              <div key={day} className="py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 auto-rows-fr bg-gray-200 dark:bg-gray-700 gap-px border-b border-gray-200 dark:border-gray-700">
            {days.map((day, idx) => {
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isToday = isSameDay(day, new Date());
              const dayTasks = tasks.filter(task => isSameDay(new Date(task.due_date), day));
              
              return (
                <div 
                  key={idx}
                  onClick={() => onDateClick(day)}
                  className={`relative min-h-[100px] sm:min-h-[120px] p-2 transition-colors cursor-pointer bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 ${
                    !isCurrentMonth ? 'bg-gray-50/50 dark:bg-gray-900/50 text-gray-400' : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-sm font-medium h-7 w-7 flex items-center justify-center rounded-full ${
                      isToday 
                        ? 'bg-emerald-600 text-white' 
                        : isCurrentMonth 
                          ? 'text-gray-700 dark:text-gray-200' 
                          : 'text-gray-400 dark:text-gray-600'
                    }`}>
                      {format(day, 'd')}
                    </span>
                    {dayTasks.length > 0 && (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1 mr-1"></span>
                    )}
                  </div>
                  
                  <div className="space-y-1 overflow-hidden">
                    {dayTasks.slice(0, 3).map((task) => (
                      <div 
                        key={task.id}
                        onClick={(e) => handleEditTask(task, e)}
                        className={`text-[10px] px-1.5 py-0.5 rounded truncate border ${
                          task.is_completed 
                            ? 'bg-gray-100 text-gray-400 border-transparent line-through' 
                            : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-800/30'
                        }`}
                      >
                        {task.subject}
                      </div>
                    ))}
                    {dayTasks.length > 3 && (
                      <div className="text-[10px] text-gray-400 pl-1">
                        + {dayTasks.length - 3} más
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans selection:bg-emerald-100 selection:text-emerald-900 dark:selection:bg-emerald-900 dark:selection:text-emerald-100 transition-colors duration-300 relative overflow-hidden">
      {/* Background */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-50 dark:opacity-40 pointer-events-none"
        style={{ backgroundImage: "url('/fondito.png')" }}
      />
      
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[15%] -left-[5%] w-[45%] h-[45%] bg-emerald-200/30 dark:bg-emerald-900/30 rounded-full blur-[90px]" />
        <div className="absolute bottom-[-10%] right-[5%] w-[35%] h-[35%] bg-teal-200/30 dark:bg-teal-900/30 rounded-full blur-[90px]" />
      </div>

      {/* Navbar */}
      <nav ref={headerRef} className="fixed top-0 w-full z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20 sm:h-24">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="relative">
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt="Profile" 
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl object-cover shadow-2xl shadow-emerald-200 dark:shadow-emerald-900/30 border-2 border-white dark:border-gray-700 transform hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl sm:rounded-2xl flex items-center justify-center text-white font-bold text-xl sm:text-2xl shadow-2xl shadow-emerald-200 dark:shadow-emerald-900/30 border-2 border-white dark:border-gray-700">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full shadow-sm"></div>
              </div>
              <div className="flex flex-col justify-center ml-2">
                <div 
                  onClick={cycleMantra}
                  className="cursor-pointer group select-none"
                >
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1.5 transition-colors group-hover:text-gray-600 dark:group-hover:text-gray-300">
                    {mantras[mantraIndex].icon}
                    STATUS
                    {isDev && (
                      <span className="ml-1 flex items-center gap-0.5 px-1.5 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-[9px] rounded-full border border-violet-200 dark:border-violet-800 font-bold">
                        DEV
                      </span>
                    )}
                  </span>
                  <div className="text-base sm:text-xl font-black text-gray-900 dark:text-white bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 group-hover:from-violet-600 group-hover:to-indigo-600 dark:group-hover:from-violet-400 dark:group-hover:to-indigo-400 transition-all duration-300">
                    {mantras[mantraIndex].text}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1 sm:gap-2">
              <button 
                onClick={toggleTheme}
                className="p-1.5 sm:p-2 text-gray-500 dark:text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-gray-800 dark:hover:text-amber-400 rounded-xl transition-all duration-300"
                title={theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
              >
                {theme === 'dark' ? <Sun size={20} className="sm:w-6 sm:h-6" /> : <Moon size={20} className="sm:w-6 sm:h-6" />}
              </button>

              {isDev && (
                <Link 
                  to="/admin"
                  className="p-1.5 sm:p-2 text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-xl transition-all duration-300 group"
                  title="Admin Panel"
                >
                  <ShieldCheck size={20} className="sm:w-6 sm:h-6 group-hover:scale-110 transition-transform" />
                </Link>
              )}

              <button 
                onClick={openNotifications}
                className="p-1.5 sm:p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-xl transition-all duration-300 relative group"
                title="Notificaciones"
              >
                <Bell size={20} className={`sm:w-6 sm:h-6 ${notifications.length > 0 ? "animate-swing" : ""}`} />
                {notifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                  </span>
                )}
              </button>


              <button 
                onClick={openSettings}
                className="p-1.5 sm:p-2 text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-gray-800 rounded-xl transition-all duration-300"
                title="Configuración"
              >
                <Settings size={20} className="sm:w-6 sm:h-6" />
              </button>

              <button 
                onClick={signOut}
                className="group flex items-center gap-2 px-2 sm:px-4 py-2 rounded-xl text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-gray-800 transition-all duration-300 font-medium"
              >
                <span className="hidden md:inline text-sm">Cerrar Sesión</span>
                <LogOut size={18} className="sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-24 sm:pt-32 pb-8 sm:pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
        <div className="mb-6 sm:mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-6">
          <div className="dashboard-control">
            <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-2 sm:mb-3 text-center sm:text-left">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500 dark:from-white dark:via-gray-200 dark:to-gray-400">
                Tu Agenda
              </span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-base sm:text-xl font-medium max-w-lg text-center sm:text-left">
              Organiza tus actividades con precisión y estilo.
            </p>
          </div>
        </div>

        {/* Layout con barra izquierda */}
        {activeTab === 'agenda' && (
        <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-6 dashboard-control">
          {/* Welcome Card - Spans 4 cols (Full Width) */}
          <div className="md:col-span-4 bg-gradient-to-br from-emerald-50 via-white to-emerald-100 dark:from-gray-800 dark:via-gray-800 dark:to-emerald-900 p-6 sm:p-8 rounded-[2.5rem] border border-white/50 dark:border-gray-700/60 shadow-lg transition-colors duration-300 relative overflow-hidden">
            
            <div className="relative z-10 flex flex-col justify-between h-full">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span className="p-1 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg"><Clock size={14} /></span>
                  {format(new Date(), 'EEEE, d MMMM', { locale: es })}
                </h3>
                <h2 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white mb-3 tracking-tight leading-tight">
                  {getGreeting()}, <br className="hidden sm:block"/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-green-500 to-teal-500 animate-gradient-x">{userName.split(' ')[0]}</span>.
                </h2>
                <p className="text-gray-500 dark:text-gray-400 font-medium text-lg sm:text-xl max-w-md leading-relaxed">
                  Tienes <span className="text-gray-900 dark:text-white font-bold decoration-emerald-400 underline decoration-2 underline-offset-2">{todayTasks.length} tareas</span> pendientes para hoy.
                </p>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <div className="flex -space-x-4">
                  {[1,2,3].map(i => (
                    <div key={i} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-4 border-white dark:border-gray-800 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center text-xs font-bold text-gray-500 shadow-lg transform hover:-translate-y-1 transition-transform">
                      <User size={18} />
                    </div>
                  ))}
                </div>
                <div className="flex items-center text-xs sm:text-sm font-bold text-gray-500 dark:text-gray-400 px-4 py-2 bg-white/70 dark:bg-gray-700/70 rounded-full border border-white/30 shadow-sm">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
                  Equipo MindSender
                </div>
              </div>
            </div>
          </div>

          {/* Sender AI Card */}
          <div 
            onClick={() => setIsAIOpen(true)}
            className="md:col-span-2 bg-gradient-to-br from-emerald-600 via-teal-600 to-indigo-600 dark:from-emerald-900 dark:via-teal-900 dark:to-indigo-900 text-white p-6 sm:p-8 rounded-[2.5rem] shadow-lg relative overflow-hidden cursor-pointer transition-transform duration-300 hover:-translate-y-1"
          >
            <div className="absolute -bottom-12 -right-12 w-56 h-56 bg-teal-400/30 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 w-full h-full bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="flex justify-between items-start">
                <div className="p-3.5 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-inner">
                  <Bot size={32} className="text-white drop-shadow-lg" />
                </div>
                <span className="px-3 py-1 bg-black/20 backdrop-blur-md rounded-full text-[10px] font-bold border border-white/10 text-teal-100 uppercase tracking-wider">Beta 1.1</span>
              </div>
              
              <div className="mt-8 transform transition-all duration-300 group-hover:translate-x-1">
                <h3 className="text-3xl font-black mb-2 tracking-tight">Sender AI</h3>
                <p className="text-teal-100 leading-relaxed mb-6 text-sm opacity-90 font-medium">
                  Tu asistente inteligente personal. Organiza, pregunta y optimiza tu tiempo con IA.
                </p>
                
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/10 shadow-lg">
                  <div className="flex items-center gap-3 text-sm text-teal-50 font-medium">
                    <span className="inline-flex h-3 w-3 rounded-full bg-emerald-500"></span>
                    <span>¿En qué puedo ayudarte hoy?</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {(isDev || plan === 'pro' || plan === 'elite') && (
            <div
              ref={appointmentsRef}
              className="md:col-span-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/50 dark:border-gray-700/50 shadow-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Citas</h3>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  {isDev && plan === 'elite' ? 'Admin · Elite' : isDev ? 'Admin' : 'Pro'}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Agenda sesiones uno a uno para hablar de proyectos, tareas o programas locales.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-xl">
                  <p className="text-xs font-bold text-gray-600 dark:text-gray-300">Próxima cita</p>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">Sin datos aún</p>
                </div>
                <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-xl">
                  <p className="text-xs font-bold text-gray-600 dark:text-gray-300">Resumen semanal</p>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">0 citas</p>
                </div>
              </div>
              <div className="mt-4">
                <button className="w-full px-4 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-500/20">
                  Confirmar Cita
                </button>
              </div>
            </div>
          )}

          {/* Quick Stats / Action */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/50 dark:border-gray-700/50 shadow-lg flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-lime-100 dark:bg-lime-900/30 text-lime-600 dark:text-lime-400 rounded-2xl">
                <Activity size={24} />
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded-lg">Diario</span>
            </div>
            <div>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter">
                  {Math.round((tasks.filter(t => t.is_completed).length / (tasks.length || 1)) * 100)}%
                </span>
                <span className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Completado</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-700 h-3 rounded-full overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-lime-500 to-emerald-500 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${(tasks.filter(t => t.is_completed).length / (tasks.length || 1)) * 100}%` }}
                />
              </div>
            </div>
          </div>
          
           {/* Add Task Quick Button */}
           <button 
            onClick={() => onDateClick(new Date())}
            className="bg-gray-900 dark:bg-emerald-600 text-white p-6 rounded-[2.5rem] shadow-lg flex items-center justify-between transition-colors duration-300 relative overflow-hidden hover:bg-black dark:hover:bg-emerald-500"
           >
             <div className="flex flex-col items-start relative z-10">
               <span className="text-xl font-bold tracking-tight">Nueva Tarea</span>
               <span className="text-sm text-gray-400 dark:text-emerald-100">Crear recordatorio</span>
             </div>
             <div className="p-4 bg-white/10 rounded-full shadow-lg backdrop-blur-sm border border-white/10">
               <Plus size={24} />
             </div>
           </button>
        </div>
        )}

        {/* Sección de Suscripciones */}
        {activeTab === 'memberships' && (
          <MembershipsSection onBack={() => setActiveTab('agenda')} />
        )}

        <div ref={calendarRef}>{renderCalendar()}</div>
      </main>

      {/* Settings Panel - Side Drawer */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div 
            ref={settingsOverlayRef}
            className="absolute inset-0 bg-gray-900/20 dark:bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={closeSettings}
          ></div>
          
          <div className="absolute inset-y-0 right-0 max-w-full flex">
            <div 
              ref={settingsModalRef}
              className="w-full sm:w-screen sm:max-w-md bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-2xl flex flex-col h-full border-l border-white/20 dark:border-gray-800"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 dark:border-gray-800">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Perfil y Configuración</h2>
                <button 
                  onClick={closeSettings}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                <form onSubmit={handleUpdateProfile} className="space-y-6 sm:space-y-8">
                  {/* Profile Photo Section */}
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                      <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 shadow-2xl ring-4 ring-emerald-50 dark:ring-emerald-900/20 transition-all group-hover:ring-emerald-100 dark:group-hover:ring-emerald-900/40">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-500">
                            <User size={40} className="sm:w-12 sm:h-12" />
                          </div>
                        )}
                      </div>
                      
                      {/* Overlay for edit */}
                      <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-[2px]">
                        <Camera className="text-white drop-shadow-md transform scale-90 group-hover:scale-100 transition-transform sm:w-8 sm:h-8" size={24} />
                      </div>

                      {/* Loading indicator */}
                      {uploading && (
                        <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 rounded-full flex items-center justify-center z-10">
                          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>
                    
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      disabled={uploading}
                    />
                    
                    <div className="text-center">
                      <p className="text-xs sm:text-sm font-semibold text-emerald-600 dark:text-emerald-400 cursor-pointer hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors" onClick={() => fileInputRef.current?.click()}>
                        Cambiar foto de perfil
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Nombre Completo</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <User className="text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
                        </div>
                        <input
                          type="text"
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                          className="block w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 bg-gray-50 dark:bg-gray-800/50 border-2 border-gray-100 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl sm:rounded-2xl focus:bg-white dark:focus:bg-gray-800 focus:border-emerald-500 focus:ring-0 transition-all outline-none font-medium placeholder:text-gray-400 text-sm sm:text-base"
                          placeholder="Tu nombre"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 sm:pt-4">
                    <button
                      type="submit"
                      disabled={loading || uploading}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-gray-900 dark:bg-emerald-600 text-white font-bold hover:bg-emerald-600 dark:hover:bg-emerald-500 transition-all duration-300 shadow-lg shadow-gray-200 dark:shadow-emerald-900/20 hover:shadow-emerald-500/30 disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-0.5 text-sm sm:text-base"
                    >
                      {loading ? (
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Save size={18} />
                          <span>Guardar Cambios</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Drawer */}
      {isNotificationsOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div 
            ref={notificationsOverlayRef}
            className="absolute inset-0 bg-gray-900/20 dark:bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={closeNotifications}
          ></div>
          
          <div className="absolute inset-y-0 right-0 max-w-full flex">
            <div 
              ref={notificationsModalRef}
              className="w-full sm:w-screen sm:max-w-md bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-2xl flex flex-col h-full border-l border-white/20 dark:border-gray-800"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-900">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <BellRing className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Notificaciones</h2>
                    <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Mantente al tanto de todo</p>
                  </div>
                </div>
                <button 
                  onClick={closeNotifications}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      className="group p-3 sm:p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-xl sm:rounded-2xl hover:border-blue-200 dark:hover:border-blue-900/50 hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 cursor-pointer relative overflow-hidden"
                    >
                      <div className="flex gap-3 sm:gap-4">
                        <div className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl shrink-0 h-fit ${
                          notif.type === 'info' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                          notif.type === 'alert' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' :
                          'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {notif.type === 'alert' ? <AlertTriangle size={16} className="sm:w-5 sm:h-5" /> : <Info size={16} className="sm:w-5 sm:h-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-0.5 sm:mb-1">
                            <h4 className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm truncate pr-2">{notif.title}</h4>
                            <span className="text-[8px] sm:text-[10px] text-gray-400 dark:text-gray-500 font-medium whitespace-nowrap">{notif.time}</span>
                          </div>
                          <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{notif.message}</p>
                        </div>
                      </div>
                      {/* Decorative gradient on hover */}
                      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6 sm:p-10">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                      <Bell className="w-8 h-8 sm:w-10 sm:h-10 text-gray-300 dark:text-gray-600" />
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Sin notificaciones</h3>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2">Todo está al día por ahora.</p>
                  </div>
                )}

                {/* System Alerts Space Placeholder */}
                <div className="mt-6 sm:mt-8 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 dark:from-black dark:to-gray-900 text-white relative overflow-hidden border border-white/10">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Bot size={60} className="sm:w-20 sm:h-20" />
                  </div>
                  <h4 className="text-base sm:text-lg font-bold mb-1.5 sm:mb-2 flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-blue-400 animate-pulse"></span>
                    Alertas del Sistema
                  </h4>
                  <p className="text-[10px] sm:text-xs text-gray-400 leading-relaxed">
                    Este espacio está reservado para notificaciones críticas y mensajes de Sender AI.
                  </p>
                  <div className="mt-3 sm:mt-4 flex gap-2">
                    <div className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 w-1/3"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modern Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            ref={overlayRef}
            className="absolute inset-0 bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={closeModal}
          ></div>
          <div 
            ref={modalRef}
            className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-[1.5rem] sm:rounded-[2.5rem] shadow-2xl w-full max-w-md p-6 sm:p-8 relative z-10 border border-white/20 dark:border-gray-800"
          >
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
              <button onClick={closeModal} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-full transition-colors">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>

            <div className="mb-6 sm:mb-8">
              <span className="inline-block px-4 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-[10px] sm:text-xs font-bold tracking-wide uppercase mb-3 sm:mb-4 border border-emerald-200 dark:border-emerald-800">
                {editingTask ? 'Editar Actividad' : 'Nueva Entrada'}
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                {editingTask ? 'Modificar Tarea' : 'Crear Tarea'}
              </h3>
              <p className="text-sm sm:text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-2 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50"></span>
                {selectedDate && format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}
              </p>
            </div>

            <form onSubmit={handleAddTask} className="space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Materia / Asignatura</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <BookOpen className="text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Matemáticas Avanzadas"
                    className="block w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 bg-gray-50 dark:bg-gray-800/50 border-2 border-gray-100 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl sm:rounded-2xl focus:bg-white dark:focus:bg-gray-800 focus:border-emerald-500 focus:ring-0 transition-all outline-none font-medium placeholder:text-gray-400 text-sm sm:text-base"
                    value={newTask.subject}
                    onChange={(e) => setNewTask({ ...newTask, subject: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Hora de Entrega</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Clock className="text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
                    </div>
                    <input
                      type="time"
                      required
                      className="block w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 bg-gray-50 dark:bg-gray-800/50 border-2 border-gray-100 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl sm:rounded-2xl focus:bg-white dark:focus:bg-gray-800 focus:border-emerald-500 focus:ring-0 transition-all outline-none font-medium text-sm sm:text-base"
                      value={newTask.due_time}
                      onChange={(e) => setNewTask({ ...newTask, due_time: e.target.value })}
                    />
                  </div>
                </div>

                {editingTask && (
                  <div className="space-y-2">
                    <label className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Estado</label>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        handleToggleComplete(e as any, editingTask);
                        closeModal();
                      }}
                      className={`flex items-center gap-3 w-full px-4 py-3 sm:py-4 rounded-xl sm:rounded-2xl border-2 transition-all duration-300 font-bold text-sm sm:text-base ${
                        editingTask.is_completed 
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400' 
                          : 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {editingTask.is_completed ? (
                        <>
                          <CheckCircle2 size={20} className="text-emerald-500" />
                          <span>Completada</span>
                        </>
                      ) : (
                        <>
                          <Circle size={20} />
                          <span>Pendiente</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Descripción</label>
                <div className="relative group">
                  <div className="absolute top-3.5 left-4 pointer-events-none">
                    <FileText className="text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
                  </div>
                  <textarea
                    required
                    placeholder="¿Qué necesitas realizar?"
                    rows={3}
                    className="block w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 bg-gray-50 dark:bg-gray-800/50 border-2 border-gray-100 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl sm:rounded-2xl focus:bg-white dark:focus:bg-gray-800 focus:border-emerald-500 focus:ring-0 transition-all outline-none font-medium placeholder:text-gray-400 resize-none text-sm sm:text-base"
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 sm:pt-4">
                {editingTask && (
                  <button
                    type="button"
                    onClick={handleDeleteTask}
                    className="flex items-center justify-center gap-2 px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-all duration-200 text-sm sm:text-base border border-red-100 dark:border-red-900/30"
                  >
                    <Trash2 size={18} />
                    <span>Eliminar</span>
                  </button>
                )}
                <div className="flex flex-1 gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl border-2 border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-all duration-200 text-sm sm:text-base"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-gray-900 dark:bg-emerald-600 text-white font-bold hover:bg-emerald-600 dark:hover:bg-emerald-500 transition-all duration-300 shadow-lg shadow-gray-200 dark:shadow-emerald-900/20 hover:shadow-emerald-500/30 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform hover:-translate-y-0.5 text-sm sm:text-base"
                  >
                    {loading ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>{editingTask ? 'Actualizar' : 'Guardar'}</span>
                        <ChevronRight size={18} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Liquid Glass Navigation Oval */}
      <div 
        className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${
          isNavExpanded 
            ? 'w-[90%] sm:w-[600px] px-8 py-4 rounded-[2rem] bg-white/40 dark:bg-black/40' 
            : 'w-auto px-6 py-3 rounded-full bg-white/20 dark:bg-black/20'
        } backdrop-blur-xl border border-white/30 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] flex items-center overflow-hidden`}
      >
        <div className={`flex items-center w-full ${isNavExpanded ? 'justify-between' : 'gap-6'}`}>
           {/* Agenda */}
           <button 
             onClick={() => setActiveTab('agenda')}
             className={`flex items-center justify-center gap-2 text-gray-700 dark:text-white transition-colors hover:text-emerald-600 dark:hover:text-emerald-400 ${activeTab === 'agenda' ? 'text-emerald-600 dark:text-emerald-400' : ''}`}
             title="Agenda"
           >
             <Layout size={24} />
             <span className={`font-bold text-sm whitespace-nowrap overflow-hidden transition-all duration-500 ${isNavExpanded ? 'max-w-[100px] opacity-100 ml-2' : 'max-w-0 opacity-0 ml-0'}`}>
               Agenda
             </span>
           </button>

           {/* Membresías */}
           <button 
             onClick={() => setActiveTab('memberships')}
             className={`flex items-center justify-center gap-2 text-gray-700 dark:text-white transition-colors hover:text-emerald-600 dark:hover:text-emerald-400 ${activeTab === 'memberships' ? 'text-emerald-600 dark:text-emerald-400' : ''}`}
             title="Membresías"
           >
             <CreditCard size={24} />
             <span className={`font-bold text-sm whitespace-nowrap overflow-hidden transition-all duration-500 ${isNavExpanded ? 'max-w-[100px] opacity-100 ml-2' : 'max-w-0 opacity-0 ml-0'}`}>
               Membresías
             </span>
           </button>

           {/* Citas */}
           <button 
             onClick={() => {
                setActiveTab('agenda');
                setTimeout(() => appointmentsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
             }}
             className="flex items-center justify-center gap-2 text-gray-700 dark:text-white transition-colors hover:text-emerald-600 dark:hover:text-emerald-400"
             title="Citas"
           >
             <CalendarCheck size={24} />
             <span className={`font-bold text-sm whitespace-nowrap overflow-hidden transition-all duration-500 ${isNavExpanded ? 'max-w-[100px] opacity-100 ml-2' : 'max-w-0 opacity-0 ml-0'}`}>
               Citas
             </span>
           </button>

           {/* Sender AI */}
           <button 
             onClick={() => setIsAIOpen(true)}
             className="flex items-center justify-center gap-2 text-gray-700 dark:text-white transition-colors hover:text-teal-500"
             title="Sender AI"
           >
             <Bot size={24} />
             <span className={`font-bold text-sm whitespace-nowrap overflow-hidden transition-all duration-500 ${isNavExpanded ? 'max-w-[100px] opacity-100 ml-2' : 'max-w-0 opacity-0 ml-0'}`}>
               Sender AI
             </span>
           </button>

           {/* Configuración */}
           <button 
             onClick={openSettings}
             className="flex items-center justify-center gap-2 text-gray-700 dark:text-white transition-colors hover:text-gray-900 dark:hover:text-gray-200"
             title="Configuración"
           >
             <Settings size={24} />
             <span className={`font-bold text-sm whitespace-nowrap overflow-hidden transition-all duration-500 ${isNavExpanded ? 'max-w-[100px] opacity-100 ml-2' : 'max-w-0 opacity-0 ml-0'}`}>
               Configuración
             </span>
           </button>
        </div>
      </div>

      {/* Sender AI Interface */}
      <SenderAI 
        isOpen={isAIOpen} 
        onClose={() => setIsAIOpen(false)} 
        onTaskAction={fetchTasks}
      />
    </div>
  );
}
