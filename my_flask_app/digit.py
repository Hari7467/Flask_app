from PIL import Image
import pytesseract
# If you don't have tesseract executable in your PATH, include the following:
def digit_extraction(path):
    pytesseract.pytesseract.tesseract_cmd = 'C:/Program Files/Tesseract-OCR/tesseract.exe'
    return int(pytesseract.image_to_string(Image.open(path)))
def calculation(r_bra, l_bra, r_ank, l_ank):
    high_bra_pressure = max(r_bra, l_bra)  # Get the maximum of the two brachial pressures
    right_abi = r_ank / high_bra_pressure  # Calculate the ABI for the right ankle
    left_abi = l_ank / high_bra_pressure  # Calculate the ABI for the left ankle
    return round(right_abi, 2) ,round(left_abi, 2)   # Return the ABI values for both sides
def risk_classification(right_abi ,left_abi):
   right_abi_risk=risk_classifier(right_abi)
   left_abi_risk=risk_classifier(left_abi)
   return right_abi_risk,left_abi_risk
def risk_classifier(val):
    if val>0.9:
        risk="normal"
    elif val<=0.9 and val>0.7:
        risk="Mild Risk"
    elif val<=0.7 and val>0.4:
        risk="high"
    else:
        risk="severe"
    return risk
        