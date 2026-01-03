
import { GoogleGenAI, GenerateContentResponse, Part, Modality, Type, FunctionDeclaration } from "@google/genai";
import { Role, Message, MessageAttachment, Language } from "../types";

let currentAudioSource: AudioBufferSourceNode | null = null;
let sharedAudioContext: AudioContext | null = null;

const WEATHER_API_KEY = "61f901ce78722064c74994088027e75b";

/**
 * 선택된 언어에 맞는 로캘 문자열을 반환합니다.
 */
function getLocale(lang: Language): string {
  const map: Record<Language, string> = { ko: 'ko-KR', en: 'en-US', es: 'es-ES', fr: 'fr-FR' };
  return map[lang] || 'ko-KR';
}

/**
 * 실시간 한국 표준시(KST) 정보를 선택된 언어 형식으로 가져옵니다.
 */
function fetchCurrentTime(lang: Language) {
  const now = new Date();
  const locale = getLocale(lang);
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: lang === 'en' // 영어일 때는 12시간제 선호
  };
  const kstTime = new Intl.DateTimeFormat(locale, options).format(now);
  return {
    kst_display: kstTime,
    iso_string: now.toISOString(),
    timezone: 'KST (Asia/Seoul)',
    requested_language: lang
  };
}

/**
 * 특정 지역의 현재 날씨 정보를 가져옵니다.
 * @param location 도시명
 * @param lang 결과 언어 (ko, en, es, fr)
 */
async function fetchCurrentWeather(location: string, lang: Language) {
  // OpenWeatherMap의 언어 코드는 'kr'이 아닌 'kr' 또는 'en' 등을 사용함
  const apiLang = lang === 'ko' ? 'kr' : lang; 
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${WEATHER_API_KEY}&units=metric&lang=${apiLang}`
    );
    if (!response.ok) throw new Error("Weather data not found");
    const data = await response.json();
    return {
      location: data.name,
      temperature: data.main.temp,
      description: data.weather[0].description,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      condition: data.weather[0].main,
      unit: "Celsius"
    };
  } catch (error) {
    return { error: "Failed to fetch weather data." };
  }
}

// Gemini에게 제공할 도구(Function) 정의들
const weatherFunctionDeclaration: FunctionDeclaration = {
  name: 'getCurrentWeather',
  parameters: {
    type: Type.OBJECT,
    description: '특정 지역의 현재 날씨 정보를 가져옵니다.',
    properties: {
      location: {
        type: Type.STRING,
        description: '날씨를 조회할 도시 이름 (예: Seoul, Tokyo, London, New York)',
      },
    },
    required: ['location'],
  },
};

const timeFunctionDeclaration: FunctionDeclaration = {
  name: 'getCurrentTime',
  parameters: {
    type: Type.OBJECT,
    description: '현재 한국 표준시(KST) 날짜와 시간 정보를 가져옵니다.',
    properties: {},
  },
};

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
  
  const contents: any[] = history
    .filter(msg => msg.content && msg.content.trim() !== "" && msg.role !== Role.SYSTEM)
    .slice(-10)
    .map(msg => ({
      role: msg.role === Role.USER ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

  const langNames = { ko: 'Korean', en: 'English', es: 'Spanish', fr: 'French' };
  let systemInstruction = `You are a professional AI assistant. Respond in ${langNames[language]}. 
  Use Markdown for beautiful formatting.
  
  [TOOLS GUIDELINE]
  - Use 'getCurrentWeather' for weather queries.
  - Use 'getCurrentTime' for date/time queries.
  - Report time in KST (Korea Standard Time) using a format appropriate for ${langNames[language]}.`;
  
  if (webContent) {
    systemInstruction += `\n\n[CONTENT TO ANALYZE]\n${webContent}`;
  }

  let userParts: Part[] = [{ text: prompt }];
  if (attachment && attachment.data && attachment.data.trim() !== "") {
    const base64Data = attachment.data.includes(',') 
      ? attachment.data.split(',')[1] 
      : attachment.data;
    if (base64Data) {
      userParts.push({ inlineData: { data: base64Data, mimeType: attachment.mimeType } });
    }
  }

  contents.push({ role: 'user', parts: userParts });

  const modelConfig = { 
    systemInstruction,
    tools: [{ functionDeclarations: [weatherFunctionDeclaration, timeFunctionDeclaration] }]
  };

  try {
    const result = await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents,
      config: modelConfig,
    });
    
    let modelParts: Part[] = [];

    for await (const chunk of result) {
      if (chunk.candidates?.[0]?.content?.parts) {
        modelParts.push(...chunk.candidates[0].content.parts);
      }

      const calls = chunk.functionCalls;
      if (calls && calls.length > 0) {
        const functionResponseParts: Part[] = [];
        for (const call of calls) {
          if (call.name === 'getCurrentWeather') {
            const location = call.args.location as string;
            onChunk(language === 'ko' ? `🔍 ${location}의 날씨 정보를 확인 중입니다...` : `🔍 Checking weather for ${location}...`);
            const weatherData = await fetchCurrentWeather(location, language);
            functionResponseParts.push({
              functionResponse: { name: call.name, response: { result: weatherData } },
            });
          } else if (call.name === 'getCurrentTime') {
            onChunk(language === 'ko' ? `🕒 현재 시간을 확인 중입니다...` : `🕒 Checking current time...`);
            const timeData = fetchCurrentTime(language);
            functionResponseParts.push({
              functionResponse: { name: call.name, response: { result: timeData } },
            });
          }
        }
        
        if (functionResponseParts.length > 0) {
          onChunk("\n\n"); 
          contents.push({ role: 'model', parts: modelParts });
          contents.push({ role: 'user', parts: functionResponseParts });

          const followUp = await ai.models.generateContentStream({
            model: 'gemini-3-flash-preview',
            contents,
            config: modelConfig,
          });
          
          for await (const finalChunk of followUp) {
            if (finalChunk.text) onChunk(finalChunk.text);
          }
        }
        return; 
      }

      if (chunk.text) {
        onChunk(chunk.text);
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
