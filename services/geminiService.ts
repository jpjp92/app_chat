import { GoogleGenAI, GenerateContentResponse, Part } from "@google/genai";
import { Role, Message, MessageImage, Language } from "../types";

export const streamChatResponse = async (
  prompt: string, 
  history: Message[], 
  onChunk: (chunk: string) => void,
  language: Language = 'ko',
  attachedImage?: MessageImage
) => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("Vercel 설정에서 API_KEY 환경 변수가 등록되지 않았습니다.");
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // Format history
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

    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      history: formattedHistory,
      config: {
        systemInstruction: `You are a helpful AI assistant. You MUST respond in ${langNames[language]}. You can see and analyze images. Use markdown for formatting.`,
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
    console.error("Gemini API Error:", error);
    throw error;
  }
};