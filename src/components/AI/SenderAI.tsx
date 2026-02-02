import { useState, useEffect, useRef } from 'react';
import { X, Send, Sparkles, Bot, AlertCircle } from 'lucide-react';
import gsap from 'gsap';
import { chatSession, hasGeminiKey } from '../../lib/gemini';

interface SenderAIProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function SenderAI({ isOpen, onClose }: SenderAIProps) {
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: hasGeminiKey 
        ? 'Hola, soy Sender AI (delta 1.0). ¿En qué puedo ayudarte hoy a organizar tus tareas?'
        : 'Hola. Para que pueda funcionar, necesito que configures mi "cerebro" (API Key de Gemini). Por favor agrega VITE_GEMINI_API_KEY a tus variables de entorno.',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // GSAP Animations for slide-in/out
  useEffect(() => {
    if (isOpen) {
      gsap.to(containerRef.current, {
        x: 0,
        duration: 0.5,
        ease: 'power3.out'
      });
    } else {
      gsap.to(containerRef.current, {
        x: '100%',
        duration: 0.4,
        ease: 'power3.in'
      });
    }
  }, [isOpen]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;
    
    if (!hasGeminiKey) {
      setError('Falta la API Key de Gemini. Revisa la configuración.');
      return;
    }

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    setError(null);

    try {
      if (chatSession) {
        const result = await chatSession.sendMessage(userMessage.content);
        const response = await result.response;
        const text = response.text();
        
        const aiMessage: AIMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: text,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error("No se pudo iniciar la sesión de chat");
      }
    } catch (err) {
      console.error('Error al conectar con Gemini:', err);
      setError('Lo siento, tuve un problema al procesar tu mensaje. Intenta de nuevo.');
      
      const errorMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '⚠️ Error de conexión. Por favor verifica tu internet o la API Key.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white/95 backdrop-blur-xl shadow-2xl z-50 border-l border-white/20 transform translate-x-full flex flex-col"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-violet-50 to-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-100 rounded-lg">
            <Bot className="w-6 h-6 text-violet-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              Sender AI
            </h2>
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-mono bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded border border-violet-200">
                delta 1.0
              </span>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}
        
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
              msg.role === 'user' 
                ? 'bg-violet-600 text-white rounded-tr-none' 
                : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
            }`}>
              <p className="text-sm leading-relaxed">{msg.content}</p>
              <span className={`text-[10px] mt-1 block ${
                msg.role === 'user' ? 'text-violet-200' : 'text-gray-400'
              }`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-violet-400 animate-pulse mr-1" />
              <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-100">
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              placeholder="Pregúntale algo a Sender AI..."
              className="w-full pl-4 pr-10 py-3 bg-gray-50 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none min-h-[50px] max-h-[120px] text-sm"
              rows={1}
            />
          </div>
          <button 
            type="submit"
            disabled={!input.trim() || isTyping}
            className="p-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-200"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-center text-xs text-gray-400 mt-2">
          Sender AI (delta 1.0) puede cometer errores.
        </p>
      </form>
    </div>
  );
}
