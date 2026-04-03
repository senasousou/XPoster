/**
 * Types text into a locator with human-like delays and occasional mistakes.
 * @param {import('playwright').Page} page 
 * @param {import('playwright').Locator} locator 
 * @param {string} text 
 */
async function typeHumanLike(page, locator, text) {
  const errorChance = 0.03; // 3% chance for a typo
  
  for (const char of text) {
    const delay = Math.random() * 80 + 40; // 40-120ms delay
    await page.waitForTimeout(delay);

    if (Math.random() < errorChance) {
      // Simulate a typo (typing the next char in ASCII)
      const wrongChar = String.fromCharCode(char.charCodeAt(0) + 1);
      await locator.press(wrongChar);
      await page.waitForTimeout(Math.random() * 200 + 100);
      await locator.press('Backspace');
      await page.waitForTimeout(Math.random() * 100 + 50);
    }
    
    await locator.press(char);
  }
}

module.exports = { typeHumanLike };
