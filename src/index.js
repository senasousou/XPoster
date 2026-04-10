require('dotenv').config();
const { chromium } = require('playwright');
const { setupSheet, getNextPost, markAsPosted } = require('./utils/sheets');
const { generateAnimeImage } = require('./utils/imageGen');
const { typeHumanLike } = require('./utils/humanTyping');
const { analyzeTextForSlides } = require('./utils/textAnalyzer');
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
  await overlayText(imagePaths, id, itemEra, slideData);

  // 4. Playwright Automation - X / Twitter
  const browser = await chromium.launch({ headless: true }); // GitHub Actions runs headless
  // Load session cookies from a JSON file (passed as secret)
  const context = await browser.newContext({
    storageState: 'cookies.json',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  });
  
  const page = await context.newPage();

  try {
    console.log('Navigating to X.com...');
    await page.goto('https://x.com/home');
    
    // Check if logged in (if not, we'll see the login button)
    if (await page.locator('data-testid=SideNav_NewTweet_Button').isVisible({ timeout: 15000 }).catch(() => false)) {
      console.log('Logged in successfully via cookies.');
    } else {
      throw new Error('X Login failed. Please update cookies.json.');
    }

    // Click Post Button
    await page.click('data-testid=SideNav_NewTweet_Button');
    
    // Upload Images
    console.log(`Uploading ${imagePaths.length} images to X...`);
    const fileInput = page.locator('input[data-testid="fileInput"]');
    await fileInput.setInputFiles(imagePaths);
    await page.waitForTimeout(3000 * imagePaths.length); // Wait for upload processing

    // Type Text Human-Lile
    console.log('Typing tweet...');
    const editor = page.locator('div[data-testid="tweetTextarea_0"]');
    await editor.click();
    await typeHumanLike(page, editor, tweetText);

    // Click Tweet Button
    console.log('Sending tweet...');
    await page.click('data-testid=tweetButton');
    
    await page.waitForTimeout(5000); // Wait for post to complete
    console.log('Tweet sent successfully!');

    // 5. Mark as Posted in Sheets
    await markAsPosted(row);
    console.log('Spreadsheet updated.');

  } catch (error) {
    console.error('An error occurred during the X automation process:', error);
    // Take screenshot on failure for debugging
    await page.screenshot({ path: 'x_error.png' }).catch(() => {});
  } finally {
    await browser.close();
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
