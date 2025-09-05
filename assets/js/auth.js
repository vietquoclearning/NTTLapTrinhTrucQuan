// Authentication System
class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        this.loadUsers();
        this.setupEventListeners();
        this.checkAuthStatus();
    }

    // Load users from localStorage
    loadUsers() {
        const users = localStorage.getItem('users');
        if (!users) {
            // Initialize with default users
            const defaultUsers = [
                {
                    id: 1,
                    name: 'Nguyễn Văn A',
                    email: 'patient@example.com',
                    password: '123456',
                    phone: '0123456789',
                    role: 'patient',
                    patientCode: 'BN-2412010001'
                },
                {
                    id: 2,
                    name: 'Bác sĩ Trần Thị B',
                    email: 'doctor@example.com',
                    password: '123456',
                    phone: '0987654321',
                    role: 'doctor',
                    specialty: 'Tim mạch',
                    hospitalIds: [1, 2] // Có thể làm việc ở nhiều bệnh viện
                },
                {
                    id: 3,
                    name: 'Bác sĩ Nguyễn Văn C',
                    email: 'doctor2@example.com',
                    password: '123456',
                    phone: '0987654322',
                    role: 'doctor',
                    specialty: 'Nội khoa',
                    hospitalIds: [1]
                },
                {
                    id: 4,
                    name: 'Quản lý Lê Văn C',
                    email: 'admin@example.com',
                    password: '123456',
                    phone: '0111222333',
                    role: 'admin'
                }
            ];
            localStorage.setItem('users', JSON.stringify(defaultUsers));
        } else {
            // Ensure all patients have patient codes
            this.ensureAllPatientsHaveCodes();
        }
    }

    // Setup event listeners
    setupEventListeners() {
        // Login button
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showLoginModal();
            });
        }

        // Register button
        const registerBtn = document.getElementById('registerBtn');
        if (registerBtn) {
            registerBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showRegisterModal();
            });
        }

        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // Register form
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }
    }

    // Show login modal
    showLoginModal() {
        const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
        loginModal.show();
    }

    // Show register modal
    showRegisterModal() {
        const registerModal = new bootstrap.Modal(document.getElementById('registerModal'));
        registerModal.show();
    }

    // Handle login
    handleLogin() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const role = document.getElementById('loginRole').value;

        if (!email || !password || !role) {
            this.showAlert('Vui lòng điền đầy đủ thông tin!', 'warning');
            return;
        }

        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => 
            u.email === email && 
            u.password === password && 
            u.role === role
        );

        if (user) {
            this.login(user);
        } else {
            this.showAlert('Thông tin đăng nhập không chính xác!', 'error');
        }
    }

    // Handle register
    handleRegister() {
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const phone = document.getElementById('registerPhone').value;
        const password = document.getElementById('registerPassword').value;
        const role = document.getElementById('registerRole').value;

        if (!name || !email || !phone || !password || !role) {
            this.showAlert('Vui lòng điền đầy đủ thông tin!', 'warning');
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showAlert('Email không hợp lệ!', 'error');
            return;
        }

        // Validate phone format
        const phoneRegex = /^[0-9]{10,11}$/;
        if (!phoneRegex.test(phone)) {
            this.showAlert('Số điện thoại không hợp lệ!', 'error');
            return;
        }

        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        // Check if email already exists
        if (users.find(u => u.email === email)) {
            this.showAlert('Email đã được sử dụng!', 'error');
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

        this.showAlert('Đăng ký thành công! Vui lòng đăng nhập.', 'success');
        
        // Close register modal and show login modal
        const registerModal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
        registerModal.hide();
        
        setTimeout(() => {
            this.showLoginModal();
        }, 1000);
    }

    // Login user
    login(user) {
        this.currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        // Close login modal
        const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
        loginModal.hide();

        this.showAlert(`Chào mừng ${user.name}!`, 'success');
        
        // Redirect based on role
        setTimeout(() => {
            this.redirectToDashboard();
        }, 1000);
    }

    // Logout user
    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        
        // Show success message and redirect
        Swal.fire({
            icon: 'success',
            title: 'Thành công!',
            text: 'Đã đăng xuất thành công!',
            confirmButtonText: 'OK',
            confirmButtonColor: '#007bff',
            customClass: {
                container: 'swal2-high-zindex',
                popup: 'swal2-high-zindex'
            }
        }).then(() => {
            window.location.href = 'index.html';
        });
    }

    // Check authentication status
    checkAuthStatus() {
        const user = localStorage.getItem('currentUser');
        if (user) {
            this.currentUser = JSON.parse(user);
            // Only redirect if we're not already on the correct dashboard
            const currentPage = window.location.pathname.split('/').pop();
            const shouldRedirect = this.shouldRedirectToDashboard(currentPage);
            if (shouldRedirect) {
                this.redirectToDashboard();
            }
        }
    }
    
    // Check if we should redirect to dashboard
    shouldRedirectToDashboard(currentPage) {
        if (!this.currentUser) return false;
        
        switch (this.currentUser.role) {
            case 'patient':
                return currentPage !== 'patient-dashboard.html';
            case 'doctor':
                return currentPage !== 'doctor-dashboard.html';
            case 'admin':
                return currentPage !== 'admin-dashboard.html';
            default:
                return true;
        }
    }

    // Redirect to appropriate dashboard
    redirectToDashboard() {
        if (!this.currentUser) return;

        switch (this.currentUser.role) {
            case 'patient':
                window.location.href = 'patient-dashboard.html';
                break;
            case 'doctor':
                // Check if app is ready
                if (typeof app === 'undefined') {
                    console.log('App not ready, retrying redirect...');
                    setTimeout(() => this.redirectToDashboard(), 100);
                    return;
                }
                
                // Doctor goes directly to dashboard (no hospital selection needed)
                this.currentUser.selectedHospitalId = 1; // Fixed VTK Hospital ID
                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                window.location.href = 'doctor-dashboard.html';
                break;
            case 'admin':
                window.location.href = 'admin-dashboard.html';
                break;
        }
    }



    // Show alert using SweetAlert2
    showAlert(message, type = 'info') {
        const iconMap = {
            success: 'success',
            error: 'error',
            warning: 'warning',
            info: 'info'
        };

        Swal.fire({
            icon: iconMap[type] || 'info',
            title: type === 'success' ? 'Thành công!' : 
                   type === 'error' ? 'Lỗi!' : 
                   type === 'warning' ? 'Cảnh báo!' : 'Thông báo!',
            text: message,
            confirmButtonText: 'OK',
            confirmButtonColor: '#007bff',
            customClass: {
                container: 'swal2-high-zindex',
                popup: 'swal2-high-zindex'
            }
        });
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Check if user is logged in
    isLoggedIn() {
        return this.currentUser !== null;
    }

    // Check if user has specific role
    hasRole(role) {
        return this.currentUser && this.currentUser.role === role;
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
            }).filter(seq => !isNaN(seq)); // Filter out invalid sequences
            
            if (sequences.length > 0) {
                nextSequence = Math.max(...sequences) + 1;
            }
        }
        
        // Add timestamp to ensure uniqueness when generating multiple codes at once
        const timestamp = Date.now().toString().slice(-3); // Last 3 digits of timestamp
        const uniqueSequence = (nextSequence * 1000 + parseInt(timestamp)) % 10000;
        
        return `${todayCode}${uniqueSequence.toString().padStart(4, '0')}`;
    }

    // Ensure all patients have patient codes
    ensureAllPatientsHaveCodes() {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        let hasUpdates = false;
        const usedCodes = new Set();
        
        // First, collect all existing patient codes
        users.forEach(user => {
            if (user.role === 'patient' && user.patientCode) {
                usedCodes.add(user.patientCode);
            }
        });
        
        // Then, generate codes for patients without codes
        users.forEach(user => {
            if (user.role === 'patient' && !user.patientCode) {
                let newCode;
                do {
                    newCode = this.generatePatientCode();
                } while (usedCodes.has(newCode));
                
                user.patientCode = newCode;
                usedCodes.add(newCode);
                hasUpdates = true;
                console.log(`Added patient code for ${user.name}: ${user.patientCode}`);
            }
        });
        
        if (hasUpdates) {
            localStorage.setItem('users', JSON.stringify(users));
            console.log('Updated users with missing patient codes');
        }
    }
}

// Global function to toggle password visibility
function togglePasswordVisibility(inputId) {
    const passwordInput = document.getElementById(inputId);
    const iconElement = document.getElementById(inputId + 'Icon');
    
    if (passwordInput && iconElement) {
        if (passwordInput.type === 'password') {
            // Show password
            passwordInput.type = 'text';
            iconElement.classList.remove('fa-eye');
            iconElement.classList.add('fa-eye-slash');
        } else {
            // Hide password
            passwordInput.type = 'password';
            iconElement.classList.remove('fa-eye-slash');
            iconElement.classList.add('fa-eye');
        }
    }
}

// Initialize authentication system
let auth;

// Function to ensure auth is ready
function ensureAuthReady() {
    if (typeof auth === 'undefined') {
        auth = new AuthSystem();
    }
    return auth;
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        auth = new AuthSystem();
    });
} else {
    auth = new AuthSystem();
} 