import streamlit as st
import os
import requests
from urllib.parse import quote
import json

# Page configuration
st.set_page_config(
    page_title="SBI Applications Explorer",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="collapsed",
)

# Simple, clean styling to fix layout
st.markdown(
    """
<style>
    /* Hide Streamlit elements */
    header {display: none !important;}
    #MainMenu {visibility: hidden !important;}
    footer {visibility: hidden !important;}
    
    /* Remove ALL padding and spacing from Streamlit containers */
    .reportview-container {
        padding: 0 !important;
        margin: 0 !important;
    }
    .main .block-container {
        padding: 0 !important;
        margin: 0 !important;
        max-width: 100% !important;
    }
    
    /* Fix Streamlit app container */
    .stApp {
        overflow: hidden !important;
        padding: 0 !important;
        margin: 0 !important;
    }
    
    /* Reset ALL containers to full width */
    .element-container, .stHorizontalBlock, .row-widget, [data-testid="stVerticalBlock"] {
        width: 100% !important;
        max-width: 100% !important;
        padding: 0 !important;
        margin: 0 !important;
    }
    
    /* Fix for iframe positioning */
    iframe {
        height: 100vh !important;
        width: 100vw !important;
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        border: none !important;
        padding: 0 !important;
        margin: 0 !important;
        z-index: 99 !important;
    }
    
    /* Override any Streamlit-added containers */
    div[data-testid="stDecoration"], div[data-testid="stToolbar"], div[data-testid="stStatusWidget"] {
        display: none !important;
    }
</style>
""",
    unsafe_allow_html=True,
)

# Get API keys from Streamlit secrets or environment variables
if "google_sheets" in st.secrets:
    API_KEY = st.secrets["google_sheets"]["api_key"]
    SPREADSHEET_ID = st.secrets["google_sheets"]["spreadsheet_id"]
    RANGE = st.secrets["google_sheets"]["range"]
else:
    API_KEY = os.environ.get("GOOGLE_API_KEY", "")
    SPREADSHEET_ID = os.environ.get("SPREADSHEET_ID", "")
    RANGE = os.environ.get("SPREADSHEET_RANGE", "'dev'!B1:P100000")

# Get directory for static files
script_dir = os.path.dirname(os.path.abspath(__file__))
public_dir = os.path.join(script_dir, "public")


# Function to read file contents
def read_file(path):
    with open(path, "r", encoding="utf-8") as file:
        return file.read()


# Function to fetch data from Google Sheets
def get_sheets_data():
    url = f"https://sheets.googleapis.com/v4/spreadsheets/{SPREADSHEET_ID}/values/{quote(RANGE)}?key={API_KEY}"
    try:
        response = requests.get(url)
        response.raise_for_status()
        sheet_data = response.json()

        if "values" in sheet_data:
            headers = sheet_data["values"][0]
            data_rows = sheet_data["values"][2:]  # Skip header and documentation row

            # Convert to list of objects
            formatted_data = []
            for row in data_rows:
                item = {}
                for i, header in enumerate(headers):
                    if i < len(row):
                        try:
                            value = (
                                float(row[i])
                                if row[i]
                                and row[i].strip()
                                and row[i].strip().replace(".", "", 1).isdigit()
                                else row[i]
                            )
                            item[header] = value
                        except (ValueError, TypeError):
                            item[header] = row[i]
                    else:
                        item[header] = None
                formatted_data.append(item)

            return formatted_data
        else:
            st.error("No data values found in sheet response")
            return []
    except Exception as e:
        st.error(f"Error fetching data: {str(e)}")
        return []


# Main function
def main():
    # Get data from Google Sheets
    data = get_sheets_data()

    # Read the static files
    try:
        html_content = read_file(os.path.join(public_dir, "index.html"))
        css_content = read_file(os.path.join(public_dir, "style.css"))
        js_content = read_file(os.path.join(public_dir, "view.js"))

        # Modify the view.js file to remove any hardcoded API keys
        js_content = js_content.replace(
            "const response = await fetch('/data');",
            "const response = { json: () => Promise.resolve(window.sbiData) };",
        )

        # Create a full HTML with embedded data, CSS and JS
        full_html = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
            <title>SBI Applications</title>
            <style>
                {css_content}
                
                /* Fullscreen fixes */
                html, body {{
                    margin: 0;
                    padding: 0;
                    width: 100%;
                    height: 100%;
                    overflow: hidden;
                }}
                
                #app-container {{
                    width: 100%;
                    height: 100%;
                    overflow: hidden;
                }}
            </style>
        </head>
        <body>
            {html_content}
            <script>
                // Embedded data from Google Sheets
                window.sbiData = {json.dumps(data)};
            </script>
            <script>{js_content}</script>
        </body>
        </html>
        """

        # Use a minimal amount of custom CSS to make the Streamlit app fullscreen
        st.markdown(
            """
            <style>
                /* Hide Streamlit elements */
                header {display: none !important;}
                #MainMenu {visibility: hidden !important;}
                footer {visibility: hidden !important;}
                
                /* Reset padding and margins */
                .main .block-container {
                    padding: 0 !important;
                    margin: 0 !important;
                    max-width: 100% !important;
                }
                
                /* Make the app fill the screen */
                .stApp {
                    margin: 0 !important;
                    padding: 0 !important;
                }
                
                /* Fill remaining space with iframe */
                iframe {
                    width: 100vw !important;
                    height: 100vh !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    border: none !important;
                    position: fixed !important;
                    top: 0 !important;
                    left: 0 !important;
                }
            </style>
            """,
            unsafe_allow_html=True,
        )

        # Use the standard components.v1.html with a large height
        st.components.v1.html(full_html, height=1000, scrolling=False)

    except Exception as e:
        st.error(f"Error loading application: {str(e)}")
        st.write("Please check that all required files exist in the public directory.")


# Run the Streamlit app
if __name__ == "__main__":
    main()
