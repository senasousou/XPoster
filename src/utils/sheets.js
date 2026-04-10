const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

/**
 * Sets up and returns the Google Sheet document instance.
 */
async function setupSheet() {
  const email = (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '').trim();
  const key = (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || '').trim().replace(/\\n/g, '\n');
  const spreadsheetId = (process.env.SPREADSHEET_ID || '').trim();

  const serviceAccountAuth = new JWT({
    email,
    key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const doc = new GoogleSpreadsheet(spreadsheetId, serviceAccountAuth);
  await doc.loadInfo();
  return doc.sheetsByIndex[0]; // Assume first sheet
}

/**
 * Gets the first row where 'Status' is empty.
 */
async function getNextPost(sheet) {
  const rows = await sheet.getRows();
  console.log(`Total rows fetched: ${rows.length}`);

  for (let i = 0; i < rows.length; i++) {
    const status = rows[i].get('ステータス');
    console.log(`Row ${i + 1} status: [${status}]`);
  }

  const nextRow = rows.find(row => !row.get('ステータス') || row.get('ステータス').trim() === '');
  if (nextRow) {
    console.log(`Found row to post: ID ${nextRow.get('ID')}`);
  } else {
    console.log('No eligible row found to post.');
  }

  return nextRow;
}

/**
 * Marks a row as posted.
 */
async function markAsPosted(row) {
  row.set('ステータス', 'Posted');
  await row.save();
}

module.exports = { setupSheet, getNextPost, markAsPosted };
