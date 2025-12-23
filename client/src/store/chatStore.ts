import { create } from 'zustand';

interface ChatMessage {
  id: string;
  session_id: string;
  message: string;
  message_type: 'user' | 'assistant';
  timestamp: string;
}

interface ChatSession {
  session_id: string;
  last_message: string;
  last_timestamp: string;
  message_count: number;
}

interface ChatState {
  // Current chat state
  currentSessionId: string | null;
  messages: ChatMessage[];
  sessions: ChatSession[];
  isLoading: boolean;
  
  // Actions
  setCurrentSession: (sessionId: string) => void;
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  loadChatHistory: (sessionId: string) => Promise<void>;
  loadChatSessions: () => Promise<void>;
  saveMessage: (sessionId: string, message: string, messageType: 'user' | 'assistant') => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  clearCurrentChat: () => void;
  
  // Utility
  generateSessionId: () => string;
}

const API_BASE = 'http://localhost:8000';

export const useChatStore = create<ChatState>((set, get) => ({
  currentSessionId: null,
  messages: [],
  sessions: [],
  isLoading: false,
  
  setCurrentSession: (sessionId) => {
    set({ currentSessionId: sessionId, messages: [] });
    get().loadChatHistory(sessionId);
  },
  
  addMessage: (message) => {
    const newMessage: ChatMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date().toISOString()
    };
    
    set((state) => ({
      messages: [...state.messages, newMessage]
    }));
  },
  
  loadChatHistory: async (sessionId) => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    
    set({ isLoading: true });
    
    try {
      const response = await fetch(`${API_BASE}/chat/history/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const messages = await response.json();
        set({ messages, isLoading: false });
      } else {
        console.error('Failed to load chat history:', response.status);
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
      set({ isLoading: false });
    }
  },
  
  loadChatSessions: async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE}/chat/sessions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const sessions = await response.json();
        set({ sessions });
      } else {
        console.error('Failed to load chat sessions:', response.status);
      }
    } catch (error) {
      console.error('Failed to load chat sessions:', error);
    }
  },
  
  saveMessage: async (sessionId, message, messageType) => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE}/chat/message`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          session_id: sessionId,
          message,
          message_type: messageType
        })
      });
      
      if (response.ok) {
        // Optionally reload sessions to update last message
        get().loadChatSessions();
      }
    } catch (error) {
      console.error('Failed to save message:', error);
    }
  },
  
  deleteSession: async (sessionId) => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE}/chat/session/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        set((state) => ({
          sessions: state.sessions.filter(s => s.session_id !== sessionId),
          messages: state.currentSessionId === sessionId ? [] : state.messages,
          currentSessionId: state.currentSessionId === sessionId ? null : state.currentSessionId
        }));
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  },
  
  clearCurrentChat: () => {
    set({ currentSessionId: null, messages: [] });
  },
  
  generateSessionId: () => {
    return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}));