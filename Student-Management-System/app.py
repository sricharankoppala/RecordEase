import os
import json
from flask import Flask, request, jsonify, render_template

app = Flask(__name__)

# Ensure the data file is always created in the same directory as this script
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, "students.json")

def load_data():
    if not os.path.exists(DATA_FILE):
        return []
    try:
        with open(DATA_FILE, "r") as file:
            return json.load(file)
    except json.JSONDecodeError:
        return []

def save_data(data):
    with open(DATA_FILE, "w") as file:
        json.dump(data, file, indent=4)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/students', methods=['GET'])
def get_students():
    data = load_data()
    return jsonify(data)

@app.route('/api/students', methods=['POST'])
def add_student():
    data = load_data()
    new_student = request.json
    
    if not new_student or not new_student.get("roll_number"):
        return jsonify({"error": "Roll Number is required."}), 400
        
    # Validation for duplicate roll number
    if any(student.get("roll_number") == new_student.get("roll_number") for student in data):
        return jsonify({"error": "A student with this Roll Number already exists."}), 400
        
    # Validation for CGPA
    try:
        cgpa = float(new_student.get("cgpa", 0))
        if not (0.0 <= cgpa <= 10.0):
            return jsonify({"error": "CGPA must be between 0.0 and 10.0."}), 400
        new_student["cgpa"] = cgpa
        
        new_student["fees_paid"] = float(new_student.get("fees_paid", 0))
        new_student["total_fees"] = float(new_student.get("total_fees", 0))
        new_student["attendance"] = float(new_student.get("attendance", 0))
        
        marks = new_student.get("marks", {})
        if not isinstance(marks, dict):
            marks = {}
        new_student["marks"] = marks
    except ValueError:
        return jsonify({"error": "Invalid input for numeric fields."}), 400

    data.append(new_student)
    save_data(data)
    return jsonify({"message": "Student added successfully!", "student": new_student}), 201

@app.route('/api/students/<roll_number>', methods=['PUT'])
def update_student(roll_number):
    data = load_data()
    update_info = request.json
    
    for student in data:
        if student.get("roll_number") == roll_number:
            if "name" in update_info and update_info["name"]:
                student["name"] = update_info["name"]
            if "branch" in update_info and update_info["branch"]:
                student["branch"] = update_info["branch"]
            if "year" in update_info and update_info["year"]:
                student["year"] = update_info["year"]
            if "email" in update_info and update_info["email"]:
                student["email"] = update_info["email"]
                
            try:
                if "cgpa" in update_info and str(update_info["cgpa"]).strip():
                    cgpa = float(update_info["cgpa"])
                    if not (0.0 <= cgpa <= 10.0):
                        return jsonify({"error": "CGPA must be between 0.0 and 10.0."}), 400
                    student["cgpa"] = cgpa
                if "fees_paid" in update_info:
                    student["fees_paid"] = float(update_info["fees_paid"])
                if "total_fees" in update_info:
                    student["total_fees"] = float(update_info["total_fees"])
                if "attendance" in update_info:
                    student["attendance"] = float(update_info["attendance"])
                if "marks" in update_info and isinstance(update_info["marks"], dict):
                    student["marks"] = update_info["marks"]
            except ValueError:
                return jsonify({"error": "Invalid input for numeric fields."}), 400
                    
            save_data(data)
            return jsonify({"message": "Student updated successfully!", "student": student}), 200
            
    return jsonify({"error": "Student not found."}), 404

@app.route('/api/students/<roll_number>', methods=['DELETE'])
def delete_student(roll_number):
    data = load_data()
    for i, student in enumerate(data):
        if student.get("roll_number") == roll_number:
            del data[i]
            save_data(data)
            return jsonify({"message": "Student deleted successfully!"}), 200
            
    return jsonify({"error": "Student not found."}), 404

if __name__ == '__main__':
    app.run(debug=True)
