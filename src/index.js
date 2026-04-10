require('dotenv').config();
const { setupSheet, getNextPost, markAsPosted } = require('./utils/sheets');
const { analyzeTextForSlides } = require('./utils/textAnalyzer');
const xApi = require('./utils/xApi');

async function run() {
  const sheet = await setupSheet();
  const row = await getNextPost(sheet);

  if (!row) {
    console.log('No untweeted rows found.');
    return;
  }

  const id = row.get('ID');
  const itemName = row.get('項目') || '';
  const location = row.get('場所') || '';
  const overview = row.get('内容の要約') || '';

  // Format Tags
  const tags = location ? `#${location.replace(/\s+/g, '')}` : '';

  // Format Tweet Text (Xの文字数制限は280文字なので要約を短く)
  const tweetText = `【${itemName}】\n${overview.slice(0, 200)}\n\n${tags}`;

  console.log(`Processing ID ${id}: ${itemName}`);
  console.log(`Tweet preview:\n${tweetText}`);

  // 1. Analyze text for slides (Gemini) - for future use / log only
  console.log('Analyzing text for slides...');
  const slideData = await analyzeTextForSlides(itemName, location, overview);
  console.log('Analysis Complete:', JSON.stringify(slideData, null, 2));

  // 2. Post to X via API (text-only)
  try {
    await xApi.postTweet(tweetText);

    // 3. Mark as Posted in Sheets
    await markAsPosted(row);
    console.log('Spreadsheet updated.');

  } catch (error) {
    console.error('An error occurred during the X API process:', error);
  }
}

run();
