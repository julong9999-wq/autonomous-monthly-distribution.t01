import { GoogleGenAI } from "@google/genai";
import { PortfolioItem, ETFData } from "../types";

export const USER_KEY_STORAGE = "USER_GEMINI_KEY";

const getAI = () => {
  // 1. 優先讀取使用者儲存在 LocalStorage 的 Key
  const userKey = localStorage.getItem(USER_KEY_STORAGE);
  if (userKey) {
    return new GoogleGenAI({ apiKey: userKey });
  }

  // 2. 如果沒有使用者 Key，才嘗試使用系統預設 (可選，若您想完全禁用預設 Key，請移除此行)
  if (process.env.API_KEY) {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  return null;
};

const MODEL_FLASH = "gemini-3-flash-preview";

// Now accepts etfList explicitly
export const generateSmartPlan = async (amount: number, promptText: string, etfList: ETFData[]): Promise<string> => {
  const ai = getAI();
  if (!ai) return "⚠️ **未設定 API Key**\n\n為了使用 AI 功能，請點擊畫面右上角的「鑰匙圖示 🔑」，輸入您自己的 Google Gemini API Key。\n\n(這是不需付費的，您可以免費申請)";

  try {
    // Only filter ETFs that have valid price data to avoid recommending empty shells
    const validETFs = etfList.filter(etf => etf.priceRecent > 0);
    
    const availableETFs = validETFs.map(etf => 
      `- ${etf.code} ${etf.name} (Type: ${etf.category}, Yield: ${etf.yield}%)`
    ).join('\n');

    const prompt = `你是一位台灣 ETF 投資專家。用戶預算 ${amount} 萬。需求: "${promptText}"。
    請嚴格從以下標的中選擇 (僅包含目前有報價的標的):
    ${availableETFs}
    請輸出一個 Markdown 表格，包含：標的、配置、金額、投資理由。`;

    const response = await ai.models.generateContent({
      model: MODEL_FLASH,
      contents: prompt,
    });
    return response.text || "無法產生建議。";
  } catch (error: any) {
    console.error(error);
    if (error.message?.includes('API_KEY_INVALID') || error.status === 400) {
        return "⚠️ **API Key 無效**\n\n您輸入的 Key 似乎有誤，請點擊右上角鑰匙圖示重新設定。";
    }
    return "AI 服務暫時無法使用，請檢查您的網路連線。";
  }
};

export const generateDiagnosis = async (portfolio: PortfolioItem[]): Promise<string> => {
  const ai = getAI();
  if (!ai) return "⚠️ **未設定 API Key**\n\n為了進行深度診斷，請點擊畫面右上角的「鑰匙圖示 🔑」設定您的 API Key。";

  try {
    const summary = portfolio.map(p => `${p.code} ${p.name}`).join(", ");
    const prompt = `分析此台灣 ETF 組合: [${summary}]。請提供診斷表格：檢查項目、現狀分析、優化建議。`;
    const response = await ai.models.generateContent({
      model: MODEL_FLASH,
      contents: prompt,
    });
    return response.text || "無法產生診斷。";
  } catch (error: any) {
    console.error(error);
    if (error.message?.includes('API_KEY_INVALID') || error.status === 400) {
        return "⚠️ **API Key 無效**\n\n您輸入的 Key 似乎有誤，請檢查設定。";
    }
    return "AI 診斷服務暫時無法使用。";
  }
};