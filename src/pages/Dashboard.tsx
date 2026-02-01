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
import { Plus, ChevronLeft, ChevronRight, LogOut, BookOpen, FileText } from 'lucide-react';

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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState({ subject: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState('');

  const modalRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Get user name from metadata or profile
    if (user?.user_metadata?.full_name) {
      setUserName(user.user_metadata.full_name);
    } else {
      setUserName(user?.email?.split('@')[0] || 'Usuario');
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

    // Header animation
    gsap.fromTo(headerRef.current, 
      { y: -50, opacity: 0 }, 
      { y: 0, opacity: 1, duration: 1, ease: 'power3.out' }
    );

    // Main content animation
    gsap.fromTo('.dashboard-main', 
      { opacity: 0, y: 20 }, 
      { opacity: 1, y: 0, duration: 0.8, delay: 0.3, ease: 'power3.out' }
    );
  }, [user]);

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const onDateClick = (date: Date) => {
    setSelectedDate(date);
    openModal();
  };

  const openModal = () => {
    setIsModalOpen(true);
    // Animation for modal
    setTimeout(() => {
      if (modalRef.current && overlayRef.current) {
        gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3 });
        gsap.fromTo(modalRef.current, 
          { scale: 0.5, opacity: 0, rotation: -10 }, 
          { scale: 1, opacity: 1, rotation: 0, duration: 0.5, ease: 'back.out(1.7)' }
        );
      }
    }, 10);
  };

  const closeModal = () => {
    if (modalRef.current && overlayRef.current) {
      gsap.to(modalRef.current, { 
        scale: 0.5, 
        opacity: 0, 
        rotation: 10, 
        duration: 0.3, 
        ease: 'power3.in',
        onComplete: () => setIsModalOpen(false)
      });
      gsap.to(overlayRef.current, { opacity: 0, duration: 0.3 });
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
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="flex justify-between items-center p-4 bg-green-600 text-white">
          <button onClick={handlePrevMonth} className="p-2 hover:bg-green-700 rounded-full">
            <ChevronLeft />
          </button>
          <h2 className="text-xl font-bold capitalize">
            {format(currentDate, 'MMMM yyyy', { locale: es })}
          </h2>
          <button onClick={handleNextMonth} className="p-2 hover:bg-green-700 rounded-full">
            <ChevronRight />
          </button>
        </div>
        
        <div className="grid grid-cols-7 text-center bg-green-50 border-b border-green-100">
          {weekDays.map(day => (
            <div key={day} className="py-2 font-semibold text-green-800">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {days.map((day) => {
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isToday = isSameDay(day, new Date());
            const dayTasks = tasks.filter(task => isSameDay(new Date(task.due_date), day));
            
            return (
              <div
                key={day.toString()}
                onClick={() => onDateClick(day)}
                className={`
                  min-h-[100px] p-2 border border-gray-100 transition-all cursor-pointer hover:bg-green-50
                  ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'}
                  ${isToday ? 'bg-green-100 font-bold text-green-700' : ''}
                `}
              >
                <div className="text-right text-sm mb-1">{format(day, 'd')}</div>
                <div className="space-y-1">
                  {dayTasks.map(task => (
                    <div 
                      key={task.id} 
                      onClick={(e) => handleToggleComplete(e, task)}
                      className={`text-xs p-1 rounded truncate cursor-pointer hover:opacity-80 transition-opacity ${task.is_completed ? 'bg-gray-200 text-gray-500 line-through' : 'bg-green-100 text-green-700'}`}
                      title="Click para marcar como completada/pendiente"
                    >
                      {task.subject}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header ref={headerRef} className="bg-white shadow-md p-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <TextType 
                text={[`Hola bienvenido ${userName}`, `Es un gusto verte ${userName}`]} 
                typingSpeed={100} 
                deletingSpeed={50} 
                pauseDuration={2000} 
                loop={true}
                className="text-green-600"
                cursorCharacter="|"
              />
            </h1>
          </div>
          <button 
            onClick={signOut}
            className="flex items-center gap-2 text-gray-600 hover:text-red-500 transition-colors"
          >
            <LogOut size={20} />
            <span className="hidden sm:inline">Cerrar Sesión</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 mt-6">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-700">Tu Planificador</h2>
          <button 
            onClick={() => onDateClick(new Date())}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all shadow-lg hover:shadow-green-500/30"
          >
            <Plus size={20} />
            Nueva Tarea
          </button>
        </div>

        {renderCalendar()}
      </main>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            ref={overlayRef}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeModal}
          ></div>
          <div 
            ref={modalRef}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative z-10"
          >
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              Nueva Tarea
            </h3>
            <p className="text-gray-500 mb-6">
              Para el {selectedDate && format(selectedDate, "d 'de' MMMM, yyyy", { locale: es })}
            </p>

            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2 font-medium">Materia</label>
                <div className="relative">
                  <BookOpen className="absolute left-3 top-3 text-green-500" size={20} />
                  <input
                    type="text"
                    required
                    placeholder="Ej. Matemáticas"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50"
                    value={newTask.subject}
                    onChange={(e) => setNewTask({ ...newTask, subject: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 mb-2 font-medium">Tarea / Descripción</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 text-green-500" size={20} />
                  <textarea
                    required
                    placeholder="Detalles de la tarea..."
                    rows={3}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50"
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition-all shadow-lg shadow-green-200"
                >
                  {loading ? 'Guardando...' : 'Guardar Tarea'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
