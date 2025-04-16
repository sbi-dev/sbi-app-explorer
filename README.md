# SBI Applications Widget

Interactive visualization of Simulation-Based Inference (SBI) applications.


1. Create a `.streamlit/secrets.toml` file with your API keys:
   ```toml
   [google_sheets]
   api_key = "YOUR_GOOGLE_API_KEY"
   spreadsheet_id = "YOUR_SPREADSHEET_ID"
   range = "'dev'!B1:P100000"
   ```

## Running the App Locally

### Streamlit Version

1. Install dependencies:
   ```bash
   pip install streamlit requests
   ```

2. Run the app:
   ```bash
   streamlit run app.py
   ```

3. Access at http://localhost:8501

### Node.js Version

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the server:
   ```bash
   node app.js
   ```

3. Access at http://localhost:3000

## Deployment

### Streamlit Cloud 

1. Sync with GitHub
2. Deploy on [Streamlit Cloud](https://streamlit.io/cloud)
3. Add secrets in Streamlit Cloud settings:


## Embedding in Other Websites

```html
<iframe
  src="https://your-app-url.streamlit.app/?embed=true"
  width="100%"
  height="800px"
  style="border:none;"
></iframe>
```

## Development and Customization

- **Modify visualization**: Edit files in the `public/` directory
- **Update data processing**: Edit the data handling in either `app.py` or `app.js`
- **Change styling**: Modify `public/style.css` or add inline styles
- **Add features**: Both versions use the same frontend code in `public/view.js`
  