import { useState, useEffect, useRef } from 'react';
import { X, Send, Sparkles, Bot } from 'lucide-react';
import gsap from 'gsap';
import { groq, hasGroqKey } from '../../lib/groq';
import { SYSTEM_PROMPT } from '../../lib/systemPrompt';

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
      content: hasGroqKey 
        ? 'Hola, soy Sender AI (delta 1.0). ¿En qué puedo ayudarte hoy a organizar tus tareas?'
        : 'Hola. Para que pueda funcionar, necesito que configures mi "cerebro" (API Key de Groq). Por favor agrega VITE_GROQ_API_KEY a tus variables de entorno.',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [, setError] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      gsap.to(containerRef.current, { x: 0, duration: 0.5, ease: 'power3.out' });
    } else {
      gsap.to(containerRef.current, { x: '100%', duration: 0.4, ease: 'power3.in' });
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;
    
    if (!hasGroqKey) {
      setError('Falta la API Key de Groq. Revisa la configuración en Vercel.');
      return;
    }

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);
    setError(null);

    try {
      if (groq) {
        const apiMessages = newMessages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        }));

        const chatCompletion = await groq.chat.completions.create({
          messages: [
            { 
              role: "system", 
              content: SYSTEM_PROMPT 
            },
            ...apiMessages
          ] as any,
          // CAMBIO CLAVE: Modelo actualizado para evitar el error 400
          model: "llama-3.1-8b-instant", 
        });

        const text = chatCompletion.choices[0]?.message?.content || "No pude generar una respuesta.";
        
        const aiMessage: AIMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: text,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (err: any) {
      const errorDetail = err.message || "Error desconocido";
      setError(`Error: ${errorDetail}`);
      
      const errorMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `⚠️ Error de conexión: ${errorDetail}. Verifica tu API Key en Vercel.`,
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
      className="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-2xl z-50 border-l border-white/20 dark:border-gray-800 transform translate-x-full flex flex-col"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gradient-to-r from-violet-50 to-white dark:from-violet-900/20 dark:to-gray-900">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
            <Bot className="w-6 h-6 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">Sender AI</h2>
            <span className="text-[10px] font-mono bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 px-1.5 py-0.5 rounded border border-violet-200 dark:border-violet-800">
              delta 1.0 (Groq)
            </span>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
          <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-gray-900/50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
              msg.role === 'user' ? 'bg-violet-600 text-white rounded-tr-none' : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-tl-none'
            }`}>
              <p className="text-sm leading-relaxed">{msg.content}</p>
              <span className={`text-[10px] mt-1 block ${msg.role === 'user' ? 'text-violet-200' : 'text-gray-400 dark:text-gray-500'}`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1 animate-pulse">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span className="text-xs text-gray-400 dark:text-gray-500">Escribiendo...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pregúntale algo a Sender AI..."
            className="w-full pl-4 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
            rows={1}
          />
          <button 
            type="submit"
            disabled={!input.trim() || isTyping}
            className="p-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-50 shadow-lg shadow-violet-200 dark:shadow-none"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}