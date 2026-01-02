
import { GoogleGenAI, GenerateContentResponse, Part, Modality } from "@google/genai";
import { Role, Message, MessageAttachment, Language } from "../types";

let currentAudioSource: AudioBufferSourceNode | null = null;
let sharedAudioContext: AudioContext | null = null;

function decodeBase64(base64: string): Uint8Array {
  try {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (e) {
    return new Uint8Array(0);
  }
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer, data.byteOffset, Math.floor(data.byteLength / 2));
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const streamChatResponse = async (
  prompt: string, 
  history: Message[], 
  onChunk: (chunk: string) => void,
  language: Language = 'ko',
  attachment?: MessageAttachment,
  webContent?: string,
  contentType: 'text' | 'web' | 'video' = 'text'
) => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY is missing");

  const ai = new GoogleGenAI({ apiKey });
  
  const formattedHistory = history
    .filter(msg => msg.content && msg.content.trim() !== "" && msg.role !== Role.SYSTEM)
    .slice(-10) // 최근 10개 메시지만 히스토리로 유지 (성능/토큰 절약)
    .map(msg => ({
      role: msg.role === Role.USER ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

  const langNames = { ko: 'Korean', en: 'English', es: 'Spanish', fr: 'French' };
  let systemInstruction = `You are a professional AI assistant. Respond in ${langNames[language]}. Use Markdown.`;
  
  if (webContent) {
    systemInstruction += `\n\n[CONTENT TO ANALYZE]\n${webContent}`;
  }

  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    history: formattedHistory,
    config: { systemInstruction },
  });

  let messagePayload: any = prompt;
  if (attachment && attachment.data) {
    const base64Data = attachment.data.includes(',') 
      ? attachment.data.split(',')[1] 
      : attachment.data;

    messagePayload = [
      { text: prompt },
      { inlineData: { data: base64Data, mimeType: attachment.mimeType } }
    ];
  }

  try {
    const result = await chat.sendMessageStream({ message: messagePayload });
    for await (const chunk of result) {
      try {
        const text = chunk.text;
        if (text) onChunk(text);
      } catch (e) {
        console.warn("Chunk processing skipped due to safety or empty text.");
      }
    }
  } catch (e: any) {
    throw e;
  }
};

export const generateSpeech = async (text: string): Promise<Uint8Array> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key is missing");

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: text.slice(0, 500) }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("No audio data");
  return decodeBase64(base64Audio);
};

export const stopAudio = () => {
  if (currentAudioSource) {
    try { currentAudioSource.stop(); } catch (e) {}
    currentAudioSource = null;
  }
};

export const playRawAudio = async (data: Uint8Array) => {
  if (data.length === 0) return;
  stopAudio();
  if (!sharedAudioContext) {
    sharedAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  }
  if (sharedAudioContext.state === 'suspended') await sharedAudioContext.resume();
  const audioBuffer = await decodeAudioData(data, sharedAudioContext, 24000, 1);
  const source = sharedAudioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(sharedAudioContext.destination);
  currentAudioSource = source;
  source.start();
  return new Promise<void>((resolve) => {
    source.onended = () => {
      if (currentAudioSource === source) currentAudioSource = null;
      resolve();
    };
  });
};
