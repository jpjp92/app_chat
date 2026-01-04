
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Role, Message, ChatSession, UserProfile, MessageAttachment, Language, SourceType, GroundingSource } from './types';
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
    desc: "궁금한 것을 물어보거나 실시간 검색이 필요한 질문을 해보세요."
  },
  en: {
    title: <>Hello there!<br/>What's on your mind?</>,
    desc: "Ask a question, share a PDF, or ask about latest news."
  },
  es: {
    title: <>¡Hola!<br/>¿De qué hablamos hoy?</>,
    desc: "Haz una pregunta o consulta las últimas noticias."
  },
  fr: {
    title: <>Bonjour !<br/>De quoi parlons-nous ?</>,
    desc: "Posez une question ou renseignez-vous sur l'actualité."
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
    const key1 = process.env.API_KEY;
    const key2 = process.env.API_KEY2;
    const hasAnyKey = (key1 && key1 !== "undefined") || (key2 && key2 !== "undefined");
    
    if (!hasAnyKey) {
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
    
    setLoadingStatus(isYoutube ? (language === 'ko' ? "영상 요약 분석 중..." : "Analyzing video...") : (language === 'ko' ? "웹 페이지 읽는 중..." : "Reading page..."));
    setLoadingIcon(isYoutube ? "fa-play-circle" : "fa-globe");

    try {
      const response = await fetch(`https://r.jina.ai/${url}`, {
        method: 'GET',
        headers: {
          'Accept': 'text/event-stream',
          'X-With-Images-Summary': 'true',
          'X-Target-Selector': 'article, main, .post-content'
        }
      });

      if (response.status === 403) {
        return { 
          content: `[ERROR: 403 Forbidden] 이 사이트는 현재 보안 정책으로 인해 직접 접근이 차단되어 있습니다. 대신 Google 검색을 통해 관련 정보를 찾아보겠습니다.`, 
          type: 'text' as const 
        };
      }
      
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
    if (apiKeyError) {
      alert("⚠️ Gemini API Key가 설정되지 않았습니다.");
      return;
    }
    
    if (!currentSessionId || (!content.trim() && !attachment)) return;

    const userMessage: Message = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role: Role.USER,
      content: content || (attachment?.mimeType === 'application/pdf' ? `Analyzed PDF: ${attachment.fileName || 'document.pdf'}` : "[Image]"),
      timestamp: Date.now(),
      attachment,
      sourceType: attachment?.mimeType === 'application/pdf' ? 'pdf' : (attachment ? 'image' : 'text')
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

    let webData = { content: undefined as string | undefined, type: 'text' as SourceType };
    if (content && !attachment) {
      const res = await fetchWebContent(content);
      webData = { content: res.content, type: res.type };
    }

    const botMessageId = `bot-${Date.now()}`;
    const botMessage: Message = {
      id: botMessageId,
      role: Role.MODEL,
      content: '',
      timestamp: Date.now(),
      sourceType: webData.type !== 'text' && webData.content && !webData.content.includes("[ERROR: 403]") ? webData.type : undefined,
      groundingSources: []
    };

    setSessions(prev => prev.map(s => {
      if (s.id === currentSessionId) {
        return { ...s, messages: [...s.messages, botMessage] };
      }
      return s;
    }));

    try {
      let accumulatedText = "";
      let foundSources: GroundingSource[] = [];
      const isPdf = attachment?.mimeType === 'application/pdf';
      
      setLoadingStatus(isPdf ? "Reading PDF..." : "Thinking...");
      setLoadingIcon("fa-magnifying-glass");

      await streamChatResponse(
        content || (isPdf ? "Analyze and summarize this PDF document." : "Analyze this image."),
        currentSession?.messages || [],
        (chunk, isReset) => {
          if (isReset) {
            accumulatedText = ""; // 페일오버 시 텍스트 초기화
          } else {
            accumulatedText += chunk;
          }
          
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
        webData.type === 'web' || webData.type === 'video' ? webData.type : 'text',
        (sources) => {
          foundSources = [...foundSources, ...sources];
          const uniqueSources = Array.from(new Set(foundSources.map(s => s.uri)))
            .map(uri => foundSources.find(s => s.uri === uri)!);
            
          setSessions(prev => prev.map(s => {
            if (s.id === currentSessionId) {
              return {
                ...s,
                messages: s.messages.map(m => 
                  m.id === botMessageId ? { ...m, groundingSources: uniqueSources } : m
                )
              };
            }
            return s;
          }));
        }
      );
    } catch (error: any) {
      // 에러 메시지를 훨씬 깔끔하게 표시
      let displayError = "❌ 대화 중 오류가 발생했습니다.";
      if (error.message.includes("quota") || error.message.includes("429")) {
        displayError = "⚠️ 모든 API 키의 할당량이 초과되었습니다. 잠시 후 다시 시도해주세요.";
      } else if (error.message.includes("API key not valid") || error.message.includes("401")) {
        displayError = "🔑 API 키 인증에 실패했습니다. Vercel 환경 변수 설정을 확인해주세요.";
      } else {
        displayError = `❌ 오류: ${error.message}`;
      }
      
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
            <span>Gemini API_KEY 환경 변수가 설정되지 않았습니다. Vercel 설정을 확인하세요.</span>
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
              <span>{loadingStatus || "Searching Google..."}</span>
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
