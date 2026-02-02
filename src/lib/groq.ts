import OpenAI from 'openai';

const apiKey = import.meta.env.VITE_GROQ_API_KEY;

// Configuramos Groq usando la librería de OpenAI por compatibilidad
export const groq = apiKey ? new OpenAI({
  apiKey: apiKey,
  dangerouslyAllowBrowser: true, // Permite que funcione desde el navegador
  baseURL: "https://api.groq.com/openai/v1" 
}) : null;

export const hasGroqKey = !!apiKey;

export const askMindSender = async (userInput: string) => {
  if (!groq) throw new Error("Groq API Key no configurada");

  const chatCompletion = await groq.chat.completions.create({
    "messages": [
      {
        "role": "system",
        "content": "Eres Sender AI (delta 1.0), un asistente de productividad para MindSender."
      },
      {
        "role": "user",
        "content": userInput
      }
    ],
    "model": "llama3-8b-8192", // Modelo rápido y gratuito
  });

  return chatCompletion.choices[0].message.content;
};
