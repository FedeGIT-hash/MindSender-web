import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

// Inicializamos el cliente solo si existe la key, para evitar errores al importar
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// Configuración del modelo
const model = genAI ? genAI.getGenerativeModel({ 
  model: 'gemini-1.5-flash',
  systemInstruction: "Eres Sender AI (delta 1.0), un asistente virtual inteligente integrado en la aplicación MindSender. Tu objetivo es ayudar a los usuarios a organizar sus tareas, gestionar su tiempo y ser más productivos. Eres amigable, conciso y directo. Siempre respondes en español. Si te preguntan quién eres, di que eres Sender AI (delta 1.0), creado para potenciar la productividad. No menciones que eres un modelo de Google a menos que sea técnicamente necesario para explicar un error."
}) : null;

export const chatSession = model ? model.startChat({
  history: [],
  generationConfig: {
    maxOutputTokens: 1000,
  },
}) : null;

export const hasGeminiKey = !!apiKey;
