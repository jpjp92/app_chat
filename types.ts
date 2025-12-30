export enum Role {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system'
}

export type Language = 'ko' | 'en' | 'es' | 'fr';

export interface MessageImage {
  data: string;
  mimeType: string;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  image?: MessageImage;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

export interface UserProfile {
  name: string;
  avatarUrl: string;
}