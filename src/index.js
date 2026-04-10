const { setupSheet, getNextPost, markAsPosted } = require('./utils/sheets');
const { analyzeTextForSlides, generateRobotTweet } = require('./utils/textAnalyzer');
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

  console.log(`Processing ID ${id}: ${itemName}`);

  // 1. Generate Robot Persona Tweet
  console.log('Generating robot persona tweet...');
  const robotText = await generateRobotTweet(itemName, location, overview);

  // Format Tags
  const tags = location ? `#${location.replace(/\s+/g, '')}` : '';
  const tweetText = `${robotText}\n\n#Record134 ${tags}`;

  console.log(`Tweet preview:\n${tweetText}`);

  // 2. Analyze text for slides (Gemini) - for future/Instagram use
  console.log('Analyzing text for slides...');
  const slideData = await analyzeTextForSlides(itemName, location, overview);
  console.log('Analysis Complete (for reference):', JSON.stringify(slideData, null, 2));

  // 3. Post to X via API (text-only, Pay Per Use model)
  try {
    await xApi.postTweet(tweetText);

    // 4. Mark as Posted in Sheets
    await markAsPosted(row);
    console.log('Spreadsheet updated.');

  } catch (error) {
    console.error('An error occurred during the X API process:', error);
    console.log('TIP: Check if you have added credit to your X Developer account (Pay Per Use model).');
  }
}

run();
