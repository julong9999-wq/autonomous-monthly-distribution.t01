import { GoogleGenAI } from "@google/genai";
import { PortfolioItem, ETFData } from "../types";

const getAI = () => {
  // 這裡的 process.env.API_KEY 會在 build time 被 Vite 替換成字串
  if (!process.env.API_KEY) return null;
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const MODEL_FLASH = "gemini-3-flash-preview";

// Now accepts etfList explicitly
export const generateSmartPlan = async (amount: number, promptText: string, etfList: ETFData[]): Promise<string> => {
  const ai = getAI();
  if (!ai) return "⚠️ [系統提示] AI 功能尚未啟用。\n\n請在 Vercel 後台 > Settings > Environment Variables 新增 `API_KEY` 變數。";

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
  } catch (error) {
    console.error(error);
    return "AI 服務暫時無法使用，請檢查 API Key 是否正確或額度是否足夠。";
  }
};

export const generateDiagnosis = async (portfolio: PortfolioItem[]): Promise<string> => {
  const ai = getAI();
  if (!ai) return "⚠️ [系統提示] 需要 API Key 才能進行深度診斷。\n\n請至 Vercel 設定環境變數。";

  try {
    const summary = portfolio.map(p => `${p.code} ${p.name}`).join(", ");
    const prompt = `分析此台灣 ETF 組合: [${summary}]。請提供診斷表格：檢查項目、現狀分析、優化建議。`;
    const response = await ai.models.generateContent({
      model: MODEL_FLASH,
      contents: prompt,
    });
    return response.text || "無法產生診斷。";
  } catch (error) {
    console.error(error);
    return "AI 診斷服務暫時無法使用。";
  }
};