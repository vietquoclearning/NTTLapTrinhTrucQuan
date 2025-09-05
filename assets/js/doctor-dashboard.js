// Doctor Dashboard JavaScript
class DoctorDashboard {
    constructor() {
        // Sửa lỗi timezone - sử dụng local date thay vì UTC
        const todayDate = new Date();
        const year = todayDate.getFullYear();
        const month = String(todayDate.getMonth() + 1).padStart(2, '0');
        const day = String(todayDate.getDate()).padStart(2, '0');
        this.currentDate = `${year}-${month}-${day}`;
        this.selectedAppointment = null;
        // Don't call init() immediately, wait for auth to be ready
    }

    init() {
        console.log('DoctorDashboard init() called');
        this.checkAuth();
        this.loadDashboard();
        this.setupEventListeners();
        this.setDefaultDate();
    }

    // Check authentication
    checkAuth() {
        console.log('DoctorDashboard checkAuth() called');
        
        if (typeof auth === 'undefined') {
            console.log('Auth object not ready, retrying...');
            setTimeout(() => this.checkAuth(), 100);
            return;
        }
        
        const currentUser = auth.getCurrentUser();
        console.log('Current user:', currentUser);
        
        if (!currentUser || currentUser.role !== 'doctor') {
            console.log('User is not doctor, redirecting to login...');
            if (!sessionStorage.getItem('redirecting')) {
                sessionStorage.setItem('redirecting', 'true');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 100);
            }
            return;
        }
        
        this.currentUser = currentUser;
        
        // Hospital is fixed as VTK Hospital
        this.currentUser.selectedHospitalId = 1;

        console.log('Doctor authenticated successfully:', currentUser.name);
        sessionStorage.removeItem('redirecting');

        // Update user name in UI
        const userNameElement = document.getElementById('userName');
        const welcomeUserNameElement = document.getElementById('welcomeUserName');
        
        if (userNameElement) userNameElement.textContent = currentUser.name;
        if (welcomeUserNameElement) welcomeUserNameElement.textContent = currentUser.name;
        
