import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export const model = genAI ? genAI.getGenerativeModel({ model: "gemini-pro" }) : null;

export const SYSTEM_INSTRUCTION = "Eres Sender AI (delta 1.0), un asistente virtual inteligente integrado en la aplicación MindSender. Tu objetivo es ayudar a los usuarios a organizar sus tareas, gestionar su tiempo y ser más productivos. Eres amigable, conciso y directo. Siempre respondes en español. Si te preguntan quién eres, di que eres Sender AI (delta 1.0), creado para potenciar la productividad.";

export const chatSession = model ? model.startChat({
  history: [
    {
      role: "user",
      parts: [{ text: SYSTEM_INSTRUCTION }],
    },
    {
      role: "model",
      parts: [{ text: "Entendido. Soy Sender AI (delta 1.0), listo para ayudar a organizar tareas y mejorar la productividad en MindSender. ¿En qué puedo ayudarte hoy?" }],
    },
  ],
}) : null;

export const hasGeminiKey = !!apiKey;