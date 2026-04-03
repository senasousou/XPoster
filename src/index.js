require('dotenv').config();
const { chromium } = require('playwright');
const { setupSheet, getNextPost, markAsPosted } = require('./utils/sheets');
const { generateAnimeImage } = require('./utils/imageGen');
const { typeHumanLike } = require('./utils/humanTyping');
const fs = require('fs');

async function run() {
  const sheet = await setupSheet();
  const row = await getNextPost(sheet);

  if (!row) {
    console.log('Ｎｏ untweeted rows found.');
    return;
  }

  const id = row.get('ID');
  const category = row.get('分類') || '';
  const itemEra = row.get('項目名・年代') || '';
  const overview = row.get('概要') || '';

  // Format Tags
  const tags = category.split('・').map(t => `#${t.trim()}`).join(' ');

  // Format Tweet Text: 【項目名・年代】\n概要\n\n#タグ
  const tweetText = `【${itemEra}】\n${overview}\n\n${tags}`;

  console.log(`Processing ID ${id}: ${itemEra}`);

  // 1. Generate Image (Anime style)
  const imagePath = await generateAnimeImage(itemEra);

  // 2. Playwright Automation
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
    if (await page.locator('data-testid=SideNav_NewTweet_Button').isVisible({ timeout: 15000 })) {
      console.log('Logged in successfully via cookies.');
    } else {
      throw new Error('Login failed. Please update cookies.');
    }

    // Click Post Button
    await page.click('data-testid=SideNav_NewTweet_Button');
    
    // Upload Image
    console.log('Uploading image...');
    const fileInput = await page.locator('input[data-testid="fileInput"]');
    await fileInput.setInputFiles(imagePath);
    await page.waitForTimeout(3000); // Wait for upload processing

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

    // 3. Mark as Posted in Sheets
    await markAsPosted(row);
    console.log('Spreadsheet updated.');

  } catch (error) {
    console.error('An error occurred during the automation process:', error);
    process.exit(1);
  } finally {
    await browser.close();
    if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
  }
}

run();
