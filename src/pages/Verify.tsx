import { useState, useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import gsap from 'gsap';
import { Mail, ArrowRight } from 'lucide-react';

export default function Verify() {
  const location = useLocation();
  const formRef = useRef<HTMLDivElement>(null);
  const [email] = useState(location.state?.email || 'tu correo');
  
  useEffect(() => {
    gsap.fromTo(
      formRef.current,
      { opacity: 0, scale: 0.9 },
      { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.7)' }
    );

    // Animate background elements
    gsap.to('.verify-decoration', {
      rotation: 360,
      duration: 20,
      repeat: -1,
      ease: 'linear'
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decoration */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M0 0 C 50 100 80 100 100 0 Z" fill="#bbf7d0" opacity="0.2" />
        <circle className="verify-decoration origin-center" cx="20" cy="80" r="15" stroke="#22c55e" strokeWidth="1" fill="none" />
        <circle className="verify-decoration origin-center" cx="80" cy="20" r="10" stroke="#4ade80" strokeWidth="1" fill="none" />
      </svg>

      <div
        ref={formRef}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-md text-center relative z-10 border border-gray-100 dark:border-gray-700"
      >
        <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
          <Mail className="text-green-600 dark:text-green-400" size={32} />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Verifica tu Correo
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Hemos enviado un enlace de confirmación a <span className="font-semibold text-green-700 dark:text-green-400">{email}</span>.
          <br /><br />
          Por favor, revisa tu bandeja de entrada (y spam) y haz clic en el enlace para activar tu cuenta.
        </p>

        <Link
          to="/login"
          className="inline-flex items-center justify-center gap-2 w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition duration-300 shadow-lg shadow-green-200 dark:shadow-none"
        >
          Ir a Iniciar Sesión <ArrowRight size={20} />
        </Link>
        
        <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
          ¿No recibiste el correo? <span className="text-green-600 dark:text-green-400 cursor-pointer hover:underline">Reenviar</span>
        </p>
      </div>
    </div>
  );
}
