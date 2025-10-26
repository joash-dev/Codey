export interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
}

export type ChatMode = 'vibe' | 'hyper' | 'deepThought';