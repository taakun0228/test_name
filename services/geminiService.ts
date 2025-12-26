
import { GoogleGenAI } from "@google/genai";
import { Post } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export const getBoardSummary = async (posts: Post[]): Promise<string> => {
  if (posts.length === 0) return "まだ投稿がありません。";

  try {
    const postTexts = posts.slice(0, 10).map(p => `${p.nickname}: ${p.content}`).join("\n---\n");
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `以下の掲示板の最新投稿を簡潔に（2-3文で）要約してください。：\n\n${postTexts}`,
      config: {
        systemInstruction: "あなたは掲示板の管理人です。ユーザーに役立つ、優しく簡潔な要約を提供してください。",
      }
    });
    return response.text || "要約を生成できませんでした。";
  } catch (error) {
    console.error("Gemini summary error:", error);
    return "AIによる要約は現在利用できません。";
  }
};

export const checkContentSafety = async (content: string): Promise<{ safe: boolean; reason?: string }> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `以下の投稿内容が公序良俗に反するか、または非常に攻撃的かどうかを判断し、JSONで返してください。
      フォーマット: {"safe": boolean, "reason": "理由（不適切な場合のみ）"}
      
      内容: ${content}`,
      config: {
        responseMimeType: "application/json"
      }
    });
    
    return JSON.parse(response.text || '{"safe": true}');
  } catch (error) {
    console.error("Gemini safety check error:", error);
    return { safe: true }; // 失敗した場合は寛容に
  }
};
