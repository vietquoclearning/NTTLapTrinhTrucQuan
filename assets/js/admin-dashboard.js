// Admin Dashboard JavaScript
class AdminDashboard {
    constructor() {
        // Don't call init() immediately, wait for auth to be ready
    }

    init() {
        console.log('AdminDashboard init() called');
        this.checkAuth();
        this.loadDashboard();
        this.setupEventListeners();
    }

    // Check authentication
    checkAuth() {
        console.log('AdminDashboard checkAuth() called');
        
        if (typeof auth === 'undefined') {
            console.log('Auth object not ready, retrying...');
            setTimeout(() => this.checkAuth(), 100);
            return;
        }
        
        const currentUser = auth.getCurrentUser();
        console.log('Current user:', currentUser);
        
        if (!currentUser || currentUser.role !== 'admin') {
            console.log('User is not admin, redirecting to login...');
            if (!sessionStorage.getItem('redirecting')) {
                sessionStorage.setItem('redirecting', 'true');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 100);
            }
            return;
        }

        console.log('Admin authenticated successfully:', currentUser.name);
        sessionStorage.removeItem('redirecting');

        // Update user name in UI
        const userNameElement = document.getElementById('userName');
        const welcomeUserNameElement = document.getElementById('welcomeUserName');
        
        if (userNameElement) userNameElement.textContent = currentUser.name;
        if (welcomeUserNameElement) welcomeUserNameElement.textContent = currentUser.name;
    }

    // Load dashboard data
    loadDashboard() {
        this.updateStats();
    }

    // Update statistics
    updateStats() {
        const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        const patients = users.filter(user => user.role === 'patient').length;
        const doctors = users.filter(user => user.role === 'doctor').length;
        const totalAppointments = appointments.length;

        document.getElementById('totalPatients').textContent = patients;
        document.getElementById('totalDoctors').textContent = doctors;
        document.getElementById('totalAppointments').textContent = totalAppointments;
    }


    // Setup event listeners
    setupEventListeners() {
        // Add any additional event listeners here
    }



    // Show user management
    showUserManagement() {
        this.loadUsers();
        
        const modal = new bootstrap.Modal(document.getElementById('userManagementModal'));
        modal.show();
    }

    // Load users
    loadUsers() {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const container = document.getElementById('userList');
        
        if (users.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">Không có người dùng nào</p>';
            return;
        }

        container.innerHTML = users.map(user => `
            <div class="card mb-3 admin-user-card">
                <div class="card-body">
                    <!-- Dòng 1: Tên và mã bệnh nhân -->
                    <div class="row mb-2">
                        <div class="col-12">
                            <h6 class="mb-0">${user.name}${user.patientCode ? ` <span class="text-primary small"><strong>(${user.patientCode})</strong></span>` : ''}</h6>
                        </div>
                    </div>
                    <!-- Dòng 2: Email và các thông tin khác -->
                    <div class="row align-items-center">
                        <div class="col-md-4">
                            <p class="text-muted small mb-0">${user.email}</p>
                        </div>
                        <div class="col-md-2">
                            <span class="badge bg-primary">${this.getRoleDisplayName(user.role)}</span>
                        </div>
                        <div class="col-md-2">
                            <p class="text-muted small mb-0">${user.phone}</p>
                        </div>
                        <div class="col-md-1">
                            <p class="text-muted small mb-0">ID: ${user.id}</p>
                        </div>
                        <div class="col-md-3 text-end">
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteUser(${user.id})">
                                <i class="fas fa-trash me-1"></i>Xóa
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Get role display name
    getRoleDisplayName(role) {
        const roleMap = {
            'patient': 'Bệnh nhân',
            'doctor': 'Bác sĩ',
            'admin': 'Quản lý'
        };
        return roleMap[role] || role;
    }

    // Show add user form
    showAddUserForm() {
        // Reset form to initial state
        document.getElementById('addUserForm').reset();
        
        // Clear any validation states
        const formElements = document.querySelectorAll('#addUserForm .form-control, #addUserForm .form-select');
        formElements.forEach(element => {
            element.classList.remove('is-valid', 'is-invalid');
        });
        
        const modal = new bootstrap.Modal(document.getElementById('addUserModal'));
        modal.show();
    }

    // Add new user
    addNewUser() {
        const name = document.getElementById('newUserName').value;
        const email = document.getElementById('newUserEmail').value;
        const phone = document.getElementById('newUserPhone').value;
        const role = document.getElementById('newUserRole').value;
        const password = document.getElementById('newUserPassword').value;

        if (!name || !email || !phone || !role || !password) {
            this.showError('Vui lòng điền đầy đủ thông tin');
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showError('Email không hợp lệ');
            return;
        }

        // Validate phone format
        const phoneRegex = /^[0-9]{10,11}$/;
        if (!phoneRegex.test(phone)) {
            this.showError('Số điện thoại không hợp lệ');
            return;
        }

        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        // Check if email already exists
        if (users.find(u => u.email === email)) {
            this.showError('Email đã được sử dụng');
            return;
        }

        // Create new user
        const newUser = {
            id: users.length + 1,
            name,
            email,
            phone,
            password,
            role,
            patientCode: role === 'patient' ? this.generatePatientCode() : null
        };

        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));

        // Reset form
        document.getElementById('addUserForm').reset();
        
        // Clear any validation states
        const formElements = document.querySelectorAll('#addUserForm .form-control, #addUserForm .form-select');
        formElements.forEach(element => {
            element.classList.remove('is-valid', 'is-invalid');
        });

        // Close modal and show success
        const modal = bootstrap.Modal.getInstance(document.getElementById('addUserModal'));
        modal.hide();

        this.showSuccess('Thêm người dùng thành công');
        
        // Reload user list
        setTimeout(() => {
            this.loadUsers();
        }, 1000);
    }


    // Show specialty management
    showSpecialtyManagement() {
        this.loadSpecialties();
        
        const modal = new bootstrap.Modal(document.getElementById('specialtyManagementModal'));
        modal.show();
    }

    // Load specialties
    loadSpecialties() {
        const specialties = app.specialties;
        const container = document.getElementById('specialtyList');
        
        if (specialties.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">Không có chuyên khoa nào</p>';
            return;
        }

        container.innerHTML = specialties.map(specialty => `
            <div class="card mb-3">
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-md-1">
                            <i class="${specialty.icon} fa-2x text-primary"></i>
                        </div>
                        <div class="col-md-6">
                            <h6 class="mb-1">${specialty.name}</h6>
                            <p class="text-muted small mb-0">${specialty.description}</p>
                        </div>
                        <div class="col-md-3">
                            <small class="text-muted">ID: ${specialty.id}</small>
                        </div>
                        <div class="col-md-2 text-end">
                            <button class="btn btn-sm btn-outline-primary me-1" onclick="editSpecialty(${specialty.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteSpecialty(${specialty.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Show add specialty form
    showAddSpecialtyForm() {
        // Reset form
        document.getElementById('addSpecialtyForm').reset();
        document.getElementById('specialtyId').value = '';
        document.getElementById('addSpecialtyModalTitle').innerHTML = '<i class="fas fa-plus me-2"></i>Thêm chuyên khoa mới';
        
        // Clear any validation states
        const formElements = document.querySelectorAll('#addSpecialtyForm .form-control, #addSpecialtyForm .form-select');
        formElements.forEach(element => {
            element.classList.remove('is-valid', 'is-invalid');
        });
        
        const modal = new bootstrap.Modal(document.getElementById('addSpecialtyModal'));
        modal.show();
    }

    // Show edit specialty form
    showEditSpecialtyForm(specialtyId) {
        const specialty = app.specialties.find(s => s.id === specialtyId);
        if (!specialty) {
            this.showError('Không tìm thấy chuyên khoa');
            return;
        }

        // Fill form with existing data
        document.getElementById('specialtyId').value = specialty.id;
        document.getElementById('specialtyName').value = specialty.name;
        document.getElementById('specialtyIcon').value = specialty.icon;
        document.getElementById('specialtyDescription').value = specialty.description;
        document.getElementById('addSpecialtyModalTitle').innerHTML = '<i class="fas fa-edit me-2"></i>Sửa chuyên khoa';
        
        const modal = new bootstrap.Modal(document.getElementById('addSpecialtyModal'));
        modal.show();
    }

    // Save specialty (add or edit)
    saveSpecialty() {
        const id = document.getElementById('specialtyId').value;
        const name = document.getElementById('specialtyName').value;
        const icon = document.getElementById('specialtyIcon').value;
        const description = document.getElementById('specialtyDescription').value;

        if (!name || !icon || !description) {
            this.showError('Vui lòng điền đầy đủ thông tin');
            return;
        }

        // Validate icon format
        if (!icon.startsWith('fas fa-') && !icon.startsWith('far fa-') && !icon.startsWith('fab fa-')) {
            this.showError('Icon phải bắt đầu bằng fas fa-, far fa- hoặc fab fa-');
            return;
        }

        if (id) {
            // Edit existing specialty
            this.updateSpecialty(parseInt(id), name, icon, description);
        } else {
            // Add new specialty
            this.addSpecialty(name, icon, description);
        }
    }

    // Add new specialty
    addSpecialty(name, icon, description) {
        // Check if name already exists
        if (app.specialties.find(s => s.name === name)) {
            this.showError('Tên chuyên khoa đã tồn tại');
            return;
        }

        const newSpecialty = {
            id: Math.max(...app.specialties.map(s => s.id)) + 1,
            name,
            icon,
            description
        };

        app.specialties.push(newSpecialty);
        this.saveSpecialtiesToStorage();

        // Reset form
        document.getElementById('addSpecialtyForm').reset();
        document.getElementById('specialtyId').value = '';
        
        // Clear any validation states
        const formElements = document.querySelectorAll('#addSpecialtyForm .form-control, #addSpecialtyForm .form-select');
        formElements.forEach(element => {
            element.classList.remove('is-valid', 'is-invalid');
        });

        // Close modal and show success
        const modal = bootstrap.Modal.getInstance(document.getElementById('addSpecialtyModal'));
        modal.hide();

        this.showSuccess('Thêm chuyên khoa thành công');
        
        // Reload specialty list
        setTimeout(() => {
            this.loadSpecialties();
        }, 1000);
    }

    // Update specialty
    updateSpecialty(id, name, icon, description) {
        const specialtyIndex = app.specialties.findIndex(s => s.id === id);
        if (specialtyIndex === -1) {
            this.showError('Không tìm thấy chuyên khoa');
            return;
        }

        // Check if name already exists (excluding current specialty)
        if (app.specialties.find(s => s.name === name && s.id !== id)) {
            this.showError('Tên chuyên khoa đã tồn tại');
            return;
        }

        app.specialties[specialtyIndex] = {
            ...app.specialties[specialtyIndex],
            name,
            icon,
            description
        };

        this.saveSpecialtiesToStorage();

        // Reset form
        document.getElementById('addSpecialtyForm').reset();
        document.getElementById('specialtyId').value = '';
        
        // Clear any validation states
        const formElements = document.querySelectorAll('#addSpecialtyForm .form-control, #addSpecialtyForm .form-select');
        formElements.forEach(element => {
            element.classList.remove('is-valid', 'is-invalid');
        });

        // Close modal and show success
        const modal = bootstrap.Modal.getInstance(document.getElementById('addSpecialtyModal'));
        modal.hide();

        this.showSuccess('Cập nhật chuyên khoa thành công');
        
        // Reload specialty list
        setTimeout(() => {
            this.loadSpecialties();
        }, 1000);
    }

    // Delete specialty
    deleteSpecialty(id) {
        const specialty = app.specialties.find(s => s.id === id);
        if (!specialty) {
            this.showError('Không tìm thấy chuyên khoa');
            return;
        }

        this.showConfirmation(`Bạn có chắc chắn muốn xóa chuyên khoa "${specialty.name}"?`, () => {
            app.specialties = app.specialties.filter(s => s.id !== id);
            this.saveSpecialtiesToStorage();
            
            this.showSuccess('Đã xóa chuyên khoa thành công');
            this.loadSpecialties();
        });
    }

    // Save specialties to localStorage
    saveSpecialtiesToStorage() {
        localStorage.setItem('specialties', JSON.stringify(app.specialties));
    }

    // Show success message
    showSuccess(message) {
        Swal.fire({
            icon: 'success',
            title: 'Thành công!',
            text: message,
            confirmButtonText: 'OK',
            confirmButtonColor: '#007bff',
            customClass: {
                container: 'swal2-high-zindex',
                popup: 'swal2-high-zindex'
            }
        });
    }

    // Show error message
    showError(message) {
        Swal.fire({
            icon: 'error',
            title: 'Lỗi!',
            text: message,
            confirmButtonText: 'OK',
            confirmButtonColor: '#dc3545',
            customClass: {
                container: 'swal2-high-zindex',
                popup: 'swal2-high-zindex'
            }
        });
    }

    // Show confirmation dialog
    showConfirmation(message, callback) {
        Swal.fire({
            title: 'Xác nhận',
            text: message,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Đồng ý',
            cancelButtonText: 'Hủy',
            confirmButtonColor: '#007bff',
            cancelButtonColor: '#6c757d',
            customClass: {
                container: 'swal2-high-zindex',
                popup: 'swal2-high-zindex'
            }
        }).then((result) => {
            if (result.isConfirmed && callback) {
                callback();
            }
        });
    }

    // Generate patient code with format BN-YYMMDD0001
    generatePatientCode() {
        const now = new Date();
        const year = now.getFullYear().toString().slice(-2); // YY
        const month = (now.getMonth() + 1).toString().padStart(2, '0'); // MM
        const day = now.getDate().toString().padStart(2, '0'); // DD
        
        // Get existing users to find the next sequence number
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const todayCode = `BN-${year}${month}${day}`;
        
        // Find the highest sequence number for today
        const todayPatients = users.filter(user => 
            user.role === 'patient' && 
            user.patientCode && 
            user.patientCode.startsWith(todayCode)
        );
        
        let nextSequence = 1;
        if (todayPatients.length > 0) {
            const sequences = todayPatients.map(user => {
                const sequence = user.patientCode.slice(-4);
                return parseInt(sequence);
            });
            nextSequence = Math.max(...sequences) + 1;
        }
        
        return `${todayCode}${nextSequence.toString().padStart(4, '0')}`;
    }

}

// Global functions for onclick handlers
function showUserManagement() {
    adminDashboard.showUserManagement();
}

function showSpecialtyManagement() {
    adminDashboard.showSpecialtyManagement();
}

function showAddSpecialtyForm() {
    adminDashboard.showAddSpecialtyForm();
}

function editSpecialty(specialtyId) {
    adminDashboard.showEditSpecialtyForm(specialtyId);
}

function deleteSpecialty(specialtyId) {
    adminDashboard.deleteSpecialty(specialtyId);
}

function saveSpecialty() {
    adminDashboard.saveSpecialty();
}

function showAddUserForm() {
    adminDashboard.showAddUserForm();
}

function addNewUser() {
    adminDashboard.addNewUser();
}

function deleteUser(userId) {
    adminDashboard.showConfirmation('Bạn có chắc chắn muốn xóa người dùng này?', () => {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const userToDelete = users.find(user => user.id === userId);
        
        if (!userToDelete) {
            adminDashboard.showError('Không tìm thấy người dùng');
            return;
        }
        
        // Remove user from users array
        const updatedUsers = users.filter(user => user.id !== userId);
        localStorage.setItem('users', JSON.stringify(updatedUsers));
        
        // If deleting a patient, also remove their appointments
        if (userToDelete.role === 'patient') {
            const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
            const updatedAppointments = appointments.filter(apt => apt.patientId !== userId);
            localStorage.setItem('appointments', JSON.stringify(updatedAppointments));
            console.log(`Removed ${appointments.length - updatedAppointments.length} appointments for patient ${userToDelete.name}`);
        }
        
        // If deleting a doctor, also remove their appointments
        if (userToDelete.role === 'doctor') {
            const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
            const updatedAppointments = appointments.filter(apt => apt.doctorId !== userId);
            localStorage.setItem('appointments', JSON.stringify(updatedAppointments));
            console.log(`Removed ${appointments.length - updatedAppointments.length} appointments for doctor ${userToDelete.name}`);
        }
        
        adminDashboard.showSuccess(`Đã xóa người dùng ${userToDelete.name} thành công`);
        adminDashboard.loadUsers();
    });
}


// Global logout function
function logout() {
    console.log('Logout function called');
    localStorage.removeItem('currentUser');
    sessionStorage.removeItem('redirecting');
    sessionStorage.removeItem('hospitalSelectionShown');
    alert('Đã đăng xuất thành công!');
    window.location.href = 'index.html';
}

// Reset appointment data function
function resetAppointmentData() {
    if (confirm('Bạn có chắc muốn reset lại dữ liệu lịch khám? Hành động này không thể hoàn tác.')) {
        console.log('=== RESET APPOINTMENT DATA ===');
        
        // Clear appointments from localStorage
        localStorage.removeItem('appointments');
        console.log('Removed appointments from localStorage');
        
        // Force app to reload sample data
        if (typeof app !== 'undefined' && app.loadAppointments) {
            app.loadAppointments();
            console.log('Forced app to reload sample data');
        }
        
        // Reload dashboard data if available
        if (typeof adminDashboard !== 'undefined' && adminDashboard.loadDashboard) {
            setTimeout(() => {
                adminDashboard.loadDashboard();
                console.log('Reloaded admin dashboard');
            }, 100);
        }
        
        alert('Đã reset dữ liệu lịch khám thành công!');
        location.reload();
    }
}

// Debug function to check current data
function debugData() {
    console.log('=== DEBUG DATA ===');
    
    // Collect all debug information
    const currentUser = auth.getCurrentUser();
    const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const hospitals = app.hospitals;
    const specialties = app.specialties;
    const doctors = app.doctors;
    
    // Log to console for developers
    console.log('Current user:', currentUser);
    console.log('All appointments in localStorage:', appointments);
    console.log('All users in localStorage:', users);
    console.log('All hospitals:', hospitals);
    console.log('All specialties:', specialties);
    console.log('All doctors:', doctors);
    
    if (typeof adminDashboard !== 'undefined') {
        console.log('Admin dashboard instance:', adminDashboard);
    }
    
    // Create debug information for popup
    const debugInfo = `
        <div style="text-align: left; font-family: monospace; font-size: 12px;">
            <h6><strong>🔍 THÔNG TIN DEBUG HỆ THỐNG</strong></h6>
            <hr>
            
            <div style="margin-bottom: 15px;">
                <strong>👤 Người dùng hiện tại:</strong><br>
                ${currentUser ? `
                    - ID: ${currentUser.id}<br>
                    - Tên: ${currentUser.name}<br>
                    - Email: ${currentUser.email}<br>
                    - Vai trò: ${currentUser.role}
                ` : 'Chưa đăng nhập'}
            </div>
            
            <div style="margin-bottom: 15px;">
                <strong>📅 Lịch khám (${appointments.length}):</strong><br>
                ${appointments.length > 0 ? 
                    appointments.slice(0, 3).map(apt => 
                        `- ${apt.patientName} → ${apt.doctorName} (${apt.date} ${apt.time})`
                    ).join('<br>') + (appointments.length > 3 ? '<br>...' : '') 
                    : 'Không có dữ liệu'}
            </div>
            
            <div style="margin-bottom: 15px;">
                <strong>👥 Người dùng (${users.length}):</strong><br>
                ${users.length > 0 ? 
                    users.slice(0, 3).map(user => 
                        `- ${user.name} (${user.role})`
                    ).join('<br>') + (users.length > 3 ? '<br>...' : '') 
                    : 'Không có dữ liệu'}
            </div>
            
            <div style="margin-bottom: 15px;">
                <strong>🏥 Bệnh viện (${hospitals.length}):</strong><br>
                ${hospitals.length > 0 ? 
                    hospitals.slice(0, 3).map(hospital => 
                        `- ${hospital.name}`
                    ).join('<br>') + (hospitals.length > 3 ? '<br>...' : '') 
                    : 'Không có dữ liệu'}
            </div>
            
            <div style="margin-bottom: 15px;">
                <strong>🩺 Chuyên khoa (${specialties.length}):</strong><br>
                ${specialties.length > 0 ? 
                    specialties.slice(0, 3).map(specialty => 
                        `- ${specialty.name}`
                    ).join('<br>') + (specialties.length > 3 ? '<br>...' : '') 
                    : 'Không có dữ liệu'}
            </div>
            
            <div style="margin-bottom: 15px;">
                <strong>👨‍⚕️ Bác sĩ (${doctors.length}):</strong><br>
                ${doctors.length > 0 ? 
                    doctors.slice(0, 3).map(doctor => 
                        `- ${doctor.name} (${doctor.specialty})`
                    ).join('<br>') + (doctors.length > 3 ? '<br>...' : '') 
                    : 'Không có dữ liệu'}
            </div>
            
            <hr>
            <div style="color: #28a745; font-weight: bold;">
                ✅ Xử lý hoàn tất - Dữ liệu đã được kiểm tra và ghi vào console
            </div>
        </div>
    `;
    
    // Show debug information in popup
    Swal.fire({
        title: 'Debug Dữ Liệu Hệ Thống',
        html: debugInfo,
        width: '600px',
        confirmButtonText: 'Đóng',
        confirmButtonColor: '#007bff',
        customClass: {
            container: 'swal2-high-zindex',
            popup: 'swal2-high-zindex'
        }
    });
}

// Initialize admin dashboard
let adminDashboard;

// Wait for both DOM, auth, and app to be ready
function initializeAdminDashboard() {
    console.log('Initializing admin dashboard...');
    console.log('auth object:', typeof auth !== 'undefined' ? 'exists' : 'undefined');
    console.log('app object:', typeof app !== 'undefined' ? 'exists' : 'undefined');
    
    // Try to create auth object if it doesn't exist
    if (typeof auth === 'undefined') {
        if (typeof AuthSystem !== 'undefined') {
            console.log('Creating auth object as fallback...');
            window.auth = new AuthSystem();
        } else {
            console.log('AuthSystem not available, creating minimal auth object...');
            window.auth = {
                getCurrentUser: function() {
                    const userStr = localStorage.getItem('currentUser');
                    return userStr ? JSON.parse(userStr) : null;
                },
                isLoggedIn: function() {
                    return this.getCurrentUser() !== null;
                }
            };
        }
    }
    
    if (typeof auth !== 'undefined' && typeof app !== 'undefined') {
        console.log('Creating admin dashboard...');
        adminDashboard = new AdminDashboard();
        console.log('Admin dashboard created successfully');
        // Now call init() after auth is ready
        adminDashboard.init();
    } else {
        console.log('Auth or app not ready, retrying...');
        // Retry after a short delay
        setTimeout(initializeAdminDashboard, 100);
    }
}

// Start initialization after a delay to ensure auth.js and app.js are loaded
setTimeout(() => {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeAdminDashboard);
    } else {
        initializeAdminDashboard();
    }
}, 500); 