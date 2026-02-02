import OpenAI from 'openai';

const apiKey = import.meta.env.VITE_GROQ_API_KEY;

// Configuramos Groq usando la librería de OpenAI por compatibilidad
export const groq = apiKey ? new OpenAI({
  apiKey: apiKey,
  dangerouslyAllowBrowser: true, // Permite que funcione desde el navegador
  baseURL: "https://api.groq.com/openai/v1" 
}) : null;

export const hasGroqKey = !!apiKey;

export const MIND_SENDER_TOOLS = [
  {
    type: "function",
    function: {
      name: "create_task",
      description: "Crea una nueva tarea en la agenda del usuario.",
      parameters: {
        type: "object",
        properties: {
          subject: { type: "string", description: "Materia o título de la tarea" },
          description: { type: "string", description: "Detalles de lo que hay que hacer" },
          due_date: { type: "string", description: "Fecha y hora de entrega en formato ISO (YYYY-MM-DDTHH:mm:ss)" }
        },
        required: ["subject", "description", "due_date"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "list_tasks",
      description: "Obtiene la lista de tareas actuales del usuario.",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_task",
      description: "Actualiza una tarea existente.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID de la tarea a actualizar" },
          subject: { type: "string" },
          description: { type: "string" },
          due_date: { type: "string", description: "Formato ISO" },
          is_completed: { type: "boolean" }
        },
        required: ["id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "delete_task",
      description: "Elimina una tarea de la agenda.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID de la tarea a eliminar" }
        },
        required: ["id"]
      }
    }
  }
];

export const askMindSender = async (userInput: string) => {
  if (!groq) throw new Error("Groq API Key no configurada");

  const chatCompletion = await groq.chat.completions.create({
    "messages": [
      {
        "role": "system",
        "content": "Eres Sender AI (delta 1.0), un asistente de productividad para MindSender. Responde siempre en español y de forma concisa."
      },
      {
        "role": "user",
        "content": userInput
      }
    ],
    // CAMBIO: Se actualizó el modelo para solucionar el error 400 (decomisionado)
    "model": "llama-3.1-8b-instant", 
  });

  return chatCompletion.choices[0].message.content;
};