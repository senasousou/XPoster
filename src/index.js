require('dotenv').config();
const { setupSheet, getNextPost, markAsPosted } = require('./utils/sheets');
const { generateAnimeImage } = require('./utils/imageGen');
const { analyzeTextForSlides } = require('./utils/textAnalyzer');
const xApi = require('./utils/xApi');
const { overlayText } = require('./utils/imageOverlay');
const fs = require('fs');

async function run() {
  const sheet = await setupSheet();
  const row = await getNextPost(sheet);

  if (!row) {
    console.log('Ｎｏ untweeted rows found.');
    return;
  }

  const id = row.get('ID');
  const itemName = row.get('項目') || '';
  const location = row.get('場所') || '';
  const overview = row.get('内容の要約') || '';

  // Format Tags (Since Category is gone, use location as a tag)
  const tags = location ? `#${location.replace(/\s+/g, '')}` : '';

  // Format Tweet Text
  const tweetText = `【${itemName}】\n${overview}\n\n${tags}`;

  console.log(`Processing ID ${id}: ${itemName}`);

  // 1. Analyze text for slides using OpenAI
  console.log('Analyzing text for slides...');
  const slideData = await analyzeTextForSlides(itemName, location, overview);
  console.log('Analysis Complete:', JSON.stringify(slideData, null, 2));

  // 2. Generate 4 Images (Anime style)
  const imagePaths = await generateAnimeImage(itemName);

  if (!imagePaths || imagePaths.length === 0) {
    console.log('No images generated. Aborting post.');
    return;
  }

  // 3. Synthesize typography (burn text onto images)
  console.log('Synthesizing text onto images...');
  await overlayText(imagePaths, id, itemName, slideData);

  // 4. X / Twitter API Automation
  try {
    await xApi.postTweetWithImages(imagePaths, tweetText);

    // 5. Mark as Posted in Sheets
    await markAsPosted(row);
    console.log('Spreadsheet updated.');

  } catch (error) {
    console.error('An error occurred during the X API process:', error);
  }

  // 6. Cleanup Downloaded Images
  for (const imgPath of imagePaths) {
    if (fs.existsSync(imgPath)) {
      fs.unlinkSync(imgPath);
      console.log(`Cleaned up temp image: ${imgPath}`);
    }
  }
}

run();
