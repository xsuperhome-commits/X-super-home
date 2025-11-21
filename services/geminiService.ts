import { GoogleGenAI } from "@google/genai";
import { Order, Transaction } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeBusinessData = async (
  orders: Order[],
  transactions: Transaction[],
  context: 'FINANCE' | 'OPERATIONS'
): Promise<string> => {
  if (!process.env.API_KEY) {
    return "API Key 未配置。请检查环境变量。";
  }

  try {
    const modelId = "gemini-2.5-flash";
    let prompt = "";

    if (context === 'FINANCE') {
      const txData = JSON.stringify(transactions.slice(-20)); // Limit to last 20 for token efficiency
      prompt = `
        作为一位资深的工厂财务顾问，请分析以下财务交易数据（JSON格式）。
        请提供一份简明的财务健康报告，包括：
        1. 收入与支出的主要趋势。
        2. 潜在的成本控制建议。
        3. 现金流状况的简要评估。
        
        数据: ${txData}
        
        请用中文回答，格式使用Markdown，重点突出。不要罗列数据，而是提供洞察。
      `;
    } else {
      const orderData = JSON.stringify(orders.slice(-20));
      prompt = `
        作为一位工厂生产运营经理，请分析以下订单数据（JSON格式）。
        请提供一份生产运营简报，包括：
        1. 当前订单状态分布及其潜在瓶颈（例如积压的待处理订单）。
        2. 主要客户分析。
        3. 针对交货日期的紧迫性提醒。

        数据: ${orderData}

        请用中文回答，格式使用Markdown，重点突出。
      `;
    }

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
    });

    return response.text || "无法生成分析结果。";

  } catch (error) {
    console.error("Gemini API Error:", error);
    return "AI 分析服务暂时不可用，请稍后再试。";
  }
};