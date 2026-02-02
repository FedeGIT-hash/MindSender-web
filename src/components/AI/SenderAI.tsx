import { useState, useEffect, useRef } from 'react';
import { X, Send, Sparkles, Bot } from 'lucide-react';
import gsap from 'gsap';
import { groq, hasGroqKey, MIND_SENDER_TOOLS } from '../../lib/groq';
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
  content: string;
  timestamp: Date;
  tool_call_id?: string;
  name?: string;
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

    let currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    setInput('');
    setIsTyping(true);
    setError(null);

    try {
      if (groq) {
        const fullSystemPrompt = `${SYSTEM_PROMPT}\nFecha y hora actual: ${new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}.`;
        
        let apiMessages = [
          { role: "system", content: fullSystemPrompt },
          ...currentMessages.map(msg => ({
            role: msg.role === 'assistant' ? 'assistant' : msg.role === 'user' ? 'user' : msg.role,
            content: msg.content,
            ...(msg.tool_call_id && { tool_call_id: msg.tool_call_id }),
            ...(msg.name && { name: msg.name })
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
          const aiMessageWithToolCalls: AIMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: responseMessage.content || "",
            timestamp: new Date(),
            tool_call_id: undefined // OpenAI/Groq spec: the message with tool_calls doesn't have a tool_call_id itself
          };
          
          // Groq/OpenAI need the assistant message with tool_calls in the history
          // We need to store the tool_calls for the next API call
          const apiMessageWithToolCalls = {
            role: 'assistant',
            content: responseMessage.content,
            tool_calls: responseMessage.tool_calls
          };

          const toolResults = [];
          if (responseMessage.tool_calls) {
            for (const toolCall of responseMessage.tool_calls) {
              const result = await handleToolCall(toolCall);
              toolResults.push({
                role: 'tool' as const,
                tool_call_id: toolCall.id,
                name: toolCall.function?.name || 'unknown',
                content: result
              });
            }
          }

          // Now call the AI again with the tool results
          const secondResponse = await groq.chat.completions.create({
            messages: [
              { role: "system", content: fullSystemPrompt },
              ...currentMessages.map(msg => ({ role: msg.role, content: msg.content })),
              apiMessageWithToolCalls,
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
      <div className="p-3 sm:p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gradient-to-r from-violet-50 to-white dark:from-violet-900/20 dark:to-gray-900">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
            <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-800 dark:text-white">Sender AI</h2>
            <span className="text-[9px] sm:text-[10px] font-mono bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 px-1.5 py-0.5 rounded border border-violet-200 dark:border-violet-800">
              delta 1.0 (Groq)
            </span>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
          <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 bg-slate-50/50 dark:bg-gray-900/50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] sm:max-w-[85%] rounded-2xl p-3 sm:p-4 shadow-sm ${
              msg.role === 'user' ? 'bg-violet-600 text-white rounded-tr-none' : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-tl-none'
            }`}>
              <p className="text-xs sm:text-sm leading-relaxed">{msg.content}</p>
              <span className={`text-[9px] sm:text-[10px] mt-1 block ${msg.role === 'user' ? 'text-violet-200' : 'text-gray-400 dark:text-gray-500'}`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-3 sm:p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1 animate-pulse">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-violet-400" />
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
            className="w-full pl-4 pr-4 py-2 sm:py-3 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none text-xs sm:text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
            rows={1}
          />
          <button 
            type="submit"
            disabled={!input.trim() || isTyping}
            className="p-2 sm:p-3 bg-violet-600 text-white rounded-lg sm:rounded-xl hover:bg-violet-700 disabled:opacity-50 shadow-lg shadow-violet-200 dark:shadow-none transition-all active:scale-95"
          >
            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}