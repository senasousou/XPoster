const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

/**
 * Sets up and returns the Google Sheet document instance.
 */
async function setupSheet() {
  const serviceAccountAuth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const doc = new GoogleSpreadsheet(process.env.SPREADSHEET_ID, serviceAccountAuth);
  await doc.loadInfo();
  return doc.sheetsByIndex[0]; // Assume first sheet
}

/**
 * Gets the first row where 'Status' is empty.
 */
async function getNextPost(sheet) {
  const rows = await sheet.getRows();
  return rows.find(row => !row.get('ステータス') || row.get('ステータス').trim() === '');
}

/**
 * Marks a row as posted.
 */
async function markAsPosted(row) {
  row.set('ステータス', 'Posted');
  await row.save();
}

module.exports = { setupSheet, getNextPost, markAsPosted };
