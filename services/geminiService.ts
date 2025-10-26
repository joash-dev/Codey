import { GoogleGenAI, Chat, Content, GenerateContentResponse, Type } from "@google/genai";
import { ChatMode, Theme } from "../types";

const apiKey = process.env.API_KEY;

if (!apiKey) {
  console.error("API Key is missing. Please set the API_KEY environment variable.");
}

const ai = new GoogleGenAI({ apiKey: apiKey! });

const systemInstruction = `
You are "Codey" — a helpful and knowledgeable AI coding assistant. Your goal is to help users write, debug, and understand code.
Your Communication Style:
- Be clear, concise, and professional.
- Provide accurate and well-explained answers.
- Explain complex concepts in an easy-to-understand manner.
- Be supportive and encouraging.
- Avoid slang, casual language, and excessive emojis.
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
    case 'reasoning':
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

export const refactorCode = async (code: string, model: string): Promise<string> => {
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: model,
        contents: `Refactor the following code snippet. Your goal is to improve its readability, efficiency, or adherence to best practices. Provide ONLY the refactored code in a single markdown block, with no additional explanation before or after the code block.\n\n\`\`\`\n${code}\n\`\`\``,
        config: {
            temperature: 0.2, 
        }
    });
    const codeBlockRegex = /```(?:[\w-]*\n)?([\s\S]+)```/;
    const match = response.text.match(codeBlockRegex);
    return match ? match[1].trim() : response.text.trim();
}

export const explainCode = async (code: string, language: string, model: string): Promise<string> => {
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: model,
        contents: `Provide a detailed explanation for the following ${language} code snippet. Break down what the code does, its purpose, and any important concepts or syntax. Format your response using markdown.\n\n\`\`\`${language}\n${code}\n\`\`\``,
        config: {
            temperature: 0.3,
        }
    });
    return response.text;
}

export const generateTheme = async (prompt: string): Promise<Theme> => {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `You are a theme generator for a web application. Based on the user's prompt, generate a theme. The theme must have three HSL color values (c400, c500, c600) representing a gradient from a lighter to a darker shade, and a decision on whether the text on these colors should be 'text-white' or 'text-black' for readability. Provide a creative name for the theme. User prompt: '${prompt}'. Respond ONLY with a valid JSON object matching the provided schema.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING, description: 'A creative name for the theme.' },
                c400: { type: Type.STRING, description: "HSL value as a string 'H S% L%'" },
                c500: { type: Type.STRING, description: "HSL value as a string 'H S% L%'" },
                c600: { type: Type.STRING, description: "HSL value as a string 'H S% L%'" },
                activeText: { type: Type.STRING, description: "Either 'text-white' or 'text-black'" },
            },
            required: ['name', 'c400', 'c500', 'c600', 'activeText'],
          },
        },
    });

    // The response text is a JSON string. We need to parse it.
    const themeJson = JSON.parse(response.text);
    return themeJson as Theme;
}

export const getAutocompleteSuggestion = async (text: string): Promise<string> => {
    if (!text.trim()) {
        return '';
    }
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are a code completion engine. Based on the user's input, provide a concise, single-line completion. Do not repeat the user's input. Provide only the suggested text to complete the line. User's input:\n\`\`\`\n${text}\n\`\`\``,
        config: {
            temperature: 0,
            maxOutputTokens: 50,
            stopSequences: ['\n'],
        },
    });
    return response.text?.trim() || '';
};