import streamlit as st
import os
import requests
from urllib.parse import quote
import json

# Page configuration
st.set_page_config(
    page_icon="https://avatars.githubusercontent.com/u/141135423?v=4",
    layout="wide",
    initial_sidebar_state="collapsed",
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
            <style>
                {css_content}
                #app-container {{
                    width: 100%;
                    height: 100%;
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
        st.components.v1.html(full_html, height=600, scrolling=False)

    except Exception as e:
        st.error(f"Error loading application: {str(e)}")
        st.write("Please check that all required files exist in the public directory.")


# Run the Streamlit app
if __name__ == "__main__":
    main()