        // Hospital is fixed as VTK Hospital
        // No need to update hospital info dynamically
    }

    // Set default date to today
    setDefaultDate() {
        document.getElementById('dateFilter').value = this.currentDate;
    }

    // Load dashboard data
    loadDashboard() {
        console.log('=== LOAD DASHBOARD ===');
        const currentUser = auth.getCurrentUser();
        console.log('Current user:', currentUser);
        
        const appointments = app.getAppointments(currentUser.id, 'doctor');
        console.log('Appointments for doctor ID', currentUser.id, ':', appointments);
        
        this.updateStats(appointments);
        this.loadAppointments(this.currentDate);
    }

    // Update statistics
    updateStats(appointments) {
        console.log('=== UPDATE STATS ===');
        console.log('All appointments:', appointments);
        
        // Sửa lỗi timezone - sử dụng local date thay vì UTC
        const todayDate = new Date();
        const year = todayDate.getFullYear();
        const month = String(todayDate.getMonth() + 1).padStart(2, '0');
        const day = String(todayDate.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;
        const todayAppointments = appointments.filter(apt => apt.date === todayStr);
        
        console.log('Today:', todayStr);
        console.log('Today appointments:', todayAppointments);
        
        // Calculate week appointments (next 7 days from today)
        const weekStart = new Date();
        weekStart.setHours(0, 0, 0, 0); // Start of today
        const weekEnd = new Date();
        weekEnd.setDate(weekEnd.getDate() + 6); // Next 7 days
        weekEnd.setHours(23, 59, 59, 999); // End of 7th day
        
        const weekAppointments = appointments.filter(apt => {
            const aptDate = new Date(apt.date + 'T00:00:00'); // Force local time
            return aptDate >= weekStart && aptDate <= weekEnd;
        });
        
        console.log('Week range:', weekStart, 'to', weekEnd);
        console.log('Week appointments:', weekAppointments);

        const completed = appointments.filter(apt => apt.status === 'completed').length;
        
        // Get unique patients
        const uniquePatients = new Set(appointments.map(apt => apt.patientId)).size;
        
        console.log('Stats:', {
            today: todayAppointments.length,
            week: weekAppointments.length,
            completed: completed,
            patients: uniquePatients
        });

        document.getElementById('todayCount').textContent = todayAppointments.length;
        document.getElementById('weekCount').textContent = weekAppointments.length;
        document.getElementById('completedCount').textContent = completed;
        document.getElementById('totalPatients').textContent = uniquePatients;
    }

    // Load appointments for a specific date
    loadAppointments(date) {
        console.log('=== LOAD APPOINTMENTS ===');
        console.log('Loading appointments for date:', date);
        
        const currentUser = auth.getCurrentUser();
        const allAppointments = app.getAppointments(currentUser.id, 'doctor');
        console.log('All appointments:', allAppointments);
        
        // Update patient codes for appointments that don't have them
        this.updateMissingPatientCodes(allAppointments);
        
        const appointments = allAppointments.filter(apt => apt.date === date);
        console.log('Filtered appointments for date', date, ':', appointments);
        
        const container = document.getElementById('appointmentsList');
        const titleElement = document.getElementById('appointmentsTitle');
        
        // Update title
        if (titleElement) {
            titleElement.innerHTML = `<i class="fas fa-calendar-alt me-2"></i>Lịch khám ngày ${app.formatDate(date)}`;
        }
        
        if (appointments.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-calendar-times fa-3x text-muted mb-3"></i>
                    <p class="text-muted">Không có lịch khám nào vào ngày ${app.formatDate(date)}</p>
                </div>
            `;
            return;
        }

        // Sort appointments by time
        appointments.sort((a, b) => a.time.localeCompare(b.time));

        container.innerHTML = appointments.map(apt => {
            console.log('Rendering appointment:', apt);
            console.log('Patient code:', apt.patientCode);
            
            return `
            <div class="appointment-item ${apt.status} mb-3">
                <div class="row align-items-center">
                    <div class="col-md-2">
                        <div class="text-center">
                            <div class="h5 text-primary mb-0">${apt.time}</div>
                            <small class="text-muted">${app.formatDate(apt.date)}</small>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <h6 class="mb-1">${apt.patientName}</h6>
                        ${apt.patientCode ? `<p class="text-primary small mb-1"><strong>Mã BN: ${apt.patientCode}</strong></p>` : '<p class="text-warning small mb-1"><em>Chưa có mã BN</em></p>'}
                        <p class="text-muted mb-1">${apt.specialty}</p>
                        ${apt.notes ? `<p class="text-muted small mb-0"><i class="fas fa-sticky-note me-1"></i>${apt.notes}</p>` : ''}
                    </div>
                    <div class="col-md-2">
                        ${app.getStatusBadge(apt.status)}
                    </div>
                    <div class="col-md-2 text-end">
                        <button class="btn btn-sm btn-outline-primary" onclick="showAppointmentDetail(${apt.id})">
                            <i class="fas fa-eye me-1"></i>Chi tiết
                        </button>
                    </div>
                </div>
            </div>
        `;
        }).join('');
    }

    // Setup event listeners
    setupEventListeners() {
        // Complete appointment button
        document.getElementById('completeAppointmentBtn').addEventListener('click', () => {
            this.completeAppointment();
        });

        // Reschedule appointment button
        document.getElementById('rescheduleAppointmentBtn').addEventListener('click', () => {
            this.showRescheduleModal();
        });

        // Set minimum date for reschedule
        // Sửa lỗi timezone - sử dụng local date thay vì UTC
        const todayDate = new Date();
        const year = todayDate.getFullYear();
        const month = String(todayDate.getMonth() + 1).padStart(2, '0');
        const day = String(todayDate.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;
        document.getElementById('newDate').min = todayStr;
    }

    // Show appointment detail
    showAppointmentDetail(appointmentId) {
        const currentUser = auth.getCurrentUser();
        const allAppointments = app.getAppointments(currentUser.id, 'doctor');
        const appointment = allAppointments.find(apt => apt.id === appointmentId);
        
        if (!appointment) {
            app.showError('Không tìm thấy lịch khám');
            return;
        }

        this.selectedAppointment = appointment;

        const container = document.getElementById('appointmentDetail');
        container.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <h6 class="text-primary">Thông tin bệnh nhân</h6>
                    <p><strong>Họ tên:</strong> ${appointment.patientName}</p>
                    ${appointment.patientCode ? `<p><strong>Mã bệnh nhân:</strong> <span class="text-primary fw-bold">${appointment.patientCode}</span></p>` : ''}
                    <p><strong>Chuyên khoa:</strong> ${appointment.specialty}</p>
                    <p><strong>Ngày khám:</strong> ${app.formatDate(appointment.date)}</p>
                    <p><strong>Giờ khám:</strong> ${appointment.time}</p>
                    <p><strong>Trạng thái:</strong> ${app.getStatusBadge(appointment.status)}</p>
                </div>
                <div class="col-md-6">
                    <h6 class="text-primary">Thông tin khám</h6>
                    ${appointment.notes ? `<p><strong>Ghi chú:</strong> ${appointment.notes}</p>` : '<p><em>Không có ghi chú</em></p>'}
                    ${appointment.rating ? `
                        <div class="mt-3">
                            <h6 class="text-primary">Đánh giá của bệnh nhân</h6>
                            <div class="mb-2">
                                <i class="fas fa-star text-warning"></i>
                                <span class="text-muted">${appointment.rating}/5</span>
                            </div>
                            ${appointment.review ? `<p class="text-muted">"${appointment.review}"</p>` : ''}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        // Show/hide action buttons based on status
        const completeBtn = document.getElementById('completeAppointmentBtn');
        const rescheduleBtn = document.getElementById('rescheduleAppointmentBtn');

        if (appointment.status === 'upcoming') {
            completeBtn.style.display = 'inline-block';
            rescheduleBtn.style.display = 'inline-block';
        } else {
            completeBtn.style.display = 'none';
            rescheduleBtn.style.display = 'none';
        }

        const detailModal = new bootstrap.Modal(document.getElementById('appointmentDetailModal'));
        detailModal.show();
    }

    // Complete appointment
    completeAppointment() {
        if (!this.selectedAppointment) return;

        app.showConfirmation('Xác nhận hoàn thành lịch khám này?', () => {
            const success = app.updateAppointmentStatus(this.selectedAppointment.id, 'completed');
            if (success) {
                app.showSuccess('Đã hoàn thành lịch khám');
                
                // Close modal and reload
                const detailModal = bootstrap.Modal.getInstance(document.getElementById('appointmentDetailModal'));
                detailModal.hide();
                
                this.loadDashboard();
            } else {
                app.showError('Có lỗi xảy ra khi cập nhật trạng thái');
            }
        });
    }

    // Show reschedule modal
    showRescheduleModal() {
        if (!this.selectedAppointment) return;

        document.getElementById('rescheduleAppointmentId').value = this.selectedAppointment.id;
        document.getElementById('newDate').value = '';
        document.getElementById('newTime').value = '';
        document.getElementById('rescheduleReason').value = '';

        const rescheduleModal = new bootstrap.Modal(document.getElementById('rescheduleModal'));
        rescheduleModal.show();
    }

    // Confirm reschedule
    confirmReschedule() {
        const appointmentId = parseInt(document.getElementById('rescheduleAppointmentId').value);
        const newDate = document.getElementById('newDate').value;
        const newTime = document.getElementById('newTime').value;
        const reason = document.getElementById('rescheduleReason').value;

        console.log('=== CONFIRM RESCHEDULE ===');
        console.log('Appointment ID:', appointmentId);
        console.log('New Date:', newDate);
        console.log('New Time:', newTime);
        console.log('Reason:', reason);

        if (!newDate || !newTime) {
            app.showError('Vui lòng chọn ngày và giờ mới');
            return;
        }

        // Check if the new time slot is available
        const currentUser = auth.getCurrentUser();
        const allAppointments = app.getAppointments(currentUser.id, 'doctor');
        const conflictingAppointment = allAppointments.find(apt => 
            apt.date === newDate && 
            apt.time === newTime && 
            apt.status !== 'cancelled' &&
            apt.id !== appointmentId
        );

        if (conflictingAppointment) {
            app.showError('Khung giờ này đã được đặt. Vui lòng chọn giờ khác.');
            return;
        }

        // Update appointment
        const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
        const appointmentIndex = appointments.findIndex(apt => apt.id === appointmentId);
        
        if (appointmentIndex !== -1) {
            console.log('Updating appointment at index:', appointmentIndex);
            console.log('Before update:', appointments[appointmentIndex]);
            
            appointments[appointmentIndex].date = newDate;
            appointments[appointmentIndex].time = newTime;
            appointments[appointmentIndex].rescheduleReason = reason;
            appointments[appointmentIndex].rescheduledAt = new Date().toISOString();
            
            console.log('After update:', appointments[appointmentIndex]);
            
            localStorage.setItem('appointments', JSON.stringify(appointments));
            console.log('Appointments saved to localStorage');

            // Close modals
            const rescheduleModal = bootstrap.Modal.getInstance(document.getElementById('rescheduleModal'));
            rescheduleModal.hide();
            
            const detailModal = bootstrap.Modal.getInstance(document.getElementById('appointmentDetailModal'));
            detailModal.hide();

            app.showSuccess('Đã đổi lịch khám thành công');
            
            // Reload dashboard
            this.loadDashboard();
        } else {
            app.showError('Có lỗi xảy ra khi cập nhật lịch khám');
        }
    }

    // Filter appointments by date
    filterByDate() {
        const selectedDate = document.getElementById('dateFilter').value;
        console.log('=== FILTER BY DATE ===');
        console.log('Selected date:', selectedDate);
        
        this.currentDate = selectedDate;
        
        if (selectedDate && selectedDate !== 'all') {
            console.log('Loading appointments for date:', selectedDate);
            this.loadAppointments(selectedDate);
        } else {
            // If no date selected or 'all', show all appointments
            console.log('No date selected or showing all, calling showAllAppointments()');
            this.showAllAppointments();
        }
    }

    // Show today's appointments
    showToday() {
        // Sửa lỗi timezone - sử dụng local date thay vì UTC
        const todayDate = new Date();
        const year = todayDate.getFullYear();
        const month = String(todayDate.getMonth() + 1).padStart(2, '0');
        const day = todayDate.getDate().toString().padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;
        document.getElementById('dateFilter').value = todayStr;
        this.currentDate = todayStr;
        this.loadAppointments(todayStr);
    }

    // Show tomorrow's appointments
    showTomorrow() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        // Sửa lỗi timezone - sử dụng local date thay vì UTC
        const year = tomorrow.getFullYear();
        const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
        const day = tomorrow.getDate().toString().padStart(2, '0');
        const tomorrowStr = `${year}-${month}-${day}`;
        
        document.getElementById('dateFilter').value = tomorrowStr;
        this.currentDate = tomorrowStr;
        this.loadAppointments(tomorrowStr);
    }

    // Show all appointments
    showAllAppointments() {
        console.log('=== SHOW ALL APPOINTMENTS ===');
        const currentUser = auth.getCurrentUser();
        const allAppointments = app.getAppointments(currentUser.id, 'doctor');
        console.log('All appointments for doctor:', allAppointments);
        
        // Update patient codes for appointments that don't have them
        this.updateMissingPatientCodes(allAppointments);
        
        const container = document.getElementById('appointmentsList');
        const titleElement = document.getElementById('appointmentsTitle');
        
        // Update title
        if (titleElement) {
            titleElement.innerHTML = `<i class="fas fa-list me-2"></i>Tất cả lịch khám (${allAppointments.length})`;
        }
        
        if (allAppointments.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-calendar-times fa-3x text-muted mb-3"></i>
                    <p class="text-muted">Không có lịch khám nào</p>
                </div>
            `;
            return;
        }

        // Sort appointments by date and time
        allAppointments.sort((a, b) => {
            const dateA = new Date(a.date + ' ' + a.time);
            const dateB = new Date(b.date + ' ' + b.time);
            return dateA - dateB;
        });

        container.innerHTML = allAppointments.map(apt => {
            console.log('Rendering all appointments - appointment:', apt);
            console.log('Patient code:', apt.patientCode);
            
            return `
            <div class="appointment-item ${apt.status} mb-3">
                <div class="row align-items-center">
                    <div class="col-md-2">
                        <div class="text-center">
                            <div class="h5 text-primary mb-0">${apt.time}</div>
                            <small class="text-muted">${app.formatDate(apt.date)}</small>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <h6 class="mb-1">${apt.patientName}</h6>
                        ${apt.patientCode ? `<p class="text-primary small mb-1"><strong>Mã BN: ${apt.patientCode}</strong></p>` : '<p class="text-warning small mb-1"><em>Chưa có mã BN</em></p>'}
                        <p class="text-muted mb-1">${apt.specialty}</p>
                        ${apt.notes ? `<p class="text-muted small mb-0"><i class="fas fa-sticky-note me-1"></i>${apt.notes}</p>` : ''}
                    </div>
                    <div class="col-md-2">
                        ${app.getStatusBadge(apt.status)}
                    </div>
                    <div class="col-md-2 text-end">
                        <button class="btn btn-sm btn-outline-primary" onclick="showAppointmentDetail(${apt.id})">
                            <i class="fas fa-eye me-1"></i>Chi tiết
                        </button>
                    </div>
                </div>
            </div>
        `;
        }).join('');

        // Clear date filter to show "Tất cả"
        document.getElementById('dateFilter').value = '';
        this.currentDate = 'all';
    }

    // Update missing patient codes for appointments
    updateMissingPatientCodes(appointments) {
        let hasUpdates = false;
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        appointments.forEach(apt => {
            if (!apt.patientCode && apt.patientId) {
                const patient = users.find(user => user.id === apt.patientId);
                if (patient && patient.patientCode) {
                    apt.patientCode = patient.patientCode;
                    hasUpdates = true;
                    console.log('Updated patient code for appointment', apt.id, ':', patient.patientCode);
                }
            }
        });
        
        if (hasUpdates) {
            // Save updated appointments back to localStorage
            const allAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
            appointments.forEach(apt => {
                const index = allAppointments.findIndex(a => a.id === apt.id);
                if (index !== -1) {
                    allAppointments[index] = apt;
                }
            });
            localStorage.setItem('appointments', JSON.stringify(allAppointments));
            console.log('Updated appointments with patient codes');
        }
    }
}

// Global functions for onclick handlers
function showAppointmentDetail(appointmentId) {
    doctorDashboard.showAppointmentDetail(appointmentId);
}

function filterByDate() {
    doctorDashboard.filterByDate();
}

function showToday() {
    doctorDashboard.showToday();
}

function showTomorrow() {
    doctorDashboard.showTomorrow();
}

function showAllAppointments() {
    doctorDashboard.showAllAppointments();
}

function confirmReschedule() {
    doctorDashboard.confirmReschedule();
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



// Initialize doctor dashboard
let doctorDashboard;

// Wait for both DOM, auth, and app to be ready
function initializeDoctorDashboard() {
    console.log('Initializing doctor dashboard...');
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
        console.log('Creating doctor dashboard...');
        doctorDashboard = new DoctorDashboard();
        console.log('Doctor dashboard created successfully');
        // Now call init() after auth is ready
        doctorDashboard.init();
    } else {
        console.log('Auth or app not ready, retrying...');
        // Retry after a short delay
        setTimeout(initializeDoctorDashboard, 100);
    }
}

// Start initialization after a delay to ensure auth.js and app.js are loaded
setTimeout(() => {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeDoctorDashboard);
    } else {
        initializeDoctorDashboard();
    }
}, 500); 