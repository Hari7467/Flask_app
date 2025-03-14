from flask import Flask, render_template, request, jsonify , send_file
from pymongo import MongoClient
import os
from calculation import calculate_abi
from image_processing import extract_numbers_from_image
import pandas as pd
from datetime import date
app = Flask(__name__)

# MongoDB connection
MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://harivijayan2004:97041208@cluster0.jpzey.mongodb.net/")
client = MongoClient(MONGO_URI)
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

    # Convert ObjectId to string
    for item in data:
        item['_id'] = str(item['_id'])

    extracted_data = []
    for item in data:
        extracted_data.append({
            "Date": item["date"],
            "Right Arm": item["right_arm"],
            "Left Arm": item["left_arm"],
            "Right Ankle": item["right_ankle"],
            "Left Ankle": item["left_ankle"],
            "Right ABI": item["abi_result"]["right_abi"],
            "Left ABI": item["abi_result"]["left_abi"],
            "Right Risk": item["abi_result"]["right_risk"],
            "Left Risk": item["abi_result"]["left_risk"],
            "Highest Brachial": item["abi_result"]["highest_brachial"]
        })

    # Convert filtered data to DataFrame
    df = pd.DataFrame(extracted_data)
    # Save DataFrame to Excel file
    excel_file = 'results.xlsx'
    df.to_excel(excel_file, index=False)

    # Extract only 'date' and 'abi_result' columns
    filtered_data = df[['Date', 'Right ABI', 'Left ABI']]
    filter_file = 'filtered_result.xlsx'
    filtered_data.to_excel(filter_file, index=False)
    if filtered_data.empty:
        return jsonify({'error': 'No filtered data available'}), 404
    return jsonify(filtered_data.to_dict(orient='records'))
    

    
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


@app.route('/process-image', methods=['POST'])
def process_image():
    if 'image' not in request.files:
        return jsonify({'error': 'No image uploaded'}), 400
    
    image = request.files['image']
    numbers = extract_numbers_from_image(image)
    if numbers:
        result = calculate_abi(*numbers)

        # Save extracted values and result to MongoDB
        entry = {
            "right_arm": numbers[0],
            "left_arm": numbers[1],
            "right_ankle": numbers[2],
            "left_ankle": numbers[3],
            "abi_result": result
        }
        collection.insert_one(entry)

        return jsonify(result)
    return jsonify({'error': 'Could not extract numbers from image'}), 400

if __name__ == '__main__':
    app.run(debug=True)
