
export enum Role {
  USER = 'user',
  ASSISTANT = 'assistant'
}

export interface GroundingSource {
  title?: string;
  uri?: string;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: Date;
  sources?: GroundingSource[];
  isSearching?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
}
