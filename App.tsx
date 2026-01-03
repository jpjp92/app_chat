
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Role, Message, ChatSession, UserProfile, MessageAttachment, Language } from './types';
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
    desc: "궁금한 것을 물어보거나 PDF 문서, 유튜브 링크를 공유해 보세요."
  },
  en: {
    title: <>Hello there!<br/>What's on your mind?</>,
    desc: "Ask a question, share a PDF, or drop a YouTube link to get started."
  },
  es: {
    title: <>¡Hola!<br/>¿De qué hablamos hoy?</>,
    desc: "Haz una pregunta, comparte un PDF o un enlace de YouTube para comenzar."
  },
  fr: {
    title: <>Bonjour !<br/>De quoi parlons-nous ?</>,
    desc: "Posez une question, partagez un PDF ou un 유튜브 링크."
  }
};

const App: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<string>("");
  const [loadingIcon, setLoadingIcon] = useState<string>("fa-sparkles");
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [language, setLanguage] = useState<Language>('ko');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [apiKeyError, setApiKeyError] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!process.env.API_KEY || process.env.API_KEY === "undefined") {
      setApiKeyError(true);
    }

    const savedSessions = localStorage.getItem('aura_sessions');
    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSessions(parsed);
          setCurrentSessionId(parsed[0].id);
        } else {
          createNewSession();
        }
      } catch (e) {
        createNewSession();
      }
    } else {
      createNewSession();
    }

    const savedProfile = localStorage.getItem('aura_user_profile');
    if (savedProfile) {
      try { setUserProfile(JSON.parse(savedProfile)); } catch (e) {}
    }

    const savedLang = localStorage.getItem('aura_lang');
    if (savedLang) setLanguage(savedLang as Language);
  }, []);

  useEffect(() => {
    if (sessions.length > 0) {
      try {
        const sessionsToSave = sessions.map(s => ({
          ...s,
          messages: s.messages.map(m => {
            if (m.attachment && m.attachment.data.length > 50000) {
              return { ...m, attachment: { ...m.attachment, data: "" } };
            }
            return m;
          })
        }));
        localStorage.setItem('aura_sessions', JSON.stringify(sessionsToSave));
      } catch (e) {
        console.warn("Could not save to localStorage due to size limits.");
      }
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
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [sessions, currentSessionId, scrollToBottom]);

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: `session-${Date.now()}`,
      title: language === 'ko' ? '새로운 대화' : 'New Chat',
      messages: [],
      createdAt: Date.now(),
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setIsSidebarOpen(false);
  };

  const currentSession = sessions.find(s => s.id === currentSessionId) || null;

  const fetchWebContent = async (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const match = text.match(urlRegex);
    if (!match) return { content: undefined, type: 'text' as const };

    const url = match[0];
    const isYoutube = url.includes('youtube.com') || url.includes('youtu.be');
    
    setLoadingStatus(isYoutube ? "Analyzing video transcript..." : "Reading web page...");
    setLoadingIcon(isYoutube ? "fa-play-circle" : "fa-globe");

    try {
      const response = await fetch(`https://r.jina.ai/${url}`);
      if (!response.ok) return { content: undefined, type: 'text' as const };
      const content = await response.text();
      return { 
        content: content.slice(0, 20000),
        type: isYoutube ? 'video' as const : 'web' as const 
      };
    } catch (e) {
      return { content: undefined, type: 'text' as const };
    }
  };

  const handleSendMessage = async (content: string, attachment?: MessageAttachment) => {
    // API 키 체크 강화
    const currentApiKey = process.env.API_KEY;
    if (!currentApiKey || currentApiKey === "undefined" || currentApiKey.trim() === "") {
      alert("⚠️ Gemini API Key가 설정되지 않았습니다.\nVercel 환경 변수나 .env 파일에 API_KEY를 추가해주세요.");
      return;
    }
    
    if (!currentSessionId || (!content.trim() && !attachment)) return;

    const userMessage: Message = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role: Role.USER,
      content: content || (attachment?.mimeType === 'application/pdf' ? `Analyzed PDF: ${attachment.fileName || 'document.pdf'}` : "[Image]"),
      timestamp: Date.now(),
      attachment
    };

    setSessions(prev => prev.map(s => {
      if (s.id === currentSessionId) {
        const newTitle = s.messages.length === 0 
          ? (content.slice(0, 30) || (attachment?.fileName ? `File: ${attachment.fileName}` : "Visual Analysis")) 
          : s.title;
        return { ...s, title: newTitle, messages: [...s.messages, userMessage] };
      }
      return s;
    }));
    
    setIsTyping(true);

    let webData = { content: undefined as string | undefined, type: 'text' as 'text' | 'web' | 'video' };
    if (content && !attachment) {
      webData = await fetchWebContent(content);
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
      const isPdf = attachment?.mimeType === 'application/pdf';
      setLoadingStatus(isPdf ? "Reading PDF..." : webData.type === 'video' ? "Summarizing..." : "Thinking...");
      setLoadingIcon(isPdf ? "fa-file-lines" : "fa-sparkles");

      await streamChatResponse(
        content || (isPdf ? "Analyze and summarize this PDF document." : "Analyze this image."),
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
        attachment,
        webData.content,
        webData.type
      );
    } catch (error: any) {
      console.error("Stream error detail:", error);
      // 에러 메시지를 더 구체적으로 표시하도록 수정
      const rawError = error?.message || "Unknown error";
      const displayError = `❌ 오류 발생: ${rawError}\n\n도움말: API 키가 올바른지, 혹은 할당량이 초과되지 않았는지 확인해주세요.`;
      
      setSessions(prev => prev.map(s => {
        if (s.id === currentSessionId) {
          const updatedMessages = s.messages.map(m => 
            m.id === botMessageId ? { ...m, content: displayError } : m
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
        
        {apiKeyError && (
          <div className="bg-red-500/10 border-b border-red-500/20 px-6 py-3 text-xs font-bold text-red-600 dark:text-red-400 flex items-center justify-center space-x-2 animate-pulse">
            <i className="fa-solid fa-circle-exclamation"></i>
            <span>설정 오류: Gemini API_KEY가 감지되지 않았습니다. 환경 변수를 확인해 주세요.</span>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 space-y-4 md:p-6 lg:p-10 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-slate-800">
          {!currentSession || currentSession.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
              <div className="max-w-xl mx-auto px-4 animate-in fade-in zoom-in-95 duration-700">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter mb-4 bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400 bg-clip-text text-transparent leading-[1.15]">
                  {WELCOME_TEXTS[language].title}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium text-[13px] md:text-sm max-w-md mx-auto opacity-70">
                  {WELCOME_TEXTS[language].desc}
                </p>
              </div>
            </div>
          ) : (
            currentSession.messages.map((message) => (
              <ChatMessage key={message.id} message={message} userProfile={userProfile} />
            ))
          )}
          {(isTyping || loadingStatus) && (
            <div className="flex items-center space-x-3 text-[11px] font-black uppercase tracking-[0.2em] text-primary-500/70 ml-2">
              <i className={`fa-solid ${loadingIcon || 'fa-sparkles'} animate-spin-slow`}></i>
              <span>{loadingStatus || "Thinking..."}</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </main>

        <footer className="p-3 sm:p-4 md:p-8">
          <ChatInput 
            onSend={handleSendMessage} 
            disabled={isTyping || !!loadingStatus} 
            language={language} 
          />
        </footer>
      </div>
    </div>
  );
};

export default App;
