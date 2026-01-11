
import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import ChatSidebar from './components/ChatSidebar';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import { streamChatResponse, summarizeConversation } from './services/geminiService';
import { Role, Message, ChatSession, UserProfile, Language, GroundingSource, MessageAttachment } from './types';

const App: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>('ko');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<string | null>(null);
  
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'User',
    avatarUrl: 'https://ui-avatars.com/api/?name=U&background=6366f1&color=fff&rounded=true&bold=true'
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const welcomeMessages = {
    ko: { title: "반가워요!", subtitle: "오늘은 어떤 이야기를 나눌까요?", desc: "궁금한 질문이나 실시간 검색을 해보세요." },
    en: { title: "Hello there!", subtitle: "What's on your mind?", desc: "Ask questions or search in real-time." },
    es: { title: "¡Hola!", subtitle: "¿De qué hablamos hoy?", desc: "Haz preguntas or busca en tempo real." },
    fr: { title: "Bonjour!", subtitle: "De quoi parlons-nous ?", desc: "Posez des questions ou cherchez en direct." }
  };

  useEffect(() => {
    const savedSessions = localStorage.getItem('gemini_chat_sessions');
    if (savedSessions) {
      const parsed = JSON.parse(savedSessions);
      setSessions(parsed);
      if (parsed.length > 0) setCurrentSessionId(parsed[0].id);
    } else {
      handleNewSession();
    }
    
    const savedProfile = localStorage.getItem('gemini_user_profile');
    if (savedProfile) setUserProfile(JSON.parse(savedProfile));
    
    const savedLang = localStorage.getItem('gemini_language') as Language;
    if (savedLang) setLanguage(savedLang);
  }, []);

  useEffect(() => {
    localStorage.setItem('gemini_chat_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessions, currentSessionId, isTyping]);

  const handleNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      createdAt: Date.now()
    };
    setSessions([newSession, ...sessions]);
    setCurrentSessionId(newSession.id);
    setIsSidebarOpen(false);
  };

  const handleSelectSession = (id: string) => {
    setCurrentSessionId(id);
    setIsSidebarOpen(false);
  };

  const handleDeleteSession = (id: string) => {
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    if (currentSessionId === id) setCurrentSessionId(updated.length > 0 ? updated[0].id : null);
    if (updated.length === 0) handleNewSession();
  };

  const handleUpdateProfile = (profile: UserProfile) => {
    const finalProfile = {
      ...profile,
      avatarUrl: profile.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name[0])}&background=6366f1&color=fff&rounded=true&bold=true`
    };
    setUserProfile(finalProfile);
    localStorage.setItem('gemini_user_profile', JSON.stringify(finalProfile));
  };

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('gemini_language', lang);
  };

  const currentSession = sessions.find(s => s.id === currentSessionId);

  const triggerAutoTitle = async (sessionId: string, currentHistory: Message[]) => {
    try {
      const newTitle = await summarizeConversation(currentHistory, language);
      if (newTitle && newTitle !== "New Chat") {
        setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, title: newTitle } : s));
      }
    } catch (err) {
      console.warn("Title auto-update failed", err);
    }
  };

  const handleSendMessage = async (content: string, attachment?: MessageAttachment) => {
    if (!currentSessionId || (!content.trim() && !attachment)) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      content,
      timestamp: Date.now(),
      attachment
    };

    let latestHistory: Message[] = [];

    setSessions(prev => prev.map(s => {
      if (s.id === currentSessionId) {
        latestHistory = [...s.messages, userMessage];
        const isFirstMessage = s.messages.length === 0;
        const tempTitle = isFirstMessage ? (content.slice(0, 20) || 'New Chat') : s.title;
        return { ...s, messages: latestHistory, title: tempTitle };
      }
      return s;
    }));

    setIsTyping(true);
    let modelResponse = '';
    const modelMessageId = (Date.now() + 1).toString();

    try {
      await streamChatResponse(
        content,
        currentSession?.messages || [],
        (chunk, isReset) => {
          if (isReset) modelResponse = "";
          modelResponse += chunk;
          setSessions(prev => prev.map(s => {
            if (s.id === currentSessionId) {
              const existingMsgIndex = s.messages.findIndex(m => m.id === modelMessageId);
              if (existingMsgIndex > -1) {
                const updatedMessages = [...s.messages];
                updatedMessages[existingMsgIndex] = { ...updatedMessages[existingMsgIndex], content: modelResponse };
                return { ...s, messages: updatedMessages };
              } else {
                const newModelMsg: Message = { id: modelMessageId, role: Role.MODEL, content: modelResponse, timestamp: Date.now() };
                return { ...s, messages: [...s.messages, newModelMsg] };
              }
            }
            return s;
          }));
        },
        language,
        attachment,
        undefined,
        'text',
        (sources) => {
          setSessions(prev => prev.map(s => {
            if (s.id === currentSessionId) {
              return {
                ...s,
                messages: s.messages.map(m => m.id === modelMessageId ? { ...m, groundingSources: sources } : m)
              };
            }
            return s;
          }));
        }
      );

      // 제목 요약 트리거
      const finalHistory = [...latestHistory, { id: modelMessageId, role: Role.MODEL, content: modelResponse, timestamp: Date.now() }];
      if (finalHistory.length >= 2 && finalHistory.length <= 6) {
        triggerAutoTitle(currentSessionId, finalHistory);
      }

    } catch (error: any) {
      setLoadingStatus(error.message);
      setTimeout(() => setLoadingStatus(null), 5000);
    } finally {
      setIsTyping(false);
    }
  };

  const currentWelcome = (welcomeMessages as any)[language] || welcomeMessages.ko;

  return (
    <div className="flex h-screen bg-white dark:bg-[#131314] text-slate-900 dark:text-[#e3e3e3] overflow-hidden font-sans">
      <ChatSidebar 
        sessions={sessions}
        currentSessionId={currentSessionId}
        language={language}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onLanguageChange={handleLanguageChange}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
      />

      <div className="flex-1 flex flex-col min-w-0 relative">
        <Header userProfile={userProfile} onUpdateProfile={handleUpdateProfile} onMenuClick={() => setIsSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto px-2 sm:px-10 lg:px-20 custom-scrollbar pt-2 sm:pt-4">
          <div className="max-w-3xl mx-auto flex flex-col h-full">
            {currentSession?.messages.length === 0 && (
              <div className="flex flex-col items-center justify-center flex-1 py-4 sm:py-20 animate-in fade-in zoom-in-95 duration-1000">
                <div className="text-center">
                  <h1 className="text-4xl sm:text-6xl font-medium tracking-tight bg-gradient-to-r from-blue-500 via-purple-500 to-red-500 bg-clip-text text-transparent mb-2 sm:mb-6">
                    {currentWelcome.title}
                  </h1>
                  <p className="text-slate-400 dark:text-slate-500 text-sm sm:text-2xl font-medium px-4">
                    {currentWelcome.subtitle}
                  </p>
                </div>
              </div>
            )}
            
            <div className="flex flex-col space-y-2">
              {currentSession?.messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} userProfile={userProfile} />
              ))}
            </div>
            
            {/* 인터랙티브 점 애니메이션 복구 */}
            {isTyping && currentSession?.messages.length > 0 && currentSession.messages[currentSession.messages.length - 1].role === Role.USER && (
              <div className="flex items-start gap-4 mt-4 pl-1">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 via-primary-500 to-violet-500 flex items-center justify-center shadow-lg shadow-primary-500/10">
                    <i className="fa-solid fa-sparkles text-white text-[10px]"></i>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 py-4">
                  <div className="w-2 h-2 bg-slate-300 dark:bg-slate-600 rounded-full animate-bounce [animation-duration:0.8s]"></div>
                  <div className="w-2 h-2 bg-slate-300 dark:bg-slate-600 rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.2s]"></div>
                  <div className="w-2 h-2 bg-slate-300 dark:bg-slate-600 rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.4s]"></div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} className="h-4 sm:h-10" />
          </div>
        </main>

        <footer className="p-1 sm:p-4 pt-0">
          <ChatInput onSend={handleSendMessage} disabled={isTyping} language={language} />
          <div className="mt-1 text-center">
            <p className="text-[8px] sm:text-[11px] text-slate-400 dark:text-slate-500 px-4 opacity-70">
              Gemini는 실수할 수 있습니다.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
