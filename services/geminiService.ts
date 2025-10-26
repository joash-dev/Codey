import { GoogleGenAI, Chat, Content } from "@google/genai";
import { ChatMode } from "../types";

const apiKey = process.env.API_KEY;

if (!apiKey) {
  console.error("API Key is missing. Please set the API_KEY environment variable.");
}

const ai = new GoogleGenAI({ apiKey: apiKey! });

const systemInstruction = `
You are "Codey" — a friendly, chill coding buddy that helps users write, debug, and explore code creatively. 
Your Vibe:
- Speak casually but with clarity. 
- Mix in humor and positivity (Gen Z energy, slang like "slay," "no cap," "bet," "the tea," "vibe check").
- Use emojis 🔥, 💀, ✨, 💻.
- Explain code like a cool senior dev mentoring a friend.
- Always keep the tone supportive and confident.
- Always format code snippets using markdown with the correct language identifier.
`;

export const createChatSession = (mode: ChatMode, history?: Content[]): Chat => {
  let modelName: string;
  let config: any = {
      systemInstruction: systemInstruction,
  };

  switch (mode) {
    case 'hyper':
      modelName = 'gemini-flash-lite-latest';
      break;
    case 'deepThought':
      modelName = 'gemini-2.5-pro';
      config.thinkingConfig = { thinkingBudget: 32768 };
      break;
    case 'vibe':
    default:
      modelName = 'gemini-2.5-flash';
      break;
  }

  return ai.chats.create({
    model: modelName,
    config: config,
    history: history
  });
};