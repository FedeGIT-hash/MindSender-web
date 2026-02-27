import React, { useState, useEffect } from 'react';
import { X, ShieldCheck } from 'lucide-react';
import gsap from 'gsap';

interface MembershipsSectionProps {
  onBack: () => void;
}

const MembershipsSection: React.FC<MembershipsSectionProps> = ({ onBack }) => {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentPlan, setPaymentPlan] = useState<'pro' | 'elite' | null>(null);

  const proCheckoutUrl =
    import.meta.env.VITE_STRIPE_PRO_LINK ||
    'https://buy.stripe.com/test_3cIaEQ2lj7j81RicWN4ko00';
  const eliteCheckoutUrl =
    import.meta.env.VITE_STRIPE_ELITE_LINK ||
    'https://buy.stripe.com/test_14AcMY2ljavk0Ne1e54ko01';

  useEffect(() => {
    gsap.fromTo(
      '.membership-card',
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out' }
    );
  }, []);

  return (
    <>
      <section className="mb-10 dashboard-control">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Membresías MindSender
          </h2>
          <button
            onClick={onBack}
            className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 underline underline-offset-4"
          >
            Volver a la agenda
          </button>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pro Plan */}
          <div className="membership-card bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-[2rem] border border-white/50 dark:border-gray-700/50 p-6 shadow-lg">
            <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2">
              Plan Pro
            </h3>
            <p className="text-3xl font-black text-gray-900 dark:text-white mb-1">$4 USD</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">al mes</p>
            <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2 mb-6">
              <li>• Acceso al panel de Citas</li>
              <li>• Hablar de tus proyectos con el desarrollador</li>
              <li>• Ayuda con programas locales o tareas</li>
            </ul>
            <button
              className="w-full px-4 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-500 transition-colors"
              onClick={() => {
                setPaymentPlan('pro');
                setIsPaymentModalOpen(true);
              }}
            >
              Me interesa el Plan Pro
            </button>
          </div>

          {/* Elite Plan */}
          <div className="membership-card bg-gray-900 dark:bg-black/90 rounded-[2rem] border border-gray-800 p-6 shadow-xl">
            <h3 className="text-sm font-bold text-amber-400 uppercase tracking-widest mb-2">
              Plan Elite
            </h3>
            <p className="text-3xl font-black text-white mb-1">$10 USD</p>
            <p className="text-xs text-gray-400 mb-4">al mes</p>
            <ul className="text-sm text-gray-200 space-y-2 mb-6">
              <li>• Todo lo del Plan Pro</li>
              <li>• Acceso al panel de administrador</li>
              <li>• Ayuda directa con el código de MindSender</li>
            </ul>
            <button
              className="w-full px-4 py-3 rounded-xl bg-amber-500 text-gray-900 font-bold hover:bg-amber-400 transition-colors"
              onClick={() => {
                setPaymentPlan('elite');
                setIsPaymentModalOpen(true);
              }}
            >
              Me interesa el Plan Elite
            </button>
          </div>
        </div>
      </section>

      {/* Payment Modal */}
      {isPaymentModalOpen && paymentPlan && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-gray-900/60 dark:bg-black/70 backdrop-blur-sm"
            onClick={() => setIsPaymentModalOpen(false)}
          ></div>
          <div className="relative z-10 w-full max-w-md mx-4 bg-white/95 dark:bg-gray-900/95 rounded-3xl border border-white/20 dark:border-gray-800 shadow-2xl p-6 sm:p-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                Confirmar pago
              </h3>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mb-4 rounded-2xl bg-gray-50 dark:bg-gray-800/80 p-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest font-bold text-emerald-500">
                  Plan seleccionado
                </p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {paymentPlan === 'pro' ? 'Plan Pro' : 'Plan Elite'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {paymentPlan === 'pro' ? '$4 USD / mes' : '$10 USD / mes'}
                </p>
              </div>
              <div className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                Pago con Stripe
              </div>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
              Serás redirigido a una pasarela segura de Stripe para completar tu pago.
              Tu información de tarjeta no se guarda en MindSender.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  const url = paymentPlan === 'pro' ? proCheckoutUrl : eliteCheckoutUrl;
                  setIsPaymentModalOpen(false);
                  window.open(url, '_blank');
                }}
                className="w-full px-4 py-3 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2"
              >
                <ShieldCheck size={16} />
                Pagar con Stripe
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MembershipsSection;
