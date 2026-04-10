const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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
  "slide4": ["出来事3", "出来事4"]  // 時系列の後半の出来事を箇条書きで2〜3個
}
箇条書き（配列内）の一つ一つの文は、画像に入れやすいように20〜40文字程度の簡潔な長さにしてください。
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const parsed = JSON.parse(response.choices[0].message.content);
    return parsed;
  } catch (error) {
    console.error("Text Analysis Error:", error);
    // Fallback if AI fails:
    return {
      slide2: itemEra,
      slide3: ["(テキスト抽出に失敗しました)"],
      slide4: ["(テキスト抽出に失敗しました)"]
    };
  }
}

module.exports = { analyzeTextForSlides };
