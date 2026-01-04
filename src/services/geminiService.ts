import { GoogleGenAI } from "@google/genai";

// 환경 변수 또는 직접 입력 (환경 변수 권장)
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyBplv-HrQskzYPVityQXHnH3nBIver-naw";
const genAI = new GoogleGenAI({ apiKey: API_KEY });

// 슬로건 생성 함수 (관리자 페이지에서 사용)
export async function generateSlogan(keywords: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `Create a short, powerful English slogan (maximum 8 words) for an educational academy. Keywords: ${keywords}. Make it inspiring and memorable. Return only the slogan, no quotes or explanation.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim().replace(/['"]/g, ''); // 따옴표 제거
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Excellence in Every Step"; // 실패시 기본값
  }
}

// 텍스트 생성 함수
export async function generateText(prompt: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("텍스트 생성에 실패했습니다.");
  }
}

// 영어 문장 교정 함수
export async function correctEnglish(text: string): Promise<string> {
  const prompt = `Please correct the following English text and explain any mistakes:

"${text}"

Provide:
1. Corrected version
2. Brief explanation of errors`;

  return await generateText(prompt);
}

// 영어 번역 함수
export async function translateToEnglish(koreanText: string): Promise<string> {
  const prompt = `Translate the following Korean text to natural English:

"${koreanText}"`;

  return await generateText(prompt);
}

// 영어 학습 도움 함수
export async function explainGrammar(sentence: string): Promise<string> {
  const prompt = `Explain the grammar and structure of this English sentence in Korean:

"${sentence}"

Please provide:
1. Grammar breakdown
2. Key vocabulary
3. Usage tips`;

  return await generateText(prompt);
}
