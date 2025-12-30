
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Role, Message, ChatSession } from './types';
import { streamChatResponse } from './services/geminiService';
import ChatSidebar from './components/ChatSidebar';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import Header from './components/Header';

const App: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with a default session if none exist
  useEffect(() => {
    const saved = localStorage.getItem('gemini_sessions');
    if (saved) {
      const parsed = JSON.parse(saved);
      setSessions(parsed);
      if (parsed.length > 0) {
        setCurrentSessionId(parsed[0].id);
      }
    } else {
      createNewSession();
    }
  }, []);

  // Save sessions to local storage
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('gemini_sessions', JSON.stringify(sessions));
    }
  }, [sessions]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [sessions, currentSessionId, scrollToBottom]);

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
  };

  const currentSession = sessions.find(s => s.id === currentSessionId) || null;

  const handleSendMessage = async (content: string) => {
    if (!currentSessionId || !content.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: Role.USER,
      content,
      timestamp: Date.now(),
    };

    // Add user message to state
    const updatedSessionsWithUser = sessions.map(s => {
      if (s.id === currentSessionId) {
        // Update title if it's the first message
        const newTitle = s.messages.length === 0 ? content.slice(0, 30) + (content.length > 30 ? '...' : '') : s.title;
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

    // Prepare placeholder for bot response
    setSessions(prev => prev.map(s => {
      if (s.id === currentSessionId) {
        return { ...s, messages: [...s.messages, botMessage] };
      }
      return s;
    }));

    try {
      let accumulatedText = "";
      await streamChatResponse(
        content,
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
        }
      );
    } catch (error) {
      console.error(error);
      setSessions(prev => prev.map(s => {
        if (s.id === currentSessionId) {
          const updatedMessages = s.messages.map(m => 
            m.id === botMessageId ? { ...m, content: "Sorry, I encountered an error. Please try again." } : m
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
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      <ChatSidebar 
        sessions={sessions} 
        currentSessionId={currentSessionId} 
        onSelectSession={setCurrentSessionId}
        onNewSession={createNewSession}
        onDeleteSession={deleteSession}
      />
      
      <div className="flex flex-col flex-1 h-full min-w-0">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-4 space-y-4 md:p-6 lg:p-8 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
          {currentSession?.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400">
                <i className="fa-solid fa-robot text-4xl"></i>
              </div>
              <div>
                <h2 className="text-2xl font-bold">Hello, I'm Gemini Messenger</h2>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mt-2">
                  I'm powered by Google's latest Gemini model. Ask me anything, or start a new conversation.
                </p>
              </div>
            </div>
          ) : (
            currentSession?.messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))
          )}
          {isTyping && (
            <div className="flex items-center space-x-2 text-sm text-gray-500 animate-pulse">
              <i className="fa-solid fa-circle-notch fa-spin"></i>
              <span>Gemini is thinking...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </main>

        <footer className="p-4 md:p-6 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
          <ChatInput onSend={handleSendMessage} disabled={isTyping} />
          <p className="text-[10px] text-center text-gray-400 mt-2">
            AI can make mistakes. Consider checking important information.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default App;
