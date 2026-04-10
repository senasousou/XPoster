const { createCanvas, loadImage, registerFont } = require('canvas');
const fs = require('fs');
const path = require('path');

// Register the Noto Serif (Mincho) Bold font
const fontPath = path.join(process.cwd(), 'assets', 'fonts', 'NotoSerifJP-Bold.otf');
if (fs.existsSync(fontPath)) {
  registerFont(fontPath, { family: 'Noto Serif JP', weight: 'bold' });
} else {
  console.warn(`Font not found at ${fontPath}. Falling back to default sans-serif.`);
}

/**
 * Draws a black semi-transparent box.
 */
function drawZabuton(ctx, x, y, width, height) {
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'; // 60% opacity black
  ctx.fillRect(x, y, width, height);
  ctx.restore();
}

/**
 * Normalizes text to handle some canvas wrapping or drawing, simple generic filler text drawer.
 */
function drawText(ctx, text, x, y, options = {}) {
  ctx.save();
  ctx.font = options.font || 'bold 36px "Noto Serif JP", serif';
  ctx.fillStyle = 'white';
  
  if (options.shadow) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
  }

  ctx.fillText(text, x, y);
  ctx.restore();
}

/**
 * Overlays text and bullet points onto the 4 generated images in-place.
 * @param {string[]} imagePaths - Array of 4 image file paths.
 * @param {string} id - The spreadsheet ID.
 * @param {string} itemName - The item era or name.
 * @param {Object} slideData - Parsed data from textAnalyzer.
 */
async function overlayText(imagePaths, id, itemName, slideData) {
  if (!imagePaths || imagePaths.length < 4) return;

  const headerText = `${id} ${itemName}`;

  for (let i = 0; i < imagePaths.length; i++) {
    const imgPath = imagePaths[i];
    const image = await loadImage(imgPath);
    
    // Canvas dimensions based on DALL-E 3 default (1024x1024)
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');

    // Draw base image
    ctx.drawImage(image, 0, 0, image.width, image.height);

    // 1. All images get the top-left header
    ctx.font = 'bold 28px "Noto Serif JP", serif'; // Measure length
    const headerWidth = ctx.measureText(headerText).width;
    drawZabuton(ctx, 20, 20, headerWidth + 40, 50); // Background box
    drawText(ctx, headerText, 40, 55, { shadow: false, font: 'bold 28px "Noto Serif JP", serif' });

    // 2. Add slide-specific text at the bottom
    // Box dimensions
    const bottomBoxY = 750;
    const bottomBoxHeight = 220;
    
    if (i === 1) {
      // 2枚目: 時代と場所
      drawZabuton(ctx, 0, bottomBoxY, image.width, bottomBoxHeight);
      drawText(ctx, slideData.slide2 || "", 50, bottomBoxY + 110, { font: 'bold 48px "Noto Serif JP", serif', shadow: true });
    } else if (i === 2 || i === 3) {
      // 3枚目・4枚目: 出来事箇条書き
      const bullets = i === 2 ? slideData.slide3 : slideData.slide4;
      if (bullets && bullets.length > 0) {
        drawZabuton(ctx, 0, bottomBoxY, image.width, bottomBoxHeight);
        
        // Draw bullets
        let currentY = bottomBoxY + 60;
        for (const bullet of bullets) {
          drawText(ctx, `・ ${bullet}`, 50, currentY, { font: 'bold 36px "Noto Serif JP", serif', shadow: true });
          currentY += 60; // Spacing between bullets
        }
      }
    }

    // Save back to file
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(imgPath, buffer);
    console.log(`Synthesized text onto image ${i + 1}`);
  }
}

module.exports = { overlayText };
