
import React, { useState, useRef, useEffect } from 'react';
import { MessageAttachment, Language } from '../types';

interface ChatInputProps {
  onSend: (message: string, attachment?: MessageAttachment) => void;
  disabled?: boolean;
  language?: Language;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled, language = 'ko' }) => {
  const [input, setInput] = useState('');
  const [selectedAttachment, setSelectedAttachment] = useState<MessageAttachment | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isAutoSending, setIsAutoSending] = useState(false);
  const [sttError, setSttError] = useState<string | null>(null);
  const [isSTTSupported, setIsSTTSupported] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef('');
  const autoSendTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto'; 
      const newHeight = Math.min(textarea.scrollHeight, 150);
      textarea.style.height = `${Math.max(newHeight, 40)}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [input]);

  // 자동 전송 타이머 로직 (2초로 조정)
  useEffect(() => {
    if (isListening && input.trim()) {
      if (autoSendTimerRef.current) clearTimeout(autoSendTimerRef.current);
      
      setIsAutoSending(false);

      // 사용자가 말을 멈추고 1.2초가 지나면 "곧 전송됨" 상태 표시
      const preSendTimer = setTimeout(() => {
        if (isListening && input.trim()) setIsAutoSending(true);
      }, 1200);

      // 2초 후 자동 제출
      autoSendTimerRef.current = setTimeout(() => {
        if (isListening && input.trim()) {
          handleSubmit();
        }
      }, 2000);

      return () => {
        clearTimeout(preSendTimer);
      };
    } else {
      setIsAutoSending(false);
    }

    return () => {
      if (autoSendTimerRef.current) clearTimeout(autoSendTimerRef.current);
    };
  }, [input, isListening]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSTTSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true; 
      recognition.interimResults = true; 
      
      const langMap: Record<Language, string> = {
        ko: 'ko-KR',
        en: 'en-US',
        es: 'es-ES',
        fr: 'fr-FR'
      };
      recognition.lang = langMap[language] || 'ko-KR';

      recognition.onstart = () => {
        setIsListening(true);
        setSttError(null);
        finalTranscriptRef.current = ''; 
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let currentFinalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            currentFinalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        if (currentFinalTranscript) {
          finalTranscriptRef.current += currentFinalTranscript;
        }

        const fullDisplayPath = finalTranscriptRef.current + interimTranscript;
        if (fullDisplayPath) {
          setInput(fullDisplayPath);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        setIsAutoSending(false);
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech Recognition Error:", event.error);
        setIsListening(false);
        setIsAutoSending(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [language]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        setSttError(null);
        finalTranscriptRef.current = ''; 
        recognitionRef.current.start();
      } catch (e) {
        console.error("STT Start Error:", e);
        setIsListening(false);
      }
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (autoSendTimerRef.current) {
      clearTimeout(autoSendTimerRef.current);
      autoSendTimerRef.current = null;
    }

    if ((input.trim() || selectedAttachment) && !disabled) {
      if (isListening) recognitionRef.current.stop();
      onSend(input, selectedAttachment || undefined);
      setInput('');
      setSelectedAttachment(null);
      setIsAutoSending(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = '40px';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isPdf = file.type === 'application/pdf';
      const maxSize = isPdf ? 10 * 1024 * 1024 : 4 * 1024 * 1024; 

      if (file.size > maxSize) {
        alert(isPdf ? "PDF must be smaller than 10MB" : "Image must be smaller than 4MB");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedAttachment({
          data: reader.result as string,
          mimeType: file.type,
          fileName: file.name
        });
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getPlaceholder = () => {
    if (sttError) return sttError;
    if (isAutoSending) return language === 'ko' ? "곧 전송됩니다..." : "Sending soon...";
    if (isListening) return language === 'ko' ? "듣고 있어요..." : "Listening...";
    return "Ask anything";
  };

  return (
    <div className="max-w-4xl mx-auto px-1 sm:px-4">
      {selectedAttachment && (
        <div className="flex px-3 py-2 sm:px-4 sm:py-3 mb-2 sm:mb-3 bg-white/10 dark:bg-slate-800/50 glass-effect rounded-xl sm:rounded-2xl animate-in slide-in-from-bottom-4 duration-300 border border-white/10">
          <div className="relative group">
            {selectedAttachment.mimeType === 'application/pdf' ? (
              <div className="h-12 w-12 sm:h-16 sm:w-16 bg-red-500/10 rounded-lg flex flex-col items-center justify-center border border-red-500/20 text-red-500">
                <i className="fa-solid fa-file-pdf text-xl sm:text-2xl"></i>
                <span className="text-[8px] mt-1 font-bold truncate max-w-full px-1">{selectedAttachment.fileName}</span>
              </div>
            ) : (
              <img src={selectedAttachment.data} alt="To upload" className="h-12 w-12 sm:h-16 sm:w-16 object-cover rounded-lg sm:rounded-xl ring-2 ring-primary-500 shadow-lg" />
            )}
            <button onClick={() => setSelectedAttachment(null)} className="absolute -top-1.5 -right-1.5 bg-slate-900 text-white w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shadow-xl hover:bg-red-500 transition-all">
              <i className="fa-solid fa-xmark text-[8px] sm:text-[10px]"></i>
            </button>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className={`relative flex items-center bg-gray-100 dark:bg-[#2f2f2f] px-2 sm:px-3 py-1 sm:py-1.5 rounded-[24px] sm:rounded-full transition-all border border-transparent dark:border-white/5 ${isListening ? 'ring-2 ring-primary-500 shadow-[0_0_15px_rgba(139,92,246,0.3)]' : ''}`}>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,application/pdf" className="hidden" />
        
        <button type="button" onClick={() => fileInputRef.current?.click()} className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors">
          <i className="fa-solid fa-paperclip text-base sm:text-lg"></i>
        </button>

        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={getPlaceholder()}
          rows={1}
          disabled={disabled}
          className={`flex-1 bg-transparent px-2 py-2 sm:py-2.5 outline-none resize-none text-slate-800 dark:text-slate-200 placeholder-slate-500 dark:placeholder-slate-400 min-h-[36px] sm:min-h-[40px] max-h-[120px] sm:max-h-[150px] leading-relaxed block overflow-y-auto text-sm sm:text-[15px] font-medium ${isAutoSending ? 'opacity-50' : 'opacity-100'}`}
        />

        <div className="flex items-center space-x-1 pr-1">
          {isSTTSupported && (
            <button
              type="button"
              onClick={toggleListening}
              className={`relative w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                isListening ? 'bg-primary-500 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
              } ${isAutoSending ? 'animate-pulse' : ''}`}
            >
              <i className={`fa-solid ${isListening ? 'fa-microphone' : 'fa-microphone-lines'} text-sm`}></i>
              {isAutoSending && (
                <span className="absolute inset-0 rounded-full border-2 border-white animate-ping opacity-50"></span>
              )}
            </button>
          )}

          <button
            type="submit"
            disabled={(!input.trim() && !selectedAttachment) || disabled}
            className={`flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
              (!input.trim() && !selectedAttachment) || disabled 
                ? 'bg-transparent text-slate-400' 
                : isAutoSending ? 'bg-primary-500 text-white' : 'bg-white text-black shadow-md active:scale-90'
            }`}
          >
            <i className={`fa-solid ${isAutoSending ? 'fa-paper-plane' : 'fa-arrow-up'} text-xs sm:text-sm`}></i>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatInput;
