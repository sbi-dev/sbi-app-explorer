// This file is for reference only - the app now runs through Streamlit
const express = require('express');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const toml = require('toml');

const app = express();
const port = process.env.PORT || 3000;

// Get API keys from secrets.toml, environment variables, or defaults
let API_KEY, SPREADSHEET_ID, RANGE;

// Try to read from secrets.toml first
const secretsPath = path.join(__dirname, '.streamlit', 'secrets.toml');
try {
  if (fs.existsSync(secretsPath)) {
    const secretsContent = fs.readFileSync(secretsPath, 'utf8');
    const secrets = toml.parse(secretsContent);
    
    if (secrets.google_sheets) {
      API_KEY = secrets.google_sheets.api_key;
      SPREADSHEET_ID = secrets.google_sheets.spreadsheet_id;
      RANGE = secrets.google_sheets.range;
      console.log("Using API keys from secrets.toml");
    }
  }
} catch (error) {
  console.warn("Could not load secrets.toml:", error.message);
}

// Fall back to environment variables if secrets.toml didn't work
if (!API_KEY) {
  API_KEY = process.env.GOOGLE_API_KEY || '';
  SPREADSHEET_ID = process.env.SPREADSHEET_ID || '';
  RANGE = process.env.SPREADSHEET_RANGE || "'dev'!B1:P100000";
  console.log("Using API keys from environment variables");
}

// Log key usage (first few characters only for security)
if (API_KEY) {
  console.log(`API Key: ${API_KEY.substring(0, 5)}...`);
  console.log(`Spreadsheet ID: ${SPREADSHEET_ID.substring(0, 5)}...`);
} else {
  console.warn("WARNING: No API key found. Application may not work correctly.");
}

async function getData() {
    if (!API_KEY || !SPREADSHEET_ID) {
      console.error("Missing API key or spreadsheet ID");
      return null;
    }
    
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${RANGE}?key=${API_KEY}`;
    try {
      const response = await axios.get(url);
      return response.data.values;
    } catch (error) {
      console.error('Error fetching data:', error);
      return null;
    }
}
  
// DEBUGGING: fetch data and log to console
// getData().then(data => {
//   if (data) {
//     const headers = data[0]; // assuming the first row contains headers
//     const rows = data.slice(1); // rest of the rows are data

//     // map rows to objects with headers as keys and parse numbers
//     const formattedData = rows.map(row => {
//       return headers.reduce((acc, header, index) => {
//         acc[header] = isNaN(row[index]) ? row[index] : +row[index]; // parse as number if possible
//         return acc;
//         }, {});
//       });
  
//     // replace key 'research area\nstatistics, astrophysics, neuroscience, biology, geoscience, climate science, ' with research area
//     formattedData.forEach(d => { d['research area'] = d['research area\nstatistics, astrophysics, neuroscience, biology, geoscience, climate science, ']; 
//       delete d['research area\nstatistics, astrophysics, neuroscience, biology, geoscience, climate science, ']; });

//     // just print the data to console for now
//     console.log(formattedData);
// }});

app.get('/data', async (req, res) => {
    const data = await getData();

    if (data) {
      const headers = data[0]; // assuming the first row contains headers
      const dataRows = data.slice(2); // skip both header row and documentation row
      
      // map rows to objects with headers as keys and parse numbers
      const formattedData = dataRows.map(row => {
        return headers.reduce((acc, header, index) => {
          acc[header] = isNaN(row[index]) ? row[index] : +row[index]; // parse as number if possible
          return acc;
        }, {});
      });

      res.json(formattedData);
    } else {
      res.status(500).send('Error fetching data');
    }
  });
  
  // Serve static files (HTML, JS)
  app.use(express.static(path.join(__dirname, 'public')));
  
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });