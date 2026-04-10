const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');
const path = require('path');

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

/**
 * Generates 4 images using Imagen 3 based on the prompt, enhanced with anime style.
 * @param {string} text - The core prompt from the spreadsheet.
 * @returns {Promise<string[]>} - Array of paths to the downloaded image files.
 */
async function generateAnimeImage(text) {
  const enhancedPrompt = `${text}, high quality anime style, detailed illustration, vibrant colors, clean lines`;
  const imagePaths = [];
  
  console.log(`Generating 4 images via Imagen 3 for prompt: "${enhancedPrompt}"...`);
  
  try {
    const response = await ai.models.generateImages({
      model: "imagen-3.0-generate-001",
      prompt: enhancedPrompt,
      config: {
        numberOfImages: 4,
        outputMimeType: "image/png",
        aspectRatio: "1:1"
      }
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      for (let i = 0; i < response.generatedImages.length; i++) {
        const base64Data = response.generatedImages[i].image.imageBytes;
        const imagePath = path.join(process.cwd(), `temp_image_${i}.png`);
        
        fs.writeFileSync(imagePath, base64Data, 'base64');
        console.log(`Image ${i + 1} saved to ${imagePath}`);
        imagePaths.push(imagePath);
      }
    }
  } catch (error) {
    console.error(`Failed to generate images via Imagen:`, error);
  }

  return imagePaths;
}

module.exports = { generateAnimeImage };
