import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import TextType from '../components/TextType';
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
import { Plus, ChevronLeft, ChevronRight, LogOut, BookOpen, FileText, CheckCircle2, Circle, Settings, Camera, User, X, Save } from 'lucide-react';

interface Task {
  id: string;
  subject: string;
  description: string;
  due_date: string;
  is_completed: boolean;
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState({ subject: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const settingsModalRef = useRef<HTMLDivElement>(null);
  const settingsOverlayRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Get user name and avatar from metadata
    if (user?.user_metadata) {
      setUserName(user.user_metadata.full_name || user.email?.split('@')[0] || 'Usuario');
      setAvatarUrl(user.user_metadata.avatar_url || null);
    }
    
    if (user) {
      const fetchTasks = async () => {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id);
        
        if (error) console.error('Error fetching tasks:', error);
        if (data) setTasks(data);
      };
      fetchTasks();
    }

    // Header animation with improved staggering
    const tl = gsap.timeline();
    
    tl.fromTo(headerRef.current, 
      { y: -20, opacity: 0 }, 
      { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }
    )
    .fromTo('.dashboard-control',
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power3.out' },
      '-=0.4'
    )
    .fromTo('.calendar-card', 
      { scale: 0.95, opacity: 0 }, 
      { scale: 1, opacity: 1, duration: 0.8, ease: 'power3.out' },
      '-=0.4'
    );
    
  }, [user]);

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
    openModal();
  };

  const openModal = () => {
    setIsModalOpen(true);
    // Refined animation for modal
    setTimeout(() => {
      if (modalRef.current && overlayRef.current) {
        gsap.set(modalRef.current, { scale: 0.9, opacity: 0, y: 20 });
        gsap.set(overlayRef.current, { opacity: 0 });
        
        gsap.to(overlayRef.current, { opacity: 1, duration: 0.3, ease: 'power2.out' });
        gsap.to(modalRef.current, { 
          scale: 1, 
          opacity: 1, 
          y: 0, 
          duration: 0.4, 
          ease: 'back.out(1.2)' 
        });
      }
    }, 10);
  };

  const closeModal = () => {
    if (modalRef.current && overlayRef.current) {
      gsap.to(modalRef.current, { 
        scale: 0.95, 
        opacity: 0, 
        y: 10,
        duration: 0.2, 
        ease: 'power2.in',
        onComplete: () => setIsModalOpen(false)
      });
      gsap.to(overlayRef.current, { opacity: 0, duration: 0.2, delay: 0.1 });
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
    
    const dueDate = setMinutes(setHours(selectedDate, 12), 0);

    try {
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
        setNewTask({ subject: '', description: '' });
        closeModal();
      }
    } catch (error) {
      console.error('Error adding task:', error);
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

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { locale: es });
    const endDate = endOfWeek(monthEnd, { locale: es });
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    return (
      <div className="calendar-card bg-white/90 backdrop-blur-md rounded-3xl shadow-xl border border-white/50 overflow-hidden transition-all duration-300 hover:shadow-2xl">
        {/* Calendar Header */}
        <div className="flex justify-between items-center p-6 bg-gradient-to-r from-emerald-600 to-green-500 text-white">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <h2 className="text-2xl font-bold capitalize tracking-tight">
                {format(currentDate, 'MMMM', { locale: es })}
              </h2>
              <span className="text-emerald-100 text-sm font-medium tracking-widest uppercase">
                {format(currentDate, 'yyyy', { locale: es })}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handlePrevMonth} className="p-2.5 hover:bg-white/20 rounded-xl transition-all active:scale-95 backdrop-blur-sm">
              <ChevronLeft size={24} />
            </button>
            <button onClick={handleNextMonth} className="p-2.5 hover:bg-white/20 rounded-xl transition-all active:scale-95 backdrop-blur-sm">
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
        
        {/* Days Header */}
        <div className="grid grid-cols-7 text-center bg-gray-50/50 border-b border-gray-100">
          {weekDays.map(day => (
            <div key={day} className="py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="calendar-grid-content grid grid-cols-7 bg-gray-50/30">
          {days.map((day) => {
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isToday = isSameDay(day, new Date());
            const dayTasks = tasks.filter(task => isSameDay(new Date(task.due_date), day));
            
            return (
              <div
                key={day.toString()}
                onClick={() => onDateClick(day)}
                className={`
                  min-h-[140px] p-3 border-b border-r border-gray-100/50 transition-all cursor-pointer group relative
                  ${!isCurrentMonth ? 'bg-gray-50/50 text-gray-300' : 'bg-white hover:bg-emerald-50/30'}
                  ${isToday ? 'bg-emerald-50/50' : ''}
                `}
              >
                <div className={`
                  flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium mb-2 transition-all
                  ${isToday ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'group-hover:bg-gray-100 text-gray-600'}
                `}>
                  {format(day, 'd')}
                </div>
                
                <div className="space-y-1.5 overflow-y-auto max-h-[90px] pr-1 custom-scrollbar">
                  {dayTasks.map(task => (
                    <div 
                      key={task.id} 
                      onClick={(e) => handleToggleComplete(e, task)}
                      className={`
                        group/task flex items-center gap-2 p-1.5 rounded-lg text-xs border transition-all duration-200
                        ${task.is_completed 
                          ? 'bg-gray-100 text-gray-400 border-gray-100 decoration-gray-400' 
                          : 'bg-white text-gray-700 border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200 hover:-translate-y-0.5'
                        }
                      `}
                    >
                      <div className={`shrink-0 ${task.is_completed ? 'text-gray-300' : 'text-emerald-500'}`}>
                        {task.is_completed ? <CheckCircle2 size={12} /> : <Circle size={12} />}
                      </div>
                      <span className={`truncate font-medium ${task.is_completed ? 'line-through' : ''}`}>
                        {task.subject}
                      </span>
                    </div>
                  ))}
                </div>
                
                {/* Add indicator on hover */}
                {isCurrentMonth && (
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-400">
                    <Plus size={16} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-gray-50 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Navbar */}
      <nav ref={headerRef} className="fixed top-0 w-full z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="relative">
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt="Profile" 
                    className="w-10 h-10 rounded-xl object-cover shadow-lg shadow-emerald-200 border-2 border-white"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-emerald-200">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              <div>
                <div className="text-sm text-gray-400 font-medium">Bienvenido</div>
                <div className="font-bold text-gray-900 text-lg leading-none">
                  <TextType 
                    text={[userName]} 
                    typingSpeed={100} 
                    deletingSpeed={50} 
                    pauseDuration={5000} 
                    loop={false}
                    className="text-gray-900"
                    cursorCharacter=""
                  />
                </div>
              </div>
            </div>
            
            <button 
              onClick={signOut}
              className="group flex items-center gap-2 px-4 py-2 rounded-xl text-gray-500 hover:text-red-500 hover:bg-red-50 transition-all duration-300 font-medium"
            >
              <span className="hidden sm:inline">Cerrar Sesión</span>
              <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="dashboard-control">
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">
              Tu Agenda
            </h1>
            <p className="text-gray-500 text-lg">
              Organiza tus actividades y mantén el control.
            </p>
          </div>
          
          <button 
            onClick={() => onDateClick(new Date())}
            className="dashboard-control group flex items-center gap-2 bg-gray-900 text-white px-6 py-3.5 rounded-2xl hover:bg-emerald-600 transition-all duration-300 shadow-xl hover:shadow-emerald-500/30 active:scale-95"
          >
            <div className="bg-white/20 p-1 rounded-lg group-hover:bg-white/30 transition-colors">
              <Plus size={20} />
            </div>
            <span className="font-semibold">Nueva Tarea</span>
          </button>
        </div>

        {renderCalendar()}
      </main>

        </div>

        {renderCalendar()}
      </main>

      {/* Settings Panel - Side Drawer */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div 
            ref={settingsOverlayRef}
            className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm transition-opacity"
            onClick={closeSettings}
          ></div>
          
          <div className="absolute inset-y-0 right-0 max-w-full flex">
            <div 
              ref={settingsModalRef}
              className="w-screen max-w-md bg-white shadow-2xl flex flex-col h-full border-l border-gray-100"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900">Perfil y Configuración</h2>
                <button 
                  onClick={closeSettings}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <form onSubmit={handleUpdateProfile} className="space-y-8">
                  {/* Profile Photo Section */}
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                      <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl ring-4 ring-emerald-50 transition-all group-hover:ring-emerald-100">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-300">
                            <User size={48} />
                          </div>
                        )}
                      </div>
                      
                      {/* Overlay for edit */}
                      <div className="absolute inset-0 bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                        <Camera className="text-white drop-shadow-md" size={32} />
                      </div>

                      {/* Loading indicator */}
                      {uploading && (
                        <div className="absolute inset-0 bg-white/80 rounded-full flex items-center justify-center z-10">
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
                      <p className="text-sm font-medium text-emerald-600 cursor-pointer hover:text-emerald-700" onClick={() => fileInputRef.current?.click()}>
                        Cambiar foto de perfil
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 ml-1">Nombre Completo</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <User className="text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
                        </div>
                        <input
                          type="text"
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                          className="block w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 text-gray-900 rounded-2xl focus:bg-white focus:border-emerald-500 focus:ring-0 transition-all outline-none font-medium"
                          placeholder="Tu nombre"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={loading || uploading}
                      className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-gray-900 text-white font-bold hover:bg-emerald-600 transition-all duration-300 shadow-lg shadow-gray-200 hover:shadow-emerald-500/30 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Save size={20} />
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

      {/* Modern Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            ref={overlayRef}
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
            onClick={closeModal}
          ></div>
          <div 
            ref={modalRef}
            className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md p-8 relative z-10 border border-gray-100"
          >
            <div className="absolute top-6 right-6">
              <button onClick={closeModal} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>

            <div className="mb-8">
              <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold tracking-wide uppercase mb-3">
                Nueva Entrada
              </span>
              <h3 className="text-3xl font-bold text-gray-900">
                Crear Tarea
              </h3>
              <p className="text-gray-500 mt-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                {selectedDate && format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}
              </p>
            </div>

            <form onSubmit={handleAddTask} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 ml-1">Materia / Asignatura</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <BookOpen className="text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Matemáticas Avanzadas"
                    className="block w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 text-gray-900 rounded-2xl focus:bg-white focus:border-emerald-500 focus:ring-0 transition-all outline-none font-medium placeholder:text-gray-400"
                    value={newTask.subject}
                    onChange={(e) => setNewTask({ ...newTask, subject: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 ml-1">Descripción</label>
                <div className="relative group">
                  <div className="absolute top-4 left-4 pointer-events-none">
                    <FileText className="text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
                  </div>
                  <textarea
                    required
                    placeholder="¿Qué necesitas realizar?"
                    rows={4}
                    className="block w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 text-gray-900 rounded-2xl focus:bg-white focus:border-emerald-500 focus:ring-0 transition-all outline-none font-medium placeholder:text-gray-400 resize-none"
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-6 py-4 rounded-2xl border-2 border-gray-100 text-gray-600 font-bold hover:bg-gray-50 hover:text-gray-900 transition-all duration-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-4 rounded-2xl bg-gray-900 text-white font-bold hover:bg-emerald-600 transition-all duration-300 shadow-lg shadow-gray-200 hover:shadow-emerald-500/30 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Guardar</span>
                      <ChevronRight size={18} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
