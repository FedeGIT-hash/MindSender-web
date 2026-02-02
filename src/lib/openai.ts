import OpenAI from 'openai';

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

export const openai = apiKey ? new OpenAI({
  apiKey: apiKey,
  dangerouslyAllowBrowser: true // Necesario para uso en cliente, aunque no recomendado para producción real sin backend
}) : null;

export const hasOpenAIKey = !!apiKey;

export const SYSTEM_INSTRUCTION = "Eres Sender AI (delta 1.0), un asistente virtual inteligente integrado en la aplicación MindSender. Tu objetivo es ayudar a los usuarios a organizar sus tareas, gestionar su tiempo y ser más productivos. Eres amigable, conciso y directo. Siempre respondes en español. Si te preguntan quién eres, di que eres Sender AI (delta 1.0), creado para potenciar la productividad.";
