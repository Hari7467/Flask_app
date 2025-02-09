from flask import Flask, render_template, request, jsonify
import os
from calculation import calculate_abi
from image_processing import extract_numbers_from_image

app = Flask(__name__)

@app.route('/')
def welcome():
    return render_template('welcome.html')

@app.route('/home')
def home():
    return render_template('home.html')

@app.route('/calculate', methods=['POST'])
def calculate():
    if request.method == 'POST':
        data = request.get_json()
        right_arm = float(data.get('right_arm'))
        left_arm = float(data.get('left_arm'))
        right_ankle = float(data.get('right_ankle'))
        left_ankle = float(data.get('left_ankle'))
        
        result = calculate_abi(right_arm, left_arm, right_ankle, left_ankle)
        return jsonify(result)

@app.route('/process-image', methods=['POST'])
def process_image():
    if 'image' not in request.files:
        return jsonify({'error': 'No image uploaded'}), 400
    
    image = request.files['image']
    numbers = extract_numbers_from_image(image)
    if numbers:
        result = calculate_abi(*numbers)
        return jsonify(result)
    return jsonify({'error': 'Could not extract numbers from image'}), 400

if __name__ == '__main__':
    app.run(debug=True)