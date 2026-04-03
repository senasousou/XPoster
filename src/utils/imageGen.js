const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const https = require('https');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generates an image using DALL-E 3 based on the prompt, enhanced with anime style.
 * @param {string} text - The core prompt from the spreadsheet.
 * @returns {Promise<string>} - Path to the downloaded image file.
 */
async function generateAnimeImage(text) {
  const enhancedPrompt = `${text}, high quality anime style, detailed illustration, vibrant colors, clean lines`;
  
  console.log(`Generating image for prompt: "${enhancedPrompt}"...`);
  
  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt: enhancedPrompt,
    n: 1,
    size: "1024x1024",
  });

  const imageUrl = response.data[0].url;
  const imagePath = path.join(process.cwd(), 'temp_image.png');
  
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(imagePath);
    https.get(imageUrl, (res) => {
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Image saved to ${imagePath}`);
        resolve(imagePath);
      });
    }).on('error', (err) => {
      fs.unlink(imagePath, () => {});
      reject(err);
    });
  });
}

module.exports = { generateAnimeImage };
