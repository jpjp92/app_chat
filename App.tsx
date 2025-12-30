import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Role, Message, ChatSession, UserProfile, MessageImage } from './types';
import { streamChatResponse } from './services/geminiService';
import ChatSidebar from './components/ChatSidebar';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import Header from './components/Header';

const DEFAULT_PROFILE: UserProfile = {
  name: 'User',
  avatarUrl: 'https://picsum.photos/seed/user/32/32'
};

const App: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedSessions = localStorage.getItem('aura_sessions');
    if (savedSessions) {
      const parsed = JSON.parse(savedSessions);
      setSessions(parsed);
      if (parsed.length > 0) {
        setCurrentSessionId(parsed[0].id);
      }
    } else {
      createNewSession();
    }

    const savedProfile = localStorage.getItem('aura_user_profile');
    if (savedProfile) {
      setUserProfile(JSON.parse(savedProfile));
    }
  }, []);

  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('aura_sessions', JSON.stringify(sessions));
    }
  }, [sessions]);

  const handleUpdateProfile = (newProfile: UserProfile) => {
    setUserProfile(newProfile);
    localStorage.setItem('aura_user_profile', JSON.stringify(newProfile));
  };

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [sessions, currentSessionId, scrollToBottom]);

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'Untilted Chat',
      messages: [],
      createdAt: Date.now(),
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
  };

  const currentSession = sessions.find(s => s.id === currentSessionId) || null;

  const handleSendMessage = async (content: string, image?: MessageImage) => {
    if (!currentSessionId || (!content.trim() && !image)) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: Role.USER,
      content: content || (image ? "[Image]" : ""),
      timestamp: Date.now(),
      image
    };

    const updatedSessionsWithUser = sessions.map(s => {
      if (s.id === currentSessionId) {
        const newTitle = s.messages.length === 0 
          ? (content.slice(0, 30) || "Image Analysis") + (content.length > 30 ? '...' : '') 
          : s.title;
        return { ...s, title: newTitle, messages: [...s.messages, userMessage] };
      }
      return s;
    });
    
    setSessions(updatedSessionsWithUser);
    setIsTyping(true);

    const botMessageId = `bot-${Date.now()}`;
    const botMessage: Message = {
      id: botMessageId,
      role: Role.MODEL,
      content: '',
      timestamp: Date.now(),
    };

    setSessions(prev => prev.map(s => {
      if (s.id === currentSessionId) {
        return { ...s, messages: [...s.messages, botMessage] };
      }
      return s;
    }));

    try {
      let accumulatedText = "";
      await streamChatResponse(
        content || "Analyze this image.",
        currentSession?.messages || [],
        (chunk) => {
          accumulatedText += chunk;
          setSessions(prev => prev.map(s => {
            if (s.id === currentSessionId) {
              const updatedMessages = s.messages.map(m => 
                m.id === botMessageId ? { ...m, content: accumulatedText } : m
              );
              return { ...s, messages: updatedMessages };
            }
            return s;
          }));
        },
        image
      );
    } catch (error) {
      console.error(error);
      setSessions(prev => prev.map(s => {
        if (s.id === currentSessionId) {
          const updatedMessages = s.messages.map(m => 
            m.id === botMessageId ? { ...m, content: "Something went wrong. Please try again later." } : m
          );
          return { ...s, messages: updatedMessages };
        }
        return s;
      }));
    } finally {
      setIsTyping(false);
    }
  };

  const deleteSession = (id: string) => {
    const filtered = sessions.filter(s => s.id !== id);
    setSessions(filtered);
    if (currentSessionId === id) {
      setCurrentSessionId(filtered.length > 0 ? filtered[0].id : null);
    }
    if (filtered.length === 0) {
      createNewSession();
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-slate-950">
      <ChatSidebar 
        sessions={sessions} 
        currentSessionId={currentSessionId} 
        onSelectSession={setCurrentSessionId}
        onNewSession={createNewSession}
        onDeleteSession={deleteSession}
      />
      
      <div className="flex flex-col flex-1 h-full min-w-0">
        <Header userProfile={userProfile} onUpdateProfile={handleUpdateProfile} />
        
        <main className="flex-1 overflow-y-auto p-4 space-y-4 md:p-6 lg:p-10 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-slate-800">
          {currentSession?.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-8 animate-in fade-in zoom-in-95 duration-700">
              <div className="relative">
                <div className="absolute inset-0 bg-primary-500 rounded-full blur-3xl opacity-20 animate-pulse-slow"></div>
                <div className="relative w-24 h-24 bg-gradient-to-br from-primary-100 to-indigo-100 dark:from-primary-900/20 dark:to-indigo-900/20 rounded-[32px] flex items-center justify-center text-primary-600 dark:text-primary-400 border border-white dark:border-slate-800 shadow-xl ring-1 ring-primary-200/50">
                  <i className="fa-solid fa-wand-magic-sparkles text-4xl"></i>
                </div>
              </div>
              <div className="max-w-md mx-auto">
                <h2 className="text-4xl font-black tracking-tighter mb-3">Welcome to Gemini.</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  How can I help you today? Send me a message or share an image to start our conversation.
                </p>
              </div>
            </div>
          ) : (
            currentSession?.messages.map((message) => (
              <ChatMessage key={message.id} message={message} userProfile={userProfile} />
            ))
          )}
          {isTyping && (
            <div className="flex items-center space-x-3 text-[11px] font-black uppercase tracking-[0.2em] text-primary-500/70 ml-2 animate-in fade-in duration-300">
              <i className="fa-solid fa-sparkles animate-spin-slow"></i>
              <span>Gemini is thinking...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </main>

        <footer className="p-4 md:p-8 bg-transparent">
          <ChatInput onSend={handleSendMessage} disabled={isTyping} />
          <p className="text-[9px] font-bold text-center text-slate-400 uppercase tracking-[0.3em] mt-4 opacity-50">
            Powered by Gemini Intelligence
          </p>
        </footer>
      </div>
    </div>
  );
};

export default App;