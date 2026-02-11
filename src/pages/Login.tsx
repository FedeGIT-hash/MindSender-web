import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import gsap from 'gsap';
import { Mail, Lock } from 'lucide-react';
import RotatingText from '../components/RotatingText';
import { supabase } from '../lib/supabase';

export default function Login() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const decorationRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    // Animate form entrance
    gsap.fromTo(
      formRef.current,
      { opacity: 0, x: 50 },
      { opacity: 1, x: 0, duration: 0.8, ease: 'power3.out', delay: 0.2 }
    );

    // Animate decoration elements
    const tl = gsap.timeline();
    tl.fromTo(
      '.decoration-text',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, stagger: 0.2, ease: 'power3.out' }
    );
    
    // Animate abstract lines
    gsap.to('.abstract-line', {
      strokeDashoffset: 0,
      duration: 2,
      ease: 'power2.inOut',
    });
    
    // Floating animation for lines
    gsap.to('.floating-shape', {
      y: -20,
      duration: 3,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      navigate('/');
    } catch (err: any) {
      let errorMessage = err.message || 'Error al iniciar sesión';
      if (errorMessage.includes('Invalid login credentials')) {
        errorMessage = 'Correo o contraseña incorrectos.';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={containerRef} className="min-h-screen flex bg-white dark:bg-gray-900 overflow-hidden">
      {/* Left Side - Decoration */}
      <div ref={decorationRef} className="hidden lg:flex lg:w-1/2 relative bg-gray-50 dark:bg-gray-900 items-center justify-center p-12 overflow-hidden">
        {/* Animated Background Shapes */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 800 800" preserveAspectRatio="xMidYMid slice">
          <path 
            className="abstract-line"
            d="M -100 600 C 100 400 300 800 500 600 S 900 200 1000 400" 
            fill="none" 
            stroke="#22c55e" 
            strokeWidth="40" 
            strokeLinecap="round"
            strokeDasharray="2000"
            strokeDashoffset="2000"
            opacity="0.8"
          />
           <path 
            className="abstract-line floating-shape"
            d="M -100 200 C 200 100 400 500 800 300" 
            fill="none" 
            stroke="#4ade80" 
            strokeWidth="30" 
            strokeLinecap="round"
            strokeDasharray="2000"
            strokeDashoffset="2000"
            opacity="0.6"
          />
          <circle className="floating-shape" cx="700" cy="100" r="50" fill="#bbf7d0" opacity="0.5" />
        </svg>

        <div className="relative z-10 max-w-lg">
          <div className="decoration-text mb-2 flex items-center gap-3">
            <span className="text-5xl font-bold text-gray-900 dark:text-white">MindSender</span>
            <RotatingText 
              texts={['Sender', 'Is', 'Cool!', 'Productivity', 'Automation', 'Creativity']} 
              mainClassName="px-2 sm:px-2 md:px-3 bg-green-500 text-white overflow-hidden py-0.5 sm:py-1 md:py-2 justify-center rounded-lg text-5xl font-bold" 
              staggerFrom={"last"} 
              initial={{ y: "100%", opacity: 0, filter: "blur(10px)" }} 
              animate={{ y: 0, opacity: 1, filter: "blur(0px)" }} 
              exit={{ y: "-120%", opacity: 0, filter: "blur(10px)" }} 
              staggerDuration={0.025} 
              splitLevelClassName="overflow-hidden pb-0.5 sm:pb-1 md:pb-1" 
              transition={{ type: "spring", damping: 20, stiffness: 200 }} 
              rotationInterval={2000} 
            />
          </div>
          <p className="decoration-text text-xl text-green-600 dark:text-green-400 font-semibold mb-8">
            Lott
          </p>
          <div className="decoration-text bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-2xl border-l-4 border-green-500 shadow-lg">
            <p className="text-2xl text-gray-700 dark:text-gray-300 italic font-medium leading-relaxed">
              "No es muy bueno sobrepensar, créelo, mejor prepara un café y realízalo con calma."
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white dark:bg-gray-900">
        <div
          ref={formRef}
          className="w-full max-w-md"
        >
          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Bienvenido de nuevo</h2>
            <p className="text-gray-500 dark:text-gray-400">Ingresa tus credenciales para acceder</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm text-center">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Correo Electrónico</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-3 text-gray-400 dark:text-gray-500 group-focus-within:text-green-500 transition-colors" size={20} />
                <input
                  type="email"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-700 dark:text-white"
                  placeholder="nombre@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Contraseña</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-3 text-gray-400 dark:text-gray-500 group-focus-within:text-green-500 transition-colors" size={20} />
                <input
                  type="password"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-700 dark:text-white"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-3.5 rounded-xl font-semibold hover:bg-green-700 transition duration-300 transform hover:scale-[1.02] shadow-lg shadow-green-200 dark:shadow-none disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Iniciando...' : 'Iniciar Sesión'}
            </button>
          </form>

          <p className="mt-8 text-center text-gray-600 dark:text-gray-400">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-semibold hover:underline">
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}