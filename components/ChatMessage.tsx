
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'https://esm.sh/react-markdown@9';
import remarkGfm from 'https://esm.sh/remark-gfm@4';
import { Role, Message, UserProfile } from '../types';
import { generateSpeech, playRawAudio, stopAudio } from '../services/geminiService';

interface ChatMessageProps {
  message: Message;
}

interface ChatMessageFullProps extends ChatMessageProps {
  userProfile?: UserProfile;
}

const ChatMessage: React.FC<ChatMessageFullProps> = ({ message, userProfile }) => {
  const isUser = message.role === Role.USER;
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

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
    h1: ({ ...props }) => <h1 className="text-xl font-bold mb-4 mt-2 text-slate-900 dark:text-white" {...props} />,
    h2: ({ ...props }) => <h2 className="text-lg font-bold mb-3 mt-4 text-slate-800 dark:text-slate-100" {...props} />,
    p: ({ ...props }) => <p className="mb-4 last:mb-0 leading-relaxed text-[15px] sm:text-[16px]" {...props} />,
    ul: ({ ...props }) => <ul className="list-disc ml-5 mb-4 space-y-2" {...props} />,
    li: ({ ...props }) => <li className="pl-1 text-slate-700 dark:text-slate-300" {...props} />,
    // 인라인 코드와 코드 블록 내부 코드를 확실히 구분
    code: ({ children, className, ...props }: any) => {
      const isInline = !className || !className.includes('language-');
      return (
        <code 
          className={isInline 
            ? "bg-slate-100 dark:bg-[#2a2a2c] px-1.5 py-0.5 rounded text-[13px] font-mono text-primary-600 dark:text-primary-400 border border-slate-200 dark:border-white/5"
            : "bg-transparent p-0 border-none text-inherit font-mono shadow-none !bg-none"
          } 
          {...props}
        >
          {children}
        </code>
      );
    },
    // 코드 블록 전체 스타일: 다크 톤으로 통일
    pre: ({ children }: any) => (
      <pre className="bg-[#0d1117] text-[#e6edf3] p-4 rounded-xl overflow-x-auto my-4 text-[13px] sm:text-[14px] font-mono border border-slate-200 dark:border-white/10 shadow-lg leading-normal">
        {children}
      </pre>
    ),
    table: ({ children }: any) => (
      <div className="my-6 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-sm text-left border-collapse">{children}</table>
      </div>
    ),
    thead: ({ children }: any) => <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-slate-800">{children}</thead>,
    th: ({ children }: any) => <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-200 border-r border-slate-200 dark:border-slate-800 last:border-r-0">{children}</th>,
    td: ({ children }: any) => <td className="px-4 py-3 text-slate-600 dark:text-slate-300 border-b border-r border-slate-200 dark:border-slate-800 last:border-r-0 group-last:border-b-0">{children}</td>,
    tr: ({ children }: any) => <tr className="group border-b border-slate-100 dark:border-slate-800 last:border-b-0 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">{children}</tr>,
  };

  const renderAttachment = () => {
    if (!attachment) return null;

    const isImage = attachment.mimeType.startsWith('image/');
    const isPDF = attachment.mimeType === 'application/pdf';

    if (isImage) {
      return (
        <div className={`mb-3 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm ${isUser ? 'origin-right' : 'origin-left'}`}>
          <img src={attachment.data} alt="Attachment" className="max-w-[280px] sm:max-w-[400px] h-auto object-cover" />
        </div>
      );
    }

    if (isPDF) {
      return (
        <div className={`mb-3 flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 flex-shrink-0">
            <i className="fa-solid fa-file-pdf text-xl"></i>
          </div>
          <div className={`flex flex-col min-w-0 ${isUser ? 'items-end' : 'items-start'}`}>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate max-w-[200px]">
              {attachment.fileName || 'document.pdf'}
            </span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">PDF Document</span>
          </div>
        </div>
      );
    }

    return (
      <div className="mb-3 flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
        <i className="fa-solid fa-file text-slate-400 flex-shrink-0"></i>
        <span className="text-sm text-slate-600 dark:text-slate-300 truncate">{attachment.fileName || 'Attachment'}</span>
      </div>
    );
  };

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-8 group animate-in fade-in duration-500`}>
      <div className={`flex max-w-[98%] sm:max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-4`}>
        
        {!isUser && (
          <div className="flex-shrink-0 mt-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 via-primary-500 to-violet-500 flex items-center justify-center shadow-lg shadow-primary-500/10">
              <i className="fa-solid fa-sparkles text-white text-[10px]"></i>
            </div>
          </div>
        )}
        
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} min-w-0 flex-1`}>
          
          {renderAttachment()}
          
          <div className={`relative transition-all duration-300 ${
            isUser 
              ? 'px-5 py-3 rounded-[24px] bg-[#eff1f1] dark:bg-[#2f2f2f] text-slate-800 dark:text-slate-100 shadow-sm' 
              : 'px-1 py-1 text-slate-800 dark:text-[#e3e3e3] w-full'
          }`}>
            <div className="font-normal leading-relaxed">
              {message.content ? (
                <div className="prose dark:prose-invert max-w-none prose-p:leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents as any}>
                    {message.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="flex space-x-1.5 py-4">
                  <div className="w-2 h-2 bg-slate-300 dark:bg-slate-600 rounded-full animate-bounce [animation-duration:0.8s]"></div>
                  <div className="w-2 h-2 bg-slate-300 dark:bg-slate-600 rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.2s]"></div>
                  <div className="w-2 h-2 bg-slate-300 dark:bg-slate-600 rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.4s]"></div>
                </div>
              )}
            </div>

            {!isUser && message.content && (
              <div className="flex items-center gap-6 mt-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={handlePlayVoice} className={`text-slate-400 hover:text-primary-500 transition-colors flex items-center gap-2 text-[12px] font-medium ${isPlaying || isGenerating ? 'text-primary-500' : ''}`}>
                  <i className={`fa-solid ${isGenerating ? 'fa-spinner fa-spin' : isPlaying ? 'fa-circle-stop' : 'fa-volume-high'}`}></i>
                </button>
                <button onClick={handleCopy} className={`text-slate-400 hover:text-primary-500 transition-colors flex items-center gap-2 text-[12px] font-medium ${isCopied ? 'text-green-500' : ''}`}>
                  <i className={`fa-solid ${isCopied ? 'fa-check' : 'fa-copy'}`}></i>
                </button>
              </div>
            )}
          </div>

          {!isUser && message.groundingSources && message.groundingSources.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2 animate-in fade-in duration-700">
              {message.groundingSources.map((source, idx) => (
                <a 
                  key={idx} 
                  href={source.uri} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 rounded-full bg-slate-50 dark:bg-[#1e1e1f] border border-slate-200 dark:border-slate-800 hover:border-primary-500 transition-all group"
                >
                  <img 
                    src={`https://www.google.com/s2/favicons?domain=${new URL(source.uri).hostname}&sz=32`} 
                    alt="fav" 
                    className="w-3.5 h-3.5 mr-2"
                  />
                  <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 truncate max-w-[150px]">{source.title}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
