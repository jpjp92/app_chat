import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Role, Message, ChatSession, UserProfile, MessageImage, Language } from './types';
import { streamChatResponse } from './services/geminiService';
import ChatSidebar from './components/ChatSidebar';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import Header from './components/Header';

const DEFAULT_PROFILE: UserProfile = {
  name: 'User',
  avatarUrl: 'https://i.ibb.co/VWwD4FS2/Gemini-Generated-Image-t452edt452edt452.jpg'
};

const WELCOME_TEXTS: Record<Language, { title: React.ReactNode, desc: string }> = {
  ko: {
    title: <>반가워요!<br/>오늘은 어떤 이야기를 나눌까요?</>,
    desc: "궁금한 것을 물어보거나 사진을 공유해 보세요."
  },
  en: {
    title: <>Hello there!<br/>What's on your mind?</>,
    desc: "Ask a question or share a photo to get started."
  },
  es: {
    title: <>¡Hola!<br/>¿De qué hablamos hoy?</>,
    desc: "Haz una pregunta o comparte una foto para comenzar."
  },
  fr: {
    title: <>Bonjour !<br/>De quoi parlons-nous ?</>,
    desc: "Posez une question ou partagez une photo pour commencer."
  }
};

const App: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<string>("");
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [language, setLanguage] = useState<Language>('ko');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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

    const savedLang = localStorage.getItem('aura_lang');
    if (savedLang) {
      setLanguage(savedLang as Language);
    }
  }, []);

  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('aura_sessions', JSON.stringify(sessions));
    }
  }, [sessions]);

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    localStorage.setItem('aura_lang', newLang);
  };

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
    setIsSidebarOpen(false);
  };

  const currentSession = sessions.find(s => s.id === currentSessionId) || null;

  // URL 감지 및 웹 콘텐츠 추출 함수
  const fetchWebContent = async (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const match = text.match(urlRegex);
    if (!match) return undefined;

    const url = match[0];
    setLoadingStatus("Reading web page...");
    try {
      const response = await fetch(`https://r.jina.ai/${url}`);
      if (!response.ok) return undefined;
      const content = await response.text();
      return content.slice(0, 15000); // 텍스트가 너무 길면 잘라냄 (Token 관리)
    } catch (e) {
      console.warn("URL Fetch Error:", e);
      return undefined;
    } finally {
      setLoadingStatus("");
    }
  };

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

    // 웹 콘텐츠 읽기 시도
    let webContent = undefined;
    if (content) {
      webContent = await fetchWebContent(content);
    }

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
        language,
        image,
        webContent
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
      setLoadingStatus("");
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

  const handleSelectSession = (id: string) => {
    setCurrentSessionId(id);
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-slate-950">
      <ChatSidebar 
        sessions={sessions} 
        currentSessionId={currentSessionId} 
        language={language}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onLanguageChange={handleLanguageChange}
        onSelectSession={handleSelectSession}
        onNewSession={createNewSession}
        onDeleteSession={deleteSession}
      />
      
      <div className="flex flex-col flex-1 h-full min-w-0">
        <Header 
          userProfile={userProfile} 
          onUpdateProfile={handleUpdateProfile} 
          onMenuClick={() => setIsSidebarOpen(true)}
        />
        
        <main className="flex-1 overflow-y-auto p-4 space-y-4 md:p-6 lg:p-10 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-slate-800">
          {currentSession?.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6 animate-in fade-in zoom-in-95 duration-1000">
              <div className="max-w-xl mx-auto px-4">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter mb-4 bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400 bg-clip-text text-transparent leading-[1.15] px-2">
                  {WELCOME_TEXTS[language].title}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed text-[13px] md:text-sm max-w-[280px] sm:max-w-md mx-auto opacity-70">
                  {WELCOME_TEXTS[language].desc}
                </p>
              </div>
            </div>
          ) : (
            currentSession?.messages.map((message) => (
              <ChatMessage key={message.id} message={message} userProfile={userProfile} />
            ))
          )}
          {(isTyping || loadingStatus) && (
            <div className="flex items-center space-x-3 text-[11px] font-black uppercase tracking-[0.2em] text-primary-500/70 ml-2 animate-in fade-in duration-300">
              <i className="fa-solid fa-sparkles animate-spin-slow"></i>
              <span>{loadingStatus || "Gemini is thinking..."}</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </main>

        <footer className="p-3 sm:p-4 md:p-8 bg-transparent">
          <ChatInput onSend={handleSendMessage} disabled={isTyping || !!loadingStatus} />
          <p className="text-[8px] sm:text-[9px] font-bold text-center text-slate-400 uppercase tracking-[0.3em] mt-3 sm:mt-4 opacity-40">
            Powered by Gemini Intelligence
          </p>
        </footer>
      </div>
    </div>
  );
};

export default App;