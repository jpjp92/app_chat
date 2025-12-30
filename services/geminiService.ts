
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Role, Message } from "../types";

/**
 * Gemini 모델과 스트리밍 대화를 수행합니다.
 * @param prompt 사용자의 입력 메시지
 * @param history 이전 대화 내역
 * @param onChunk 텍스트 조각(chunk)이 도착할 때마다 실행될 콜백
 */
export const streamChatResponse = async (
  prompt: string, 
  history: Message[], 
  onChunk: (chunk: string) => void
) => {
  try {
    // 가이드라인에 따라 API 호출 직전에 인스턴스를 생성하여 최신 환경 변수를 반영합니다.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // SDK 형식에 맞게 대화 내역 변환
    const formattedHistory = history.map(msg => ({
      role: msg.role === Role.USER ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // 채팅 세션 생성 (gemini-3-flash-preview 모델 사용)
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: 'You are a helpful, intelligent, and creative AI assistant named Gemini Messenger. You provide clear, concise, and accurate information. When writing code, use markdown blocks.',
        history: formattedHistory,
      },
    });

    // 메시지 전송 및 스트리밍 응답 수신
    const result = await chat.sendMessageStream({ message: prompt });
    
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
    
    // API 키 설정 오류 또는 모델 접근 불가 시 에러 핸들링
    if (error?.message?.includes("Requested entity was not found")) {
      throw new Error("API Key가 유효하지 않거나 모델을 찾을 수 없습니다. Vercel 환경 변수 설정을 확인해주세요.");
    }
    throw error;
  }
};
