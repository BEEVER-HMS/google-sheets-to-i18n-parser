const { GoogleSpreadsheet } = require('google-spreadsheet');
const fs = require('fs');
const dotenv = require('dotenv')

dotenv.config();

function checkString(str) {
  if (
    // Check if the string is longer than 5 characters
    str.length > 5
    // Check if the string is not uniform
    || str !== str.toLowerCase()
    // Check if the string has special characters other than "-"
    || !/^[a-z0-9\-]+$/.test(str)
  ) {
    // If any of these conditions above comply, return false.
    return false;
  }

  return true;
}

async function parseSheets(clientId, privateKey, spreadsheetId, sheetId = '0') {
  if (!clientId || !privateKey || !spreadsheetId) {
    throw new Error('You have to fill out all clientId, privateKey, and spreadsheetId within supplied .env file.');
  }

  const lang = {};
  const doc = new GoogleSpreadsheet(spreadsheetId);

  await doc.useServiceAccountAuth({ client_email: clientId, private_key: privateKey });
  await doc.loadInfo(); // loads document properties and worksheets

  const sheet = doc.sheetsByIndex.find(el => el.sheetId.toFixed(0) === sheetId); // assume first sheet
  const [countryCode, ...rows] = await sheet.getRows();

  Object.keys(countryCode).forEach(key => {
    if (checkString(key)) lang[key] = {};
  });

  rows.forEach(row => {
    Object.keys(lang).forEach(langCode => {
      const langWord = row[langCode];
      // console.log('testCountryCode',row.Code);

      if(!row.Code) return;


      const codeKeys = row.Code.split('.');

      if(typeof codeKeys === 'string'){
        if (codeKeys.length > 1) {
          let startObj = lang[langCode];
  
          codeKeys.forEach((codeKey, index) => {
            if (index < codeKeys.length - 1) {
              if (!startObj[codeKey]) {
                startObj[codeKey] = {};
              }
  
              startObj = startObj[codeKey];
              return;
            }
  
            startObj[codeKey] = langWord;
          });
  
          return;
        }
      }

      lang[langCode][codeKeys[0]] = langWord;
    });
  });

  Object
    .keys(lang)
    .forEach(key => fs.writeFileSync(
      `${key}.json`,
      JSON.stringify(lang[key], null, 2)
    ));
}

console.log('tst', process.env);

parseSheets(
  process.env.CLIENT_ID,
  process.env.PRIVATE_KEY,
  process.env.SPREADSHEET_ID,
  process.env.SHEET_ID
);
