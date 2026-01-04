
export enum Role {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system'
}

export type Language = 'ko' | 'en' | 'es' | 'fr';

export interface MessageAttachment {
  data: string;
  mimeType: string;
  fileName?: string;
}

export type SourceType = 'web' | 'video' | 'pdf' | 'image' | 'text';

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  attachment?: MessageAttachment;
  sourceType?: SourceType;
  groundingSources?: GroundingSource[];
  // 하위 호환성을 위해 image 필드 유지
  image?: MessageAttachment;
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
