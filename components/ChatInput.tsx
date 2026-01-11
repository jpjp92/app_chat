
import React, { useState, useRef, useEffect } from 'react';
import { MessageAttachment, Language } from '../types';

interface ChatInputProps {
  onSend: (message: string, attachment?: MessageAttachment) => void;
  disabled?: boolean;
  language?: Language;
}

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB 제한

const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled, language = 'ko' }) => {
  const [input, setInput] = useState('');
  const [selectedAttachment, setSelectedAttachment] = useState<MessageAttachment | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSTTSupported, setIsSTTSupported] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef('');

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto'; 
      const newHeight = Math.min(textarea.scrollHeight, 200);
      const minHeight = window.innerWidth < 640 ? 36 : 48;
      textarea.style.height = `${Math.max(newHeight, minHeight)}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [input]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSTTSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true; 
      recognition.interimResults = true; 
      const langMap: Record<Language, string> = { ko: 'ko-KR', en: 'en-US', es: 'es-ES', fr: 'fr-FR' };
      recognition.lang = langMap[language] || 'ko-KR';
      
      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let currentFinalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) currentFinalTranscript += transcript;
          else interimTranscript += transcript;
        }
        if (currentFinalTranscript) finalTranscriptRef.current += currentFinalTranscript;
        setInput(finalTranscriptRef.current + interimTranscript);
      };
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, [language]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) recognitionRef.current.stop();
    else {
      finalTranscriptRef.current = input; 
      recognitionRef.current.start();
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((input.trim() || selectedAttachment) && !disabled) {
      if (isListening) recognitionRef.current.stop();
      onSend(input, selectedAttachment || undefined);
      setInput('');
      setSelectedAttachment(null);
      finalTranscriptRef.current = '';
      if (textareaRef.current) textareaRef.current.style.height = window.innerWidth < 640 ? '36px' : '48px';
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
      // 4MB 초과 체크
      if (file.size > MAX_FILE_SIZE) {
        const currentSize = (file.size / (1024 * 1024)).toFixed(2);
        alert(language === 'ko' 
          ? `파일 크기가 너무 큽니다. 최대 4MB까지만 업로드 가능합니다.\n(현재 파일: ${currentSize}MB)` 
          : `File is too large. Max 4MB allowed.\n(Current: ${currentSize}MB)`);
        e.target.value = ''; // 선택 초기화
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
      e.target.value = '';
    }
  };

  const renderPreview = () => {
    if (!selectedAttachment) return null;

    const isPDF = selectedAttachment.mimeType === 'application/pdf';
    
    return (
      <div className="absolute bottom-full left-4 sm:left-6 mb-3 animate-in slide-in-from-bottom-2 duration-300">
        <div className="relative group">
          <div className="overflow-hidden rounded-2xl border-2 border-white dark:border-[#2f2f2f] shadow-2xl bg-white dark:bg-[#1e1e1f]">
            {isPDF ? (
              <div className="h-16 w-32 sm:h-20 sm:w-40 flex flex-col items-center justify-center p-2 gap-1 bg-red-50 dark:bg-red-500/5">
                <i className="fa-solid fa-file-pdf text-red-500 text-xl sm:text-2xl"></i>
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate w-full text-center px-1">
                  {selectedAttachment.fileName || 'document.pdf'}
                </span>
              </div>
            ) : (
              <img src={selectedAttachment.data} alt="Upload" className="h-16 w-16 sm:h-20 sm:w-20 object-cover" />
            )}
          </div>
          <button 
            type="button"
            onClick={() => setSelectedAttachment(null)} 
            className="absolute -top-2.5 -right-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 w-6 h-6 rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all z-10"
          >
            <i className="fa-solid fa-xmark text-[10px]"></i>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-6 relative">
      {renderPreview()}
      
      <form 
        onSubmit={handleSubmit} 
        className="relative flex items-end bg-[#f0f4f9] dark:bg-[#1e1e1f] p-0.5 sm:p-1.5 rounded-[20px] sm:rounded-[32px] transition-all focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:bg-white dark:focus-within:bg-[#1e1e1f] border border-transparent dark:border-white/5 shadow-sm"
      >
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,application/pdf" className="hidden" />
        
        <button 
          type="button" 
          onClick={() => fileInputRef.current?.click()} 
          className="flex-shrink-0 w-8 h-8 sm:w-11 sm:h-11 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-white/5 rounded-full transition-colors"
          title="이미지 또는 PDF 첨부 (최대 4MB)"
        >
          <i className="fa-solid fa-paperclip text-sm sm:text-lg"></i>
        </button>

        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything"
          rows={1}
          disabled={disabled}
          className="flex-1 bg-transparent px-2 sm:px-3 py-1.5 sm:py-2.5 outline-none resize-none text-slate-800 dark:text-[#e3e3e3] placeholder-slate-500 dark:placeholder-slate-400 min-h-[36px] sm:min-h-[48px] max-h-[140px] sm:max-h-[180px] leading-relaxed block overflow-y-auto text-[14px] sm:text-[16px] font-medium"
        />

        <div className="flex items-center space-x-0.5 sm:space-x-1 pr-1 self-center">
          {isSTTSupported && (
            <button
              type="button"
              onClick={toggleListening}
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all ${
                isListening 
                  ? 'bg-red-500 text-white shadow-lg animate-pulse' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-white/5'
              }`}
              title="음성 인식"
            >
              <i className={`fa-solid ${isListening ? 'fa-microphone' : 'fa-microphone-lines'} text-xs sm:text-base`}></i>
            </button>
          )}

          <button
            type="submit"
            disabled={(!input.trim() && !selectedAttachment) || disabled}
            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all ${
              (!input.trim() && !selectedAttachment) || disabled 
                ? 'text-slate-300 dark:text-slate-700' 
                : 'text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-500/10'
            }`}
          >
            <i className="fa-solid fa-arrow-up text-sm sm:text-lg"></i>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatInput;
