import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Sparkles } from 'lucide-react';
import gsap from 'gsap';
import { groq, hasGroqKey, MIND_SENDER_TOOLS } from '../../lib/groq';

// Gemini-style Logo Component
const GeminiLogo = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M16 3C16.5 9.5 20.5 13.5 26 14C20.5 14.5 16.5 18.5 16 25C15.5 18.5 11.5 14.5 6 14C11.5 13.5 15.5 9.5 16 3Z" 
      fill="url(#gemini-gradient)"
      transform="scale(0.8) translate(1, 1)"
    />
    <path 
      d="M8 3C8.5 6.5 10.5 8.5 14 9C10.5 9.5 8.5 11.5 8 15C7.5 11.5 5.5 9.5 2 9C5.5 8.5 7.5 6.5 8 3Z" 
      fill="url(#gemini-gradient)"
      transform="translate(0, 10)"
      opacity="0.7"
    />
    <defs>
      <linearGradient id="gemini-gradient" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#10B981" />
        <stop offset="50%" stopColor="#14B8A6" />
        <stop offset="100%" stopColor="#6366F1" />
      </linearGradient>
    </defs>
  </svg>
);
import { SYSTEM_PROMPT } from '../../lib/systemPrompt';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface SenderAIProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskAction?: () => void;
}

interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string | null;
  timestamp: Date;
  tool_call_id?: string;
  tool_calls?: any[];
}

