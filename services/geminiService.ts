
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Role, Message } from "../types";

export const streamChatResponse = async (
  prompt: string, 
  history: Message[], 
  onChunk: (chunk: string) => void
) => {
  // Use the pre-configured environment variable API_KEY
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("Vercel 설정에서 API_KEY 환경 변수가 등록되지 않았습니다.");
  }

  try {
    // Correct initialization using named parameters
    const ai = new GoogleGenAI({ apiKey });
    
    // Format history as an array of Content objects
    const formattedHistory = history.map(msg => ({
      role: msg.role === Role.USER ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // Start a chat session. Note that 'history' is a top-level parameter of ChatSessionParameters.
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      history: formattedHistory,
      config: {
        systemInstruction: 'You are a helpful, intelligent, and creative AI assistant named Gemini Messenger. You provide clear, concise, and accurate information. When writing code, use markdown blocks.',
      },
    });

    // Send message using the recommended message parameter
    const result = await chat.sendMessageStream({ message: prompt });
    
    let fullText = "";
    for await (const chunk of result) {
      // Access the .text property directly (not a method call)
      const text = (chunk as GenerateContentResponse).text;
      if (text) {
        fullText += text;
        onChunk(text);
      }
    }
    return fullText;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error?.message?.includes("Requested entity was not found")) {
      throw new Error("API Key가 유효하지 않거나 모델을 찾을 수 없습니다.");
    }
    throw error;
  }
};
