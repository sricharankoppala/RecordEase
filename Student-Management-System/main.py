import json
import os

# Ensure the data file is always created in the same directory as this script
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, "students.json")

def load_data():
    """Load student data from the JSON file."""
    if not os.path.exists(DATA_FILE):
        return []
    try:
        with open(DATA_FILE, "r") as file:
            return json.load(file)
    except json.JSONDecodeError:
        return []

def save_data(data):
    """Save student data to the JSON file."""
    with open(DATA_FILE, "w") as file:
        json.dump(data, file, indent=4)

def add_student(data):
    """Add a new student to the records."""
    print("\n--- Add Student ---")
    roll_number = input("Enter Roll Number: ").strip()
    
    # Check for duplicate roll number
    for student in data:
        if student.get("roll_number") == roll_number:
            print("Error: A student with this Roll Number already exists.")
            return

    name = input("Enter Name: ").strip()
    branch = input("Enter Branch: ").strip()
    year = input("Enter Year: ").strip()
    
    # Handle invalid CGPA inputs
    try:
        cgpa = float(input("Enter CGPA: ").strip())
        if cgpa < 0.0 or cgpa > 10.0:
            print("Error: CGPA must be between 0.0 and 10.0.")
            return
    except ValueError:
        print("Error: Invalid input for CGPA. Please enter a number.")
        return

    email = input("Enter Email: ").strip()

    student = {
        "roll_number": roll_number,
        "name": name,
        "branch": branch,
        "year": year,
        "cgpa": cgpa,
        "email": email
    }
    
    data.append(student)
    save_data(data)
    print("Student added successfully!")

def view_students(data):
    """Display all student records."""
    print("\n--- All Students ---")
    if not data:
        print("No students found.")
        return
        
    for student in data:
        print(f"Roll No: {student.get('roll_number')} | Name: {student.get('name')} | Branch: {student.get('branch')} | Year: {student.get('year')} | CGPA: {student.get('cgpa')} | Email: {student.get('email')}")

def search_student(data):
    """Search for a student by their Roll Number."""
    print("\n--- Search Student ---")
    roll_number = input("Enter Roll Number to search: ").strip()
    
    for student in data:
        if student.get("roll_number") == roll_number:
            print("\nStudent Found:")
            print(f"Roll No: {student.get('roll_number')}")
            print(f"Name: {student.get('name')}")
            print(f"Branch: {student.get('branch')}")
            print(f"Year: {student.get('year')}")
            print(f"CGPA: {student.get('cgpa')}")
            print(f"Email: {student.get('email')}")
            return
            
    print("Student not found.")

def update_student(data):
    """Update details of an existing student."""
    print("\n--- Update Student ---")
    roll_number = input("Enter Roll Number to update: ").strip()
    
    for student in data:
        if student.get("roll_number") == roll_number:
            print("Leave field blank to keep current value.")
            name = input(f"Enter New Name ({student.get('name')}): ").strip()
            branch = input(f"Enter New Branch ({student.get('branch')}): ").strip()
            year = input(f"Enter New Year ({student.get('year')}): ").strip()
            
            cgpa_input = input(f"Enter New CGPA ({student.get('cgpa')}): ").strip()
            cgpa = student.get('cgpa')
            if cgpa_input:
                try:
                    cgpa = float(cgpa_input)
                    if cgpa < 0.0 or cgpa > 10.0:
                        print("Error: CGPA must be between 0.0 and 10.0. Update aborted.")
                        return
                except ValueError:
                    print("Error: Invalid input for CGPA. Update aborted.")
                    return
                    
            email = input(f"Enter New Email ({student.get('email')}): ").strip()

            if name: student['name'] = name
            if branch: student['branch'] = branch
            if year: student['year'] = year
            student['cgpa'] = cgpa
            if email: student['email'] = email
            
            save_data(data)
            print("Student updated successfully!")
            return
            
    print("Student not found.")

def delete_student(data):
    """Delete a student record from the system."""
    print("\n--- Delete Student ---")
    roll_number = input("Enter Roll Number to delete: ").strip()
    
    for i, student in enumerate(data):
        if student.get("roll_number") == roll_number:
            del data[i]
            save_data(data)
            print("Student deleted successfully!")
            return
            
    print("Student not found.")

def main():
    """Main menu loop for the application."""
    data = load_data()
    
    while True:
        print("\n--- Student Management System ---")
        print("1. Add Student")
        print("2. View All Students")
        print("3. Search Student")
        print("4. Update Student")
        print("5. Delete Student")
        print("6. Exit")
        
        choice = input("Enter your choice (1-6): ").strip()
        
        if choice == '1':
            add_student(data)
        elif choice == '2':
            view_students(data)
        elif choice == '3':
            search_student(data)
        elif choice == '4':
            update_student(data)
        elif choice == '5':
            delete_student(data)
        elif choice == '6':
            print("Exiting application. Goodbye!")
            break
        else:
            print("Invalid choice. Please enter a number between 1 and 6.")

if __name__ == "__main__":
    main()
