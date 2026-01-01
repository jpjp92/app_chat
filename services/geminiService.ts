import { GoogleGenAI, GenerateContentResponse, Part } from "@google/genai";
import { Role, Message, MessageImage, Language } from "../types";

// 재시도를 위한 헬퍼 함수
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const streamChatResponse = async (
  prompt: string, 
  history: Message[], 
  onChunk: (chunk: string) => void,
  language: Language = 'ko',
  attachedImage?: MessageImage,
  webContent?: string,
  contentType: 'text' | 'web' | 'video' = 'text'
) => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("Vercel 설정에서 API_KEY 환경 변수가 등록되지 않았습니다.");
  }

  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount <= maxRetries) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      
      const formattedHistory = history.map(msg => {
        const parts: Part[] = [{ text: msg.content }];
        if (msg.image) {
          parts.push({
            inlineData: {
              data: msg.image.data.split(',')[1],
              mimeType: msg.image.mimeType
            }
          });
        }
        return {
          role: msg.role === Role.USER ? 'user' : 'model',
          parts
        };
      });

      const langNames = {
        ko: 'Korean',
        en: 'English',
        es: 'Spanish',
        fr: 'French'
      };

      let systemInstruction = `You are a helpful AI assistant. You MUST respond in ${langNames[language]}. You can see and analyze images. Use markdown for formatting.`;
      
      if (webContent) {
        if (contentType === 'video') {
          systemInstruction += `\n\n[CONTEXT: YOUTUBE VIDEO TRANSCRIPT]\nThe user provided a YouTube video. Below is the transcript extracted from the video:\n${webContent}\n\nPlease summarize the video's key points, key takeaways, and provide a timeline if possible. Answer any follow-up questions based on this transcript.`;
        } else {
          systemInstruction += `\n\n[CONTEXT: WEB PAGE CONTENT]\nThe user provided a URL. Below is the content of the page:\n${webContent}\n\nPlease summarize it or answer questions based on this information.`;
        }
      }

      const chat = ai.chats.create({
        model: 'gemini-3-flash-preview',
        history: formattedHistory,
        config: {
          systemInstruction: systemInstruction,
        },
      });

      const currentParts: (string | Part)[] = [{ text: prompt }];
      if (attachedImage) {
        currentParts.push({
          inlineData: {
            data: attachedImage.data.split(',')[1],
            mimeType: attachedImage.mimeType
          }
        });
      }

      const result = await chat.sendMessageStream({ message: currentParts });
      
      let fullText = "";
      for await (const chunk of result) {
        const text = (chunk as GenerateContentResponse).text;
        if (text) {
          fullText += text;
          onChunk(text);
        }
      }
      return fullText;

    } catch (error: any) {
      const isRateLimit = error?.message?.includes('429') || error?.status === 429;
      const isOverloaded = error?.message?.includes('503') || error?.status === 503;

      if ((isRateLimit || isOverloaded) && retryCount < maxRetries) {
        retryCount++;
        const waitTime = Math.pow(2, retryCount) * 1000; // 2s, 4s, 8s
        console.warn(`API busy (Attempt ${retryCount}/${maxRetries}). Retrying in ${waitTime}ms...`);
        await sleep(waitTime);
        continue;
      }

      console.error("Gemini API Final Error:", error);
      throw error;
    }
  }
};