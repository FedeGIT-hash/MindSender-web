import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import gsap from 'gsap';
import { Mail, Lock, User, Calendar, Activity, Eye, EyeOff, Check, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Register() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const decorationRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    sex: 'male',
    age: '',
  });

  useEffect(() => {
    // Calculate password strength
    const pass = formData.password;
    let strength = 0;
    if (pass.length > 5) strength += 1;
    if (pass.length > 9) strength += 1;
    if (/[A-Z]/.test(pass)) strength += 1;
    if (/[0-9]/.test(pass)) strength += 1;
    if (/[^A-Za-z0-9]/.test(pass)) strength += 1;
    setPasswordStrength(Math.min(strength, 4));
  }, [formData.password]);

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
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            sex: formData.sex,
            age: formData.age,
          },
        },
      });

      if (error) throw error;

      // Navigate to verify page passing the email and name
      navigate('/verify', { 
        state: { 
          email: formData.email,
          fullName: formData.fullName 
        } 
      });
    } catch (err: any) {
      let errorMessage = err.message || 'Error al registrarse';
      
      // Translate common Supabase errors
      if (errorMessage.includes('rate limit')) {
        errorMessage = 'Demasiados intentos. Por favor espera un momento antes de intentar de nuevo.';
      } else if (errorMessage.includes('already registered')) {
        errorMessage = 'Este correo ya está registrado.';
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
          <h1 className="decoration-text text-5xl font-bold text-gray-900 dark:text-white mb-2">
            MindSender
          </h1>
          <p className="decoration-text text-xl text-green-600 dark:text-green-400 font-semibold mb-8">
            Únete hoy
          </p>
          <div className="decoration-text bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-2xl border-l-4 border-green-500 shadow-lg">
            <p className="text-2xl text-gray-700 dark:text-gray-300 italic font-medium leading-relaxed">
              "Comienza a organizar tu vida con calma y claridad."
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white dark:bg-gray-900">
        <div
          ref={formRef}
          className="w-full max-w-md"
        >
          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Crear una cuenta</h2>
            <p className="text-gray-500 dark:text-gray-400">Completa tus datos para comenzar</p>
          </div>
        
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm text-center">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nombre Completo</label>
              <div className="relative group">
                <User className="absolute left-3 top-3 text-gray-400 dark:text-gray-500 group-focus-within:text-green-500 transition-colors" size={20} />
                <input
                  type="text"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-700 dark:text-white"
                  placeholder="Tu nombre completo"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Correo Electrónico</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-3 text-gray-400 dark:text-gray-500 group-focus-within:text-green-500 transition-colors" size={20} />
                <input
                  type="email"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-700 dark:text-white"
                  placeholder="nombre@ejemplo.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Contraseña</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-3 text-gray-400 dark:text-gray-500 group-focus-within:text-green-500 transition-colors" size={20} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full pl-10 pr-12 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-700 dark:text-white"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1 h-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div 
                        key={level}
                        className={`h-full flex-1 rounded-full transition-all duration-300 ${
                          passwordStrength >= level 
                            ? passwordStrength <= 2 ? 'bg-red-500' : passwordStrength === 3 ? 'bg-yellow-500' : 'bg-green-500'
                            : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] text-right font-medium text-gray-500 dark:text-gray-400">
                    {passwordStrength <= 2 ? 'Débil' : passwordStrength === 3 ? 'Media' : 'Fuerte'}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <div className="w-1/2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Edad</label>
                <div className="relative group">
                  <Calendar className="absolute left-3 top-3 text-gray-400 dark:text-gray-500 group-focus-within:text-green-500 transition-colors" size={20} />
                  <input
                    type="number"
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-700 dark:text-white"
                    placeholder="25"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  />
                </div>
              </div>
              <div className="w-1/2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sexo</label>
                <div className="relative group">
                  <Activity className="absolute left-3 top-3 text-gray-400 dark:text-gray-500 group-focus-within:text-green-500 transition-colors" size={20} />
                  <select
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-700 dark:text-white appearance-none"
                    value={formData.sex}
                    onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                  >
                    <option value="male">Masculino</option>
                    <option value="female">Femenino</option>
                    <option value="other">Otro</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-3.5 rounded-xl font-semibold hover:bg-green-700 transition duration-300 transform hover:scale-[1.02] shadow-lg shadow-green-200 dark:shadow-none disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Registrando...' : 'Registrarse'}
            </button>
          </form>

          <p className="mt-8 text-center text-gray-600 dark:text-gray-400">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-semibold hover:underline">
              Inicia Sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}