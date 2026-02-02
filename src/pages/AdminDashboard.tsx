import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  Activity, 
  ArrowLeft, 
  ShieldAlert,
  Server,
  Database,
  BarChart3,
  Calendar as CalendarIcon
} from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTasks: 0,
    completedTasks: 0,
    recentLogins: [] as any[]
  });
  const [loading, setLoading] = useState(true);

  const isDev = user?.user_metadata?.role === 'admin';

  useEffect(() => {
    if (isDev) {
      fetchAdminStats();
    }
  }, [isDev]);

  const fetchAdminStats = async () => {
    try {
      setLoading(true);
      
      // En una app real, esto requeriría una tabla de perfiles/usuarios
      // Por ahora simulamos algunas estadísticas basadas en lo que tenemos acceso
      const { count: taskCount } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true });

      const { count: completedCount } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('is_completed', true);

      // Aquí podrías añadir más consultas administrativas si tienes permisos
      
      setStats({
        totalUsers: 1, // Por ahora solo tú
        totalTasks: taskCount || 0,
        completedTasks: completedCount || 0,
        recentLogins: [
          { email: user?.email, last_sign_in: user?.last_sign_in_at, role: 'Admin/Dev' }
        ]
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isDev) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans p-4 sm:p-8">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-900/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <header className="mb-12 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <Link to="/" className="flex items-center gap-2 text-violet-400 hover:text-violet-300 transition-colors mb-4 group">
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
              <span className="font-bold uppercase tracking-widest text-xs">Volver al Dashboard</span>
            </Link>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tighter flex items-center gap-4">
              Control Panel
              <span className="bg-violet-600 text-white text-xs px-3 py-1 rounded-md font-mono animate-pulse">
                v1.0.dev
              </span>
            </h1>
            <p className="text-gray-400 mt-2 font-medium">Gestión centralizada de MindSender Beta</p>
          </div>

          <div className="flex gap-4">
            <div className="p-4 bg-gray-900/50 border border-white/10 rounded-2xl backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500">
                  <Activity size={20} />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase">System Status</p>
                  <p className="text-sm font-bold text-emerald-400 flex items-center gap-1">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                    Operational
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard 
            icon={<Users size={24} />} 
            label="Total Usuarios" 
            value={stats.totalUsers} 
            color="blue"
          />
          <StatCard 
            icon={<CalendarIcon size={24} />} 
            label="Tareas Globales" 
            value={stats.totalTasks} 
            color="violet"
          />
          <StatCard 
            icon={<CheckCircle2 size={24} />} 
            label="Completadas" 
            value={stats.completedTasks} 
            color="emerald"
          />
          <StatCard 
            icon={<Server size={24} />} 
            label="Uptime" 
            value="99.9%" 
            color="amber"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Monitor */}
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-gray-900/40 border border-white/5 rounded-[2rem] overflow-hidden backdrop-blur-2xl">
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-violet-900/10 to-transparent">
                <h2 className="font-bold flex items-center gap-2">
                  <BarChart3 size={20} className="text-violet-400" />
                  Métricas de Actividad
                </h2>
                <span className="text-xs text-gray-500 font-mono">LIVE_FEED</span>
              </div>
              <div className="p-8">
                <div className="h-64 flex items-end justify-between gap-2">
                  {[40, 70, 45, 90, 65, 80, 30, 95, 50, 75, 60, 85].map((h, i) => (
                    <div key={i} className="flex-1 group relative">
                      <div 
                        className="w-full bg-violet-500/20 group-hover:bg-violet-500/40 transition-all rounded-t-lg"
                        style={{ height: `${h}%` }}
                      >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 px-2 py-1 rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                          {h}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-4 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                  <span>Ene</span>
                  <span>Feb</span>
                  <span>Mar</span>
                  <span>Abr</span>
                  <span>May</span>
                  <span>Jun</span>
                </div>
              </div>
            </section>

            <section className="bg-gray-900/40 border border-white/5 rounded-[2rem] overflow-hidden backdrop-blur-2xl">
              <div className="p-6 border-b border-white/5">
                <h2 className="font-bold flex items-center gap-2">
                  <ShieldAlert size={20} className="text-amber-400" />
                  Logs de Seguridad
                </h2>
              </div>
              <div className="p-0">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] text-gray-500 uppercase tracking-widest border-b border-white/5">
                      <th className="p-6">Evento</th>
                      <th className="p-6">Usuario</th>
                      <th className="p-6">Timestamp</th>
                      <th className="p-6 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {stats.recentLogins.map((log, i) => (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="p-6 font-mono text-xs text-violet-400">AUTH_SUCCESS</td>
                        <td className="p-6 font-bold">{log.email}</td>
                        <td className="p-6 text-gray-400">{format(new Date(log.last_sign_in), 'Pp', { locale: es })}</td>
                        <td className="p-6 text-right">
                          <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded text-[10px] font-bold">SECURE</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* Sidebar Tools */}
          <div className="space-y-6">
            <section className="bg-gradient-to-br from-violet-600 to-indigo-700 p-8 rounded-[2rem] shadow-2xl shadow-violet-900/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-20">
                <Terminal size={120} />
              </div>
              <h3 className="text-xl font-black mb-4 relative z-10">Consola de Comandos</h3>
              <p className="text-violet-100/80 text-sm mb-6 relative z-10">Ejecuta acciones de mantenimiento directamente en el core del sistema.</p>
              <div className="space-y-3 relative z-10">
                <button className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2">
                  <Database size={16} />
                  Backup DB
                </button>
                <button className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2">
                  <Activity size={16} />
                  Clear Cache
                </button>
              </div>
            </section>

            <section className="bg-gray-900/40 border border-white/5 p-8 rounded-[2rem] backdrop-blur-2xl">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Clock size={20} className="text-emerald-400" />
                Uso de Recursos
              </h3>
              <div className="space-y-6">
                <ResourceMeter label="CPU" value={12} color="emerald" />
                <ResourceMeter label="RAM" value={45} color="violet" />
                <ResourceMeter label="STORAGE" value={2} color="blue" />
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: any, label: string, value: any, color: string }) {
  const colorMap: any = {
    blue: 'bg-blue-500/10 text-blue-500',
    violet: 'bg-violet-500/10 text-violet-500',
    emerald: 'bg-emerald-500/10 text-emerald-500',
    amber: 'bg-amber-500/10 text-amber-500'
  };

  return (
    <div className="bg-gray-900/40 border border-white/5 p-6 rounded-[2rem] backdrop-blur-xl hover:border-white/10 transition-all">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${colorMap[color]}`}>
        {icon}
      </div>
      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">{label}</p>
      <p className="text-3xl font-black tracking-tight">{value}</p>
    </div>
  );
}

function ResourceMeter({ label, value, color }: { label: string, value: number, color: string }) {
  const colorMap: any = {
    emerald: 'bg-emerald-500',
    violet: 'bg-violet-500',
    blue: 'bg-blue-500'
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[10px] font-bold uppercase">
        <span className="text-gray-400">{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full ${colorMap[color]} rounded-full`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
