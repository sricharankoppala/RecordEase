document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const addStudentBtn = document.getElementById('addStudentBtn');
    const modal = document.getElementById('studentModal');
    const modalTitle = document.getElementById('modalTitle');
    const cancelBtn = document.getElementById('cancelBtn');
    const studentForm = document.getElementById('studentForm');
    const studentsBody = document.getElementById('studentsBody');
    const emptyState = document.getElementById('emptyState');
    const searchInput = document.getElementById('searchInput');
    const branchFilter = document.getElementById('branchFilter');
    const toast = document.getElementById('toast');
    const rollNumberInput = document.getElementById('roll_number');

    const profileModal = document.getElementById('profileModal');
    const closeProfileBtn = document.getElementById('closeProfileBtn');

    let isEditing = false;
    let studentsData = [];

    // Fetch and render students
    const fetchStudents = async () => {
        try {
            const res = await fetch('/api/students');
            studentsData = await res.json();
            applyFilters(); // Renders table and dashboard using current filters
        } catch (error) {
            showToast('Failed to load students', 'error');
        }
    };

    const renderTable = (data) => {
        studentsBody.innerHTML = '';
        if (data.length === 0) {
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
            data.forEach(student => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${student.roll_number}</td>
                    <td>${student.name}</td>
                    <td>${student.branch}</td>
                    <td>${student.year}</td>
                    <td>${student.cgpa}</td>
                    <td>
                        <button class="action-btn view-btn" data-roll="${student.roll_number}">View</button>
                        <button class="action-btn edit-btn" data-roll="${student.roll_number}">Edit</button>
                        <button class="action-btn delete-btn" data-roll="${student.roll_number}">Delete</button>
                    </td>
                `;
                studentsBody.appendChild(tr);
            });
            attachActionListeners();
        }
        updateDashboard(data);
    };

    const updateDashboard = (data) => {
        const total = data.length;
        document.getElementById('dashTotal').textContent = total;

        if (total === 0) {
            document.getElementById('dashCGPA').textContent = '0.0';
            document.getElementById('dashFees').textContent = '0';
            document.getElementById('dashAttendance').textContent = '0';
            return;
        }

        const sumCGPA = data.reduce((acc, curr) => acc + (parseFloat(curr.cgpa) || 0), 0);
        document.getElementById('dashCGPA').textContent = (sumCGPA / total).toFixed(1);

        const pendingFees = data.reduce((acc, curr) => {
            const totalF = parseFloat(curr.total_fees) || 0;
            const paidF = parseFloat(curr.fees_paid) || 0;
            return acc + (totalF - paidF);
        }, 0);
        document.getElementById('dashFees').textContent = pendingFees;

        const sumAttendance = data.reduce((acc, curr) => acc + (parseFloat(curr.attendance) || 0), 0);
        document.getElementById('dashAttendance').textContent = (sumAttendance / total).toFixed(1);
    };

    const applyFilters = () => {
        const term = searchInput.value.toLowerCase();
        const branch = branchFilter.value;

        const filtered = studentsData.filter(s => {
            const matchesSearch = s.roll_number.toLowerCase().includes(term) || s.name.toLowerCase().includes(term);
            const matchesBranch = branch === '' || s.branch === branch;
            return matchesSearch && matchesBranch;
        });

        renderTable(filtered);
    };

    searchInput.addEventListener('input', applyFilters);
    branchFilter.addEventListener('change', applyFilters);

    const attachActionListeners = () => {
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const roll = e.target.getAttribute('data-roll');
                const student = studentsData.find(s => s.roll_number === roll);
                openProfileModal(student);
            });
        });

        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const roll = e.target.getAttribute('data-roll');
                const student = studentsData.find(s => s.roll_number === roll);
                openModal(student);
            });
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const roll = e.target.getAttribute('data-roll');
                if (confirm(`Are you sure you want to delete student ${roll}?`)) {
                    try {
                        const res = await fetch(`/api/students/${roll}`, { method: 'DELETE' });
                        if (res.ok) {
                            showToast('Student deleted successfully');
                            fetchStudents();
                        } else {
                            const error = await res.json();
                            showToast(error.error, 'error');
                        }
                    } catch (error) {
                        showToast('Error deleting student', 'error');
                    }
                }
            });
        });
    };

    // Profile Modal Logic
    const openProfileModal = (student) => {
        document.getElementById('profileName').textContent = student.name;
        document.getElementById('profileRoll').textContent = student.roll_number;
        document.getElementById('profileBranch').textContent = student.branch;
        document.getElementById('profileYear').textContent = student.year;
        document.getElementById('profileCGPA').textContent = student.cgpa;
        document.getElementById('profileEmail').textContent = student.email;

        // Attendance
        const attendance = student.attendance || 0;
        document.getElementById('profileAttendance').textContent = attendance;
        document.getElementById('attendanceBar').style.width = `${attendance}%`;
        document.getElementById('attendanceBar').style.backgroundColor = attendance >= 75 ? '#10b981' : (attendance >= 50 ? '#f59e0b' : '#ef4444');

        // Fees
        const total = student.total_fees || 0;
        const paid = student.fees_paid || 0;
        const balance = total - paid;
        document.getElementById('profileTotalFees').textContent = total;
        document.getElementById('profileFeesPaid').textContent = paid;
        const balanceEl = document.getElementById('profileBalance');
        balanceEl.textContent = balance;
        balanceEl.style.color = balance > 0 ? '#ef4444' : '#10b981';

        // Marks
        const marksList = document.getElementById('profileMarksList');
        marksList.innerHTML = '';
        const marks = student.marks || {};
        if (Object.keys(marks).length === 0) {
            marksList.innerHTML = '<li><span>No marks available</span></li>';
        } else {
            for (const [subject, score] of Object.entries(marks)) {
                marksList.innerHTML += `<li><span>${subject.charAt(0).toUpperCase() + subject.slice(1)}</span> <strong>${score}</strong></li>`;
            }
        }

        profileModal.classList.remove('hidden');
    };

    closeProfileBtn.addEventListener('click', () => {
        profileModal.classList.add('hidden');
    });

    // Add/Edit Modal logic
    const openModal = (student = null) => {
        modal.classList.remove('hidden');
        if (student) {
            isEditing = true;
            modalTitle.textContent = 'Edit Student';
            rollNumberInput.value = student.roll_number;
            rollNumberInput.readOnly = true;
            document.getElementById('name').value = student.name;
            document.getElementById('branch').value = student.branch;
            document.getElementById('year').value = student.year;
            document.getElementById('cgpa').value = student.cgpa;
            document.getElementById('email').value = student.email;
            
            document.getElementById('attendance').value = student.attendance || '';
            document.getElementById('total_fees').value = student.total_fees || '';
            document.getElementById('fees_paid').value = student.fees_paid || '';

            const marks = student.marks || {};
            document.getElementById('mark_math').value = marks.math || '';
            document.getElementById('mark_science').value = marks.science || '';
            document.getElementById('mark_english').value = marks.english || '';
        } else {
            isEditing = false;
            modalTitle.textContent = 'Add Student';
            studentForm.reset();
            rollNumberInput.readOnly = false;
        }
    };

    const closeModal = () => {
        modal.classList.add('hidden');
        studentForm.reset();
    };

    addStudentBtn.addEventListener('click', () => openModal());
    cancelBtn.addEventListener('click', closeModal);

    // Form Submit (Add/Edit)
    studentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const payload = {
            roll_number: document.getElementById('roll_number').value,
            name: document.getElementById('name').value,
            branch: document.getElementById('branch').value,
            year: document.getElementById('year').value,
            cgpa: document.getElementById('cgpa').value,
            email: document.getElementById('email').value,
            attendance: document.getElementById('attendance').value || 0,
            total_fees: document.getElementById('total_fees').value || 0,
            fees_paid: document.getElementById('fees_paid').value || 0,
            marks: {
                math: document.getElementById('mark_math').value || 0,
                science: document.getElementById('mark_science').value || 0,
                english: document.getElementById('mark_english').value || 0
            }
        };

        const method = isEditing ? 'PUT' : 'POST';
        const url = isEditing ? `/api/students/${payload.roll_number}` : '/api/students';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            
            if (res.ok) {
                showToast(data.message);
                closeModal();
                fetchStudents();
            } else {
                showToast(data.error || 'An error occurred', 'error');
            }
        } catch (error) {
            showToast('Network error', 'error');
        }
    });

    // Toast Logic
    const showToast = (message, type = 'success') => {
        toast.textContent = message;
        toast.className = `toast ${type === 'error' ? 'error' : ''}`;
        
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    };

    // Init
    fetchStudents();
});
