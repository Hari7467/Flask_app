import io
import requests
from PIL import Image
import re
import base64
# Your Gemini API Key (Replace with your actual API key)
GEMINI_API_KEY = "AIzaSyDUNYeskgVchC8RfW7LRsyfXbHoIHRFOTA"
GEMINI_API_URL = f"https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"

def extract_numbers_from_image(image_file):
    try:
        # Convert image to bytes
        image = Image.open(image_file)
        img_byte_arr = io.BytesIO()
        image.save(img_byte_arr, format='PNG')
        img_bytes = img_byte_arr.getvalue()
        encoded_image = base64.b64encode(img_bytes).decode("utf-8")
        # Prepare the request payload
        payload = {
            "contents": [
                {
                    "parts": [
                                {"inlineData": {"mimeType": "image/png", "data": encoded_image}}
                            ]
                }
            ]
        }

        # Send request to Gemini API
        response = requests.post(GEMINI_API_URL, json=payload)
        result = response.json()


        # Extract text from response correctly
        parts = result.get("candidates", [{}])[0].get("content", {}).get("parts", [])
        extracted_text = " ".join(part.get("text", "") for part in parts)


        # Extract numeric values
        numbers = re.findall(r'\d+\.\d+|\d+', extracted_text)  # Find floats and integers
        print("🟢 Extracted Numbers:", numbers)  # Debugging

        if numbers:
            return float(numbers[0]) if '.' in numbers[0] else int(numbers[0])
        else:
            return None  # No numbers found

    except Exception as e:
        print(f"❌ Error extracting numbers: {e}")
        return None
