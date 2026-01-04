
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'https://esm.sh/react-markdown@9';
import remarkGfm from 'https://esm.sh/remark-gfm@4';
import { Role, Message, UserProfile } from '../types';
import { generateSpeech, playRawAudio, stopAudio } from '../services/geminiService';

interface ChatMessageProps {
  message: Message;
  userProfile?: UserProfile;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, userProfile }) => {
  const isUser = message.role === Role.USER;
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // 하위 호환성을 위해 attachment가 없으면 image 사용
  const attachment = message.attachment || message.image;

  useEffect(() => {
    return () => {
      if (isPlaying) {
        stopAudio();
      }
    };
  }, [isPlaying]);

  const handleCopy = async () => {
    if (!message.content) return;
    try {
      await navigator.clipboard.writeText(message.content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handlePlayVoice = async () => {
    if (isPlaying || isGenerating) {
      stopAudio();
      setIsPlaying(false);
      setIsGenerating(false);
      return;
    }

    if (!message.content) return;
    
    setIsGenerating(true);
    try {
      // 마크다운 문법 제거 후 최대 2000자까지 음성 합성
      const plainText = message.content.replace(/[#*`_~]/g, '').slice(0, 2000);
      const audioData = await generateSpeech(plainText);
      
      setIsGenerating(false);
      setIsPlaying(true);
      await playRawAudio(audioData);
    } catch (error) {
      console.error("TTS System Error:", error);
    } finally {
      setIsGenerating(false);
      setIsPlaying(false);
    }
  };

  const MarkdownComponents = {
    h1: ({ ...props }) => <h1 className="text-lg font-black mb-3 mt-2 border-b-2 pb-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white" {...props} />,
    h2: ({ ...props }) => <h2 className="text-md font-bold mb-2.5 mt-4 text-slate-800 dark:text-slate-100" {...props} />,
    p: ({ ...props }) => <p className="mb-2.5 last:mb-0 leading-relaxed break-words text-sm sm:text-[15px]" {...props} />,
    ul: ({ ...props }) => <ul className="list-disc ml-4 mb-3 space-y-1" {...props} />,
    li: ({ ...props }) => <li className="pl-1 text-slate-700 dark:text-slate-300" {...props} />,
    code: ({ children }: any) => <code className="bg-slate-100 dark:bg-slate-900/80 px-1.5 py-0.5 rounded text-[12px] font-mono text-primary-600 border border-slate-200 dark:border-slate-800">{children}</code>,
  };

  const getSourceIcon = () => {
    switch (message.sourceType) {
      case 'web': return { icon: 'fa-globe', text: 'Web Content' };
      case 'video': return { icon: 'fa-play-circle', text: 'Video Summary' };
      case 'pdf': return { icon: 'fa-file-pdf', text: 'PDF Document' };
      case 'image': return { icon: 'fa-image', text: 'Visual Analysis' };
      default: return null;
    }
  };

  const sourceInfo = getSourceIcon();

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-6 sm:mb-8 group animate-in fade-in slide-in-from-bottom-4 duration-500`}>
      <div className={`flex max-w-[88%] sm:max-w-[85%] lg:max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start`}>
        <div className={`flex-shrink-0 ${isUser ? 'ml-2' : 'mr-2'} relative pt-1`}>
          {isUser && userProfile?.avatarUrl ? (
            <img src={userProfile.avatarUrl} className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl object-cover shadow-md border-2 border-white dark:border-slate-800" alt="User" />
          ) : (
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-xs font-bold shadow-lg ${isUser ? 'bg-primary-500 text-white' : 'bg-white dark:bg-slate-800 text-primary-600'}`}>
              {isUser ? <i className="fa-solid fa-user"></i> : <i className="fa-solid fa-robot"></i>}
            </div>
          )}
        </div>
        
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} min-w-0`}>
          {attachment && (
            <div className={`mb-2 max-w-sm rounded-xl overflow-hidden shadow-xl ${isUser ? 'mr-0' : 'ml-0'}`}>
              {attachment.mimeType === 'application/pdf' ? (
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-xl flex items-center space-x-3 min-w-[200px]">
                  <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center text-red-500">
                    <i className="fa-solid fa-file-pdf text-xl"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{attachment.fileName || 'document.pdf'}</p>
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">PDF Document</p>
                  </div>
                </div>
              ) : (
                <img src={attachment.data} alt="Attachment" className="max-w-full h-auto block rounded-xl border border-slate-200 dark:border-slate-700" />
              )}
            </div>
          )}
          
          <div className={`relative px-4 py-2.5 sm:px-5 sm:py-4 rounded-2xl shadow-sm border ${
            isUser ? 'bg-primary-600 text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border-slate-100 dark:border-slate-700/50'
          }`}>
            <div className="text-sm sm:text-[15px] font-medium leading-relaxed overflow-hidden">
              {message.content ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents as any}>{message.content}</ReactMarkdown>
              ) : (
                <div className="flex space-x-1.5 py-1.5"><div className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce"></div><div className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div><div className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div></div>
              )}
            </div>
            
            <div className={`flex items-center space-x-2 mt-2 sm:mt-2.5 ${isUser ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
              <div className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] opacity-30">
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>

              {sourceInfo && (
                <div className={`flex items-center px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 space-x-1.5 ${isUser ? 'mr-auto' : 'ml-auto'}`}>
                  <i className={`fa-solid ${sourceInfo.icon} text-[8px] text-primary-500`}></i>
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{sourceInfo.text}</span>
                </div>
              )}

              {message.content && (
                <button 
                  onClick={handleCopy}
                  className={`flex items-center justify-center w-6 h-6 rounded-full transition-all hover:bg-slate-100 dark:hover:bg-slate-700 ${isCopied ? 'text-green-500' : 'text-slate-400'}`}
                >
                  <i className={`fa-solid ${isCopied ? 'fa-check' : 'fa-copy'} text-[10px]`}></i>
                </button>
              )}
              
              {!isUser && message.content && (
                <button 
                  onClick={handlePlayVoice}
                  className={`flex items-center justify-center w-6 h-6 rounded-full transition-all hover:bg-slate-100 dark:hover:bg-slate-700 ${isPlaying || isGenerating ? 'text-primary-500' : 'text-slate-400'}`}
                >
                  <i className={`fa-solid ${isGenerating ? 'fa-spinner fa-spin' : isPlaying ? 'fa-circle-stop' : 'fa-volume-low'} text-[10px]`}></i>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
