from PIL import Image
import pytesseract
import cv2 as cv
import numpy as np
import imutils
from imutils import contours

# Set the path for Tesseract
pytesseract.pytesseract.tesseract_cmd = 'C:/Program Files/Tesseract-OCR/tesseract.exe'

# Load the image in grayscale
img = cv.imread('digital-38504_1280.png', 0)

# Check if the image is loaded successfully
if img is None:
    print("Error loading image.")
    exit()

# Create kernels for morphological operations
rectKernel = cv.getStructuringElement(cv.MORPH_RECT, (10, 8))
sqKernel = cv.getStructuringElement(cv.MORPH_RECT, (5, 5))

# Perform morphological operations (TOPHAT)
tophat = cv.morphologyEx(img, cv.MORPH_TOPHAT, rectKernel)

# Sobel gradient computation
gradX = cv.Sobel(tophat, ddepth=cv.CV_32F, dx=1, dy=0, ksize=-1)
gradX = np.absolute(gradX)
(minVal, maxVal) = (np.min(gradX), np.max(gradX))
gradX = (255 * ((gradX - minVal) / (maxVal - minVal)))
gradX = gradX.astype("uint8")

# Apply closing operation to fill gaps
gradX = cv.morphologyEx(gradX, cv.MORPH_CLOSE, rectKernel)

# Apply Otsu thresholding to binarize the image
thresh = cv.threshold(gradX, 0, 255, cv.THRESH_BINARY | cv.THRESH_OTSU)[1]

# Apply second closing operation
thresh = cv.morphologyEx(thresh, cv.MORPH_CLOSE, sqKernel)

# Find contours
cnts, _ = cv.findContours(thresh.copy(), cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE)

# Loop over the contours
for (i, c) in enumerate(cnts):
    # Compute the bounding box of the contour
    (x, y, w, h) = cv.boundingRect(c)
    ar = w / float(h)

    # Filter contours based on aspect ratio
    if 2.5 < ar < 4.0:
        print(f"Contour {i}: (x={x}, y={y}, w={w}, h={h})")

        # Crop the image around the bounding box
        crop_img = img[y-5:y+h+5, x-5:x+w+5]

        # Check if the cropped image is valid
        if crop_img.size == 0:
            print(f"Empty cropped image at contour {i}. Skipping...")
            continue

        # Visualize the cropped ROI to check if it's correct
        cv.imshow(f'Cropped ROI {i}', crop_img)
        cv.waitKey(0)  # Wait for a key press to proceed

        # Apply Otsu's thresholding to crop image
        th2 = cv.threshold(crop_img, 0, 255, cv.THRESH_BINARY | cv.THRESH_OTSU)[1]

        # Find contours in the cropped image
        digitCnts, _ = cv.findContours(th2.copy(), cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE)

        # Sort the contours from left to right
        digitCnts = contours.sort_contours(digitCnts, method="left-to-right")[0]

        for d in digitCnts:
            (x, y, w, h) = cv.boundingRect(d)
            roi = crop_img[y-1:y+h+1, x-1:x+w+1]

            # Check if ROI is non-empty before resizing
            if roi.size == 0:
                print(f"Empty ROI at digit contour {i}. Skipping...")
                continue

            # Resize and apply thresholding to the ROI
            roi = cv.resize(roi, (200, 120))
            th3 = cv.threshold(roi, 0, 255, cv.THRESH_BINARY | cv.THRESH_OTSU)[1]

            # Use pytesseract to extract the digit from the image
            digit_text = pytesseract.image_to_string(th3, config='outputbase digits')

            # Remove any non-digit characters
            digit_text = ''.join(filter(str.isdigit, digit_text))

            if digit_text:
                print(f"Extracted digit: {digit_text}")
            else:
                print("No digit detected.")
