from flask import Flask, render_template, request, jsonify , send_file
from pymongo import MongoClient
import os
from calculation import calculate_abi
from image_processing import extract_numbers_from_image
import pandas as pd
from datetime import date
from flask_cors import CORS
app = Flask(__name__)
CORS(app)
# MongoDB connection
client = MongoClient("mongodb+srv://harivijayan2004:97041208@cluster0.jpzey.mongodb.net/?retryWrites=true&w=majority&tls=true&tlsAllowInvalidCertificates=true")

db = client["bptracker"]
collection = db["readings"]

@app.route('/')
def welcome():
    return render_template('welcome.html')

@app.route('/home')
def home():
    return render_template('home.html')

@app.route('/analysis')
def analysis():
    return render_template('analysis.html')

@app.route('/getdata', methods=['GET'])
def getdata():
    data = list(collection.find())  

    if not data:
        return jsonify({"error": "No data found"}), 404

    # Format data for the frontend
    extracted_data = [{
        "Date": item["date"],
        "Right ABI": item["abi_result"]["right_abi"],
        "Left ABI": item["abi_result"]["left_abi"]
    } for item in data]

    if not extracted_data:
        return jsonify({'error': 'No filtered data available'}), 404

    # Send JSON response directly
    return jsonify(extracted_data)


    
@app.route('/calculate', methods=['POST'])
def calculate():
    if request.method == 'POST':
        data = request.get_json()
        right_arm = float(data.get('right_arm'))
        left_arm = float(data.get('left_arm'))
        right_ankle = float(data.get('right_ankle'))
        left_ankle = float(data.get('left_ankle'))
        
        # Calculate ABI
        result = calculate_abi(right_arm, left_arm, right_ankle, left_ankle)

        # Save to MongoDB
        entry = {
            "date": date.today().strftime("%Y-%m-%d"),
            "right_arm": right_arm,
            "left_arm": left_arm,
            "right_ankle": right_ankle,
            "left_ankle": left_ankle,
            "abi_result": result
        }
        collection.insert_one(entry)

        return jsonify(result)



@app.route('/process-images', methods=['POST'])
def process_images():
    required_keys = ["right-arm-image", "left-arm-image", "right-ankle-image", "left-ankle-image"]
    readings = []
    
    for key in required_keys:
        if key not in request.files:
            return jsonify({'error': f'Missing image for {key}'}), 400
        image = request.files[key]
        numbers = extract_numbers_from_image(image)
        print(numbers)
        if numbers is None:  # Debugging step
            return jsonify({'error': f'Failed to extract numbers from {key}. Ensure the image is clear and readable.'}), 400
        readings.append(numbers)
        
    if len(readings) == 4:
        result = calculate_abi(*readings)

        # Save extracted values and result to MongoDB
        entry = {
            "date": date.today().strftime("%Y-%m-%d"),
            "right_arm": readings[0],
            "left_arm": readings[1],
            "right_ankle": readings[2],
            "left_ankle": readings[3],
            "abi_result": result
        }
        collection.insert_one(entry)

        return jsonify(result)
    else:
         return jsonify({"error": f"Expected 4 valid readings, but got {len(readings)}. Ensure all images are clear and readable."})

if __name__ == '__main__':
    app.run(debug=True)
