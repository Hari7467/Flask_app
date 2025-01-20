from flask import Flask, request, render_template, url_for, flash, redirect, session
import os
from digit import digit_extraction, calculation , risk_classification

app = Flask(__name__)
app.secret_key = 'your_secret_key'  # Required for using session

@app.route('/')
def index():
    return redirect(url_for('welcome'))

# Routing to welcome page
@app.route('/welcome')
def welcome():
    return render_template('welcome.html')

# Routing to home page
@app.route('/home')
def home():
    # Retrieve data from session
    right_abi = request.args.get('right_abi', None)
    left_abi = request.args.get('left_abi', None)
    right_abi_risk = request.args.get('right_abi_risk', '')
    left_abi_risk = request.args.get('left_abi_risk', '')
    return render_template('home.html',right_abi_risk=right_abi_risk, right_abi=right_abi,left_abi_risk=left_abi_risk,left_abi=left_abi)

@app.route('/upload', methods=['POST'])
def upload():
    
    option1 = request.form.get('option1')
    if option1 == 'numeric':
        option1_value = request.form['option1-num']
    elif option1 == 'image':
        option1_image = request.files['option1-image']
        image_path = os.path.join('uploads', option1_image.filename)
        option1_image.save(image_path)
        option1_value = digit_extraction(image_path)

    # Handle Option 2
    option2 = request.form.get('option2')
    if option2 == 'numeric':
        option2_value = request.form['option2-num']
    elif option2 == 'image':
        option2_image = request.files['option2-image']
        image_path = os.path.join('uploads', option2_image.filename)
        option2_image.save(image_path)
        option2_value = digit_extraction(image_path)

    # Handle Option 3
    option3 = request.form.get('option3')
    if option3 == 'numeric':
        option3_value = request.form['option3-num']
    elif option3 == 'image':
        option3_image = request.files['option3-image']
        image_path = os.path.join('uploads', option3_image.filename)
        option3_image.save(image_path)
        option3_value = digit_extraction(image_path)

    # Handle Option 4
    option4 = request.form.get('option4')
    if option4 == 'numeric':
        option4_value = request.form['option4-num']
    elif option4 == 'image':
        option4_image = request.files['option4-image']
        image_path = os.path.join('uploads', option4_image.filename)
        option4_image.save(image_path)
        option4_value = digit_extraction(image_path)
    # convert the string into float
    try:
        option1_value = float(option1_value)  # Convert to float
        option2_value = float(option2_value)  # Convert to float
        option3_value = float(option3_value)  # Convert to float
        option4_value = float(option4_value)  # Convert to float
    except ValueError:
        # Handle the case where conversion fails (invalid input)
        return "Error: Invalid input. Please enter numeric values."
    # calculation
    right_abi,left_abi = calculation(option1_value,option2_value,option3_value,option4_value)
    # Risk classification
    right_abi_risk,left_abi_risk = risk_classification(right_abi,left_abi)
    # Print all collected values (for demonstration purposes)
    return redirect(url_for('home', right_abi_risk=right_abi_risk, right_abi=right_abi,left_abi_risk=left_abi_risk,left_abi=left_abi))

if __name__ == '__main__':
    app.run(debug=True)