export default function SenderAI({ isOpen, onClose, onTaskAction }: SenderAIProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: hasGroqKey 
        ? 'Hola, soy Sender AI (delta 1.0). Puedo ayudarte a gestionar tu agenda. ¿Quieres crear una tarea, ver tu lista o modificar algo?'
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

  const handleToolCall = async (toolCall: any) => {
    if (!toolCall?.function) return "Error: No se proporcionó una función válida.";
    
    const { name, arguments: argsString } = toolCall.function;
    const args = JSON.parse(argsString || '{}');
    
    console.log(`AI invocando herramienta: ${name}`, args);

    try {
      switch (name) {
        case 'create_task': {
          const { error } = await supabase.from('tasks').insert([{
            user_id: user?.id,
            subject: args.subject,
            description: args.description,
            due_date: args.due_date,
            is_completed: false
          }]);
          if (error) throw error;
          if (onTaskAction) onTaskAction();
          return `Tarea "${args.subject}" creada con éxito para el ${args.due_date}.`;
        }
        
        case 'list_tasks': {
          const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', user?.id)
            .order('due_date', { ascending: true });
          if (error) throw error;
          return JSON.stringify(data);
        }

        case 'update_task': {
          const { error } = await supabase
            .from('tasks')
            .update({
              subject: args.subject,
              description: args.description,
              due_date: args.due_date,
              is_completed: args.is_completed
            })
            .eq('id', args.id)
            .eq('user_id', user?.id);
          if (error) throw error;
          if (onTaskAction) onTaskAction();
          return `Tarea actualizada correctamente.`;
        }

        case 'delete_task': {
          const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', args.id)
            .eq('user_id', user?.id);
          if (error) throw error;
          if (onTaskAction) onTaskAction();
          return `Tarea eliminada correctamente.`;
        }

        default:
          return `Herramienta no encontrada: ${name}`;
      }
    } catch (err: any) {
      console.error(`Error en herramienta ${name}:`, err);
      return `Error al ejecutar ${name}: ${err.message}`;
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;
    
    if (!hasGroqKey) {
      setError('Falta la API Key de Groq. Revisa la configuración.');
      return;
    }

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    setInput('');
    setIsTyping(true);
    setError(null);

    try {
      if (groq) {
        const fullSystemPrompt = `${SYSTEM_PROMPT}\nFecha y hora actual: ${new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}.`;
        
        const apiMessages = [
          { role: "system", content: fullSystemPrompt },
          ...currentMessages.map(msg => ({
            role: msg.role === 'assistant' ? 'assistant' : msg.role === 'user' ? 'user' : msg.role,
            content: msg.content,
            ...(msg.tool_call_id && { tool_call_id: msg.tool_call_id }),
            ...(msg.tool_calls && { tool_calls: msg.tool_calls })
          }))
        ];

        const response = await groq.chat.completions.create({
          messages: apiMessages as any,
          model: "llama-3.1-8b-instant",
          tools: MIND_SENDER_TOOLS as any,
          tool_choice: "auto"
        });

        
        const responseMessage = response.choices[0].message;

        if (responseMessage.tool_calls) {
          const toolResults = [];
          for (const toolCall of responseMessage.tool_calls) {
            const result = await handleToolCall(toolCall);
            toolResults.push({
              role: 'tool' as const,
              tool_call_id: toolCall.id,
              content: result
            });
          }

          // Now call the AI again with the tool results
          const secondResponse = await groq.chat.completions.create({
            messages: [
              { role: "system", content: fullSystemPrompt },
              ...currentMessages.map(msg => ({ 
                role: msg.role === 'assistant' ? 'assistant' : msg.role === 'user' ? 'user' : msg.role, 
                content: msg.content,
                ...(msg.tool_call_id && { tool_call_id: msg.tool_call_id }),
                ...(msg.tool_calls && { tool_calls: msg.tool_calls })
              })),
              {
                role: 'assistant',
                content: responseMessage.content || null,
                tool_calls: responseMessage.tool_calls
              },
              ...toolResults
            ] as any,
            model: "llama-3.1-8b-instant"
          });

          const finalAiMessage: AIMessage = {
            id: (Date.now() + 2).toString(),
            role: 'assistant',
            content: secondResponse.choices[0].message.content || "He procesado tu solicitud.",
            timestamp: new Date()
          };

          setMessages(prev => [...prev, finalAiMessage]);
        } else {
          const aiMessage: AIMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: responseMessage.content || "No pude generar una respuesta.",
            timestamp: new Date()
          };
          setMessages(prev => [...prev, aiMessage]);
        }
      }
    } catch (err: any) {
      const errorDetail = err.message || "Error desconocido";
      console.error("Error en chat:", err);
      setError(`Error: ${errorDetail}`);
      
      const errorMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `⚠️ Error: ${errorDetail}.`,
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
      <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 blur-xl rounded-full" />
            <div className="relative p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
              <GeminiLogo className="w-6 h-6" />
            </div>
          </div>
          <div>
            <h2 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-gray-200 dark:to-white">
              Sender AI
            </h2>
            <div className="flex items-center gap-1.5">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
                Powered by Groq
              </span>
            </div>
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors group"
        >
          <X className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300 transition-colors" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 bg-slate-50/50 dark:bg-gray-900/50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] sm:max-w-[85%] rounded-2xl p-3 sm:p-4 shadow-sm ${
              msg.role === 'user' ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-tr-none' : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-tl-none'
            }`}>
              <p className="text-xs sm:text-sm leading-relaxed">{msg.content}</p>
              <span className={`text-[9px] sm:text-[10px] mt-1 block ${msg.role === 'user' ? 'text-teal-100' : 'text-gray-400 dark:text-gray-500'}`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-3 sm:p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1 animate-pulse">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-teal-400" />
              <span className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500">Escribiendo...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-3 sm:p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pregúntale algo..."
            className="w-full pl-4 pr-4 py-2 sm:py-3 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500/50 resize-none text-xs sm:text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
            rows={1}
          />
          <button 
            type="submit"
            disabled={!input.trim() || isTyping}
            className="p-2 sm:p-3 bg-teal-600 text-white rounded-lg sm:rounded-xl hover:bg-teal-700 disabled:opacity-50 shadow-lg shadow-teal-200 dark:shadow-none transition-all active:scale-95"
          >
            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}