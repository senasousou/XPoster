const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const https = require('https');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generates 4 images using DALL-E 3 based on the prompt, enhanced with anime style.
 * @param {string} text - The core prompt from the spreadsheet.
 * @returns {Promise<string[]>} - Array of paths to the downloaded image files.
 */
async function generateAnimeImage(text) {
  const enhancedPrompt = `${text}, high quality anime style, detailed illustration, vibrant colors, clean lines`;
  const imagePaths = [];
  
  console.log(`Generating 4 images for prompt: "${enhancedPrompt}"...`);
  
  for (let i = 0; i < 4; i++) {
    console.log(`Generating image ${i + 1} of 4...`);
    try {
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: enhancedPrompt,
        n: 1, // DALL-E 3 only supports n=1 per request
        size: "1024x1024",
      });

      const imageUrl = response.data[0].url;
      const imagePath = path.join(process.cwd(), `temp_image_${i}.png`);
      
      await new Promise((resolve, reject) => {
        const file = fs.createWriteStream(imagePath);
        https.get(imageUrl, (res) => {
          res.pipe(file);
          file.on('finish', () => {
            file.close();
            console.log(`Image ${i + 1} saved to ${imagePath}`);
            imagePaths.push(imagePath);
            resolve();
          });
        }).on('error', (err) => {
          fs.unlink(imagePath, () => {});
          reject(err);
        });
      });
    } catch (error) {
      console.error(`Failed to generate image ${i + 1}:`, error);
      // Continue trying to generate the rest even if one fails
    }
  }

  return imagePaths;
}

module.exports = { generateAnimeImage };
