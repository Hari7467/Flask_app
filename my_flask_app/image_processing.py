import cv2
import numpy as np
import pytesseract
from PIL import Image
import io

def extract_numbers_from_image(image_file):
    """
    Extract numbers from an uploaded image using OCR.
    Returns a tuple of (right_arm, left_arm, right_ankle, left_ankle) if successful,
    None otherwise.
    """
    try:
        # Read image file
        image_bytes = image_file.read()
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Preprocess image
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
        
        # OCR
        text = pytesseract.image_to_string(thresh)
        
        # Extract numbers
        numbers = []
        for line in text.split('\n'):
            # Look for numbers in the text
            for word in line.split():
                try:
                    num = float(word)
                    if 0 <= num <= 300:  # Valid BP range
                        numbers.append(num)
                except ValueError:
                    continue
        
        # If we found exactly 4 numbers, assume they're in the right order
        if len(numbers) == 4:
            return tuple(numbers)
        
        return None
    except Exception as e:
        print(f"Error processing image: {str(e)}")
        return None