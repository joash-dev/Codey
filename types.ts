import { Chat } from "@google/genai";
export type { Theme, ThemeName } from './themes';

export interface UploadedFile {
  name: string;
  content: string; // base64 content
  type: string; // mimeType
}

export interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
  file?: UploadedFile;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
}

export type ChatMode = 'vibe' | 'hyper' | 'reasoning';