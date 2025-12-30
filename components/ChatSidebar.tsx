import React, { useState, useRef, useEffect } from 'react';
import { ChatSession, Language } from '../types';

interface ChatSidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  language: Language;
  isOpen?: boolean;
  onClose?: () => void;
  onLanguageChange: (lang: Language) => void;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ 
  sessions, 
  currentSessionId, 
  language,
  isOpen,
  onClose,
  onLanguageChange,
  onSelectSession, 
  onNewSession,
  onDeleteSession
}) => {
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages: { code: Language; name: string; label: string }[] = [
    { code: 'ko', name: '한국어', label: 'Korean' },
    { code: 'en', name: 'English', label: 'US' },
    { code: 'es', name: 'Español', label: 'Spanish' },
    { code: 'fr', name: 'Français', label: 'French' },
  ];

  const currentLang = languages.find(l => l.code === language) || languages[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-300"
          onClick={onClose}
        ></div>
      )}

      <aside className={`fixed md:relative flex flex-col w-72 lg:w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-full transition-all duration-300 z-50 ${
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="p-6 flex items-center justify-between">
          <button 
            onClick={onNewSession}
            className="flex-1 group flex items-center justify-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3.5 px-4 rounded-2xl transition-all duration-300 shadow-lg shadow-primary-500/25 active:scale-[0.98]"
          >
            <i className="fa-solid fa-plus group-hover:rotate-90 transition-transform duration-300"></i>
            <span>New Chat</span>
          </button>
          
          <button 
            onClick={onClose}
            className="md:hidden ml-4 w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-1.5 pb-6">
          <div className="flex items-center justify-between px-2 mb-4">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">History</h3>
            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-500">{sessions.length}</span>
          </div>
          
          {sessions.map((session) => (
            <div 
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className={`group relative flex items-center px-4 py-3.5 rounded-2xl cursor-pointer transition-all duration-300 border-2 ${
                currentSessionId === session.id 
                  ? 'bg-primary-50 dark:bg-primary-950/30 border-primary-100 dark:border-primary-900/30 text-primary-700 dark:text-primary-400' 
                  : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
              }`}
            >
              <div className={`w-2 h-2 rounded-full mr-3 transition-all duration-300 ${
                currentSessionId === session.id ? 'bg-primary-500' : 'bg-slate-300 dark:bg-slate-700'
              }`}></div>
              <span className="truncate flex-1 text-sm font-semibold">{session.title}</span>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if(confirm('Delete this chat?')) onDeleteSession(session.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 transition-all transform hover:scale-110"
              >
                <i className="fa-solid fa-trash-can text-xs"></i>
              </button>
            </div>
          ))}
        </div>

        {/* Custom Language Selector */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30">
          <div className="relative" ref={dropdownRef}>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1 block">Language</label>
            
            {/* Language Menu Popover */}
            {isLangMenuOpen && (
              <div className="absolute bottom-full left-0 w-full mb-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300 z-[60]">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      onLanguageChange(lang.code);
                      setIsLangMenuOpen(false);
                    }}
                    className={`w-full flex items-center px-4 py-3.5 text-sm transition-colors ${
                      language === lang.code 
                        ? 'bg-primary-500 text-white font-bold' 
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <span className="flex-1 text-left">{lang.name} ({lang.label})</span>
                    {language === lang.code && <i className="fa-solid fa-check text-xs"></i>}
                  </button>
                ))}
              </div>
            )}

            {/* Trigger Button */}
            <button 
              onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
              className="w-full flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm hover:shadow-md transition-all active:scale-[0.98] ring-offset-2 focus:ring-2 focus:ring-primary-500/20"
            >
              <i className="fa-solid fa-globe mr-3 text-slate-400"></i>
              <span className="flex-1 text-left">{currentLang.name} ({currentLang.label})</span>
              <i className={`fa-solid fa-chevron-up transition-transform duration-300 text-[10px] text-slate-400 ${isLangMenuOpen ? 'rotate-180' : ''}`}></i>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default ChatSidebar;