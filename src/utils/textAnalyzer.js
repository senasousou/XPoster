const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

/**
 * Analyzes the overview text and formats it for 4 specific slides.
 * @param {string} itemName - The item name
 * @param {string} location - The location
 * @param {string} overview - The main overview text to summarize.
 * @returns {Promise<{slide2: string, slide3: string[], slide4: string[]}>}
 */
async function analyzeTextForSlides(itemName, location, overview) {
  const prompt = `
以下のプロジェクト情報を分析し、画像スライド（文字テロップ）用にテキストを抽出・分割してください。
元の情報は「内容の要約」のテキストです。

【入力データ】
項目名: ${itemName}
場所: ${location}
内容の要約: ${overview}

【出力要件】
これを以下のJSON構造で出力してください。必ずJSONのみを出力します。
{
  "slide2": "時代や場所の情報（例：〇〇での出来事など。短くまとめる）",
  "slide3": ["出来事1", "出来事2"], // 時系列の前半の出来事を箇条書きで2〜3個
  "slide4": ["出来事3", "出来事4"]  // 時系列の前半の出来事を箇条書きで2〜3個（3枚目の続き）
}
箇条書き（配列内）の一つ一つの文は、画像に入れやすいように20〜40文字程度の簡潔な長さにしてください。
`;

  try {
    console.log("Sending request to Gemini...");
    const result = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        temperature: 0.7
      }
    });

    // Detailed debug logging
    console.log("Gemini Result Object Keys:", Object.keys(result));
    
    // In @google/genai, the text might be at result.text or needs deeper access
    let text = "";
    if (result.text) {
      text = result.text;
    } else if (result.candidates && result.candidates[0].content.parts[0].text) {
      text = result.candidates[0].content.parts[0].text;
    } else {
      console.log("Full result for inspection:", JSON.stringify(result, null, 2));
      throw new Error("Could not find text in Gemini response");
    }

    console.log("Raw AI Response Text:", text);
    const parsed = JSON.parse(text);
    return parsed;
  } catch (error) {
    console.error("Text Analysis Error (Gemini):", error);
    
    // Fallback if AI fails:
    return {
      slide2: location || itemName,
      slide3: ["時系列の出来事を抽出中..."],
      slide4: ["(詳細データをご確認ください)"]
    };
  }
}

module.exports = { analyzeTextForSlides };
