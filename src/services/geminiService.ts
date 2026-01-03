
import { GoogleGenAI } from "@google/genai";

export async function generateSlogan(keyword: string): Promise<string> {
  // Always use process.env.API_KEY directly as per SDK requirements
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `학원 강사 랜딩페이지를 위한 임팩트 있는 슬로건을 하나 만들어줘. 키워드: "${keyword}". 짧고 강렬한 문구 1개만 출력해줘.`,
    });
    // response.text is a property, not a method
    return response.text || "미래를 바꾸는 최고의 강의";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "성공을 향한 가장 확실한 선택";
  }
}
