// Main Application JavaScript
class AppointmentApp {
    constructor() {
        this.hospitals = [
            { id: 1, name: 'Bệnh viện Bạch Mai', address: '78 Giải Phóng, Đống Đa, Hà Nội', phone: '024-3869-3731', email: 'contact@bachmai.gov.vn' },
            { id: 2, name: 'Bệnh viện Việt Đức', address: '40 Tràng Thi, Hoàn Kiếm, Hà Nội', phone: '024-3825-3531', email: 'contact@vietduc.org' },
            { id: 3, name: 'Bệnh viện Chợ Rẫy', address: '201B Nguyễn Chí Thanh, Quận 5, TP.HCM', phone: '028-3855-4137', email: 'contact@choray.vn' },
            { id: 4, name: 'Bệnh viện Nhi Đồng 1', address: '341 Sư Vạn Hạnh, Quận 10, TP.HCM', phone: '028-3927-1119', email: 'contact@nhidong1.org' },
            { id: 5, name: 'Bệnh viện Đa khoa Trung ương Huế', address: '16 Lê Lợi, TP. Huế', phone: '0234-3822-325', email: 'contact@huehospital.org' }
        ];

        // Load specialties from localStorage or use default
        this.loadSpecialties();

        this.doctors = [
            // Tim mạch
            { id: 1, name: 'Bác sĩ Trần Thị B', specialty: 'Tim mạch', hospitalId: 1, avatar: 'assets/images/doctor1.jpg', experience: '15 năm', rating: 4.8 },
            { id: 7, name: 'Bác sĩ Nguyễn Thị H', specialty: 'Tim mạch', hospitalId: 2, avatar: 'assets/images/doctor7.jpg', experience: '13 năm', rating: 4.7 },
            { id: 9, name: 'Bác sĩ Lê Văn K', specialty: 'Tim mạch', hospitalId: 3, avatar: 'assets/images/doctor9.jpg', experience: '16 năm', rating: 4.9 },
            
            // Nội khoa
            { id: 2, name: 'Bác sĩ Nguyễn Văn C', specialty: 'Nội khoa', hospitalId: 1, avatar: 'assets/images/doctor2.jpg', experience: '12 năm', rating: 4.6 },
            { id: 8, name: 'Bác sĩ Trần Văn I', specialty: 'Nội khoa', hospitalId: 3, avatar: 'assets/images/doctor8.jpg', experience: '11 năm', rating: 4.6 },
            { id: 10, name: 'Bác sĩ Phạm Thị L', specialty: 'Nội khoa', hospitalId: 2, avatar: 'assets/images/doctor10.jpg', experience: '14 năm', rating: 4.8 },
            
            // Ngoại khoa
            { id: 3, name: 'Bác sĩ Lê Thị D', specialty: 'Ngoại khoa', hospitalId: 2, avatar: 'assets/images/doctor3.jpg', experience: '18 năm', rating: 4.9 },
            { id: 11, name: 'Bác sĩ Hoàng Văn M', specialty: 'Ngoại khoa', hospitalId: 1, avatar: 'assets/images/doctor11.jpg', experience: '20 năm', rating: 4.9 },
            { id: 12, name: 'Bác sĩ Vũ Thị N', specialty: 'Ngoại khoa', hospitalId: 3, avatar: 'assets/images/doctor12.jpg', experience: '17 năm', rating: 4.7 },
            
            // Nhi khoa
            { id: 4, name: 'Bác sĩ Phạm Văn E', specialty: 'Nhi khoa', hospitalId: 4, avatar: 'assets/images/doctor4.jpg', experience: '10 năm', rating: 4.7 },
            { id: 13, name: 'Bác sĩ Trần Thị O', specialty: 'Nhi khoa', hospitalId: 1, avatar: 'assets/images/doctor13.jpg', experience: '12 năm', rating: 4.8 },
            { id: 14, name: 'Bác sĩ Nguyễn Văn P', specialty: 'Nhi khoa', hospitalId: 2, avatar: 'assets/images/doctor14.jpg', experience: '9 năm', rating: 4.6 },
            
            // Da liễu
            { id: 5, name: 'Bác sĩ Hoàng Thị F', specialty: 'Da liễu', hospitalId: 3, avatar: 'assets/images/doctor5.jpg', experience: '8 năm', rating: 4.5 },
            { id: 15, name: 'Bác sĩ Lê Văn Q', specialty: 'Da liễu', hospitalId: 1, avatar: 'assets/images/doctor15.jpg', experience: '11 năm', rating: 4.7 },
            { id: 16, name: 'Bác sĩ Phạm Thị R', specialty: 'Da liễu', hospitalId: 2, avatar: 'assets/images/doctor16.jpg', experience: '13 năm', rating: 4.8 },
            
            // Mắt
            { id: 6, name: 'Bác sĩ Vũ Văn G', specialty: 'Mắt', hospitalId: 5, avatar: 'assets/images/doctor6.jpg', experience: '14 năm', rating: 4.8 },
            { id: 17, name: 'Bác sĩ Trần Văn S', specialty: 'Mắt', hospitalId: 1, avatar: 'assets/images/doctor17.jpg', experience: '16 năm', rating: 4.9 },
            { id: 18, name: 'Bác sĩ Nguyễn Thị T', specialty: 'Mắt', hospitalId: 3, avatar: 'assets/images/doctor18.jpg', experience: '12 năm', rating: 4.7 }
        ];

        this.timeSlots = [
            { start: '08:00', end: '08:30' },
            { start: '08:30', end: '09:00' },
            { start: '09:00', end: '09:30' },
            { start: '09:30', end: '10:00' },
            { start: '10:00', end: '10:30' },
            { start: '10:30', end: '11:00' },
            { start: '14:00', end: '14:30' },
            { start: '14:30', end: '15:00' },
            { start: '15:00', end: '15:30' },
            { start: '15:30', end: '16:00' },
            { start: '16:00', end: '16:30' },
            { start: '16:30', end: '17:00' }
        ];

        this.init();
    }

    init() {
        this.loadAppointments();
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupGlobalEventListeners();
            });
        } else {
            this.setupGlobalEventListeners();
        }
    }

    // Load specialties from localStorage or use default
    loadSpecialties() {
        const specialties = localStorage.getItem('specialties');
        if (!specialties) {
            // Initialize with default specialties
            this.specialties = [
                { id: 1, name: 'Tim mạch', icon: 'fas fa-heartbeat', description: 'Chuyên điều trị các bệnh về tim mạch' },
                { id: 2, name: 'Nội khoa', icon: 'fas fa-stethoscope', description: 'Chuyên điều trị các bệnh nội khoa' },
                { id: 3, name: 'Ngoại khoa', icon: 'fas fa-user-md', description: 'Chuyên phẫu thuật và điều trị ngoại khoa' },
                { id: 4, name: 'Nhi khoa', icon: 'fas fa-baby', description: 'Chuyên điều trị bệnh nhi' },
                { id: 5, name: 'Da liễu', icon: 'fas fa-allergies', description: 'Chuyên điều trị các bệnh về da' },
                { id: 6, name: 'Mắt', icon: 'fas fa-eye', description: 'Chuyên điều trị các bệnh về mắt' }
            ];
            localStorage.setItem('specialties', JSON.stringify(this.specialties));
        } else {
            this.specialties = JSON.parse(specialties);
        }
    }

    // Load appointments from localStorage
    loadAppointments() {
        const appointments = localStorage.getItem('appointments');
        if (!appointments) {
            // Initialize with sample appointments for current month
            const currentDate = new Date();
            const currentYear = currentDate.getFullYear();
            const currentMonth = currentDate.getMonth();
            
            const sampleAppointments = [
                // Appointments for current month
                {
                    id: 1,
                    patientId: 1,
                    patientName: 'Nguyễn Văn A',
                    patientCode: 'BN-2412010001',
                    doctorId: 1,
                    doctorName: 'Bác sĩ Trần Thị B',
                    specialty: 'Tim mạch',
                    hospitalId: 1,
                    hospitalName: 'Bệnh viện VTK',
                    date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-15`,
                    time: '09:00',
                    status: 'completed',
                    notes: 'Khám định kỳ',
                    rating: 5,
                    review: 'Bác sĩ rất tận tâm và chuyên nghiệp'
                },
                {
                    id: 2,
                    patientId: 2,
                    patientName: 'Trần Thị B',
                    patientCode: 'BN-2412010002',
                    doctorId: 1,
                    doctorName: 'Bác sĩ Trần Thị B',
                    specialty: 'Tim mạch',
                    hospitalId: 1,
                    hospitalName: 'Bệnh viện VTK',
                    date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-19`,
                    time: '15:30',
                    status: 'upcoming',
                    notes: 'Khám tim mạch'
                },
                {
                    id: 3,
                    patientId: 3,
                    patientName: 'Lê Văn C',
                    patientCode: 'BN-2412010003',
                    doctorId: 2,
                    doctorName: 'Bác sĩ Nguyễn Văn C',
                    specialty: 'Nội khoa',
                    hospitalId: 1,
                    hospitalName: 'Bệnh viện VTK',
                    date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-25`,
                    time: '10:00',
                    status: 'upcoming',
                    notes: 'Khám sức khỏe tổng quát'
                },
                {
                    id: 4,
                    patientId: 4,
                    patientName: 'Phạm Thị D',
                    patientCode: 'BN-2412010004',
                    doctorId: 1,
                    doctorName: 'Bác sĩ Trần Thị B',
                    specialty: 'Tim mạch',
                    hospitalId: 1,
                    hospitalName: 'Bệnh viện VTK',
                    date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-22`,
                    time: '15:30',
                    status: 'upcoming',
                    notes: 'Khám tim mạch'
                },
                {
                    id: 5,
                    patientId: 5,
                    patientName: 'Hoàng Văn E',
                    patientCode: 'BN-2412010005',
                    doctorId: 2,
                    doctorName: 'Bác sĩ Nguyễn Văn C',
                    specialty: 'Nội khoa',
                    hospitalId: 1,
                    hospitalName: 'Bệnh viện VTK',
                    date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-25`,
                    time: '10:00',
                    status: 'upcoming',
                    notes: 'Khám nội khoa'
                }
            ];
            localStorage.setItem('appointments', JSON.stringify(sampleAppointments));
        }
    }

    // Setup global event listeners
    setupGlobalEventListeners() {
        // Add navigation functionality
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                if (link.getAttribute('href') === '#') {
                    e.preventDefault();
                }
            });
        });
    }

    // Get appointments by user role
    getAppointments(userId, role, hospitalId = null) {
        const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
        
        console.log('=== GET APPOINTMENTS ===');
        console.log('userId:', userId, 'role:', role, 'hospitalId:', hospitalId);
        console.log('All appointments from localStorage:', appointments);
        
        if (role === 'patient') {
            const patientAppointments = appointments.filter(apt => apt.patientId === userId);
            console.log('Patient appointments:', patientAppointments);
            return patientAppointments;
        } else if (role === 'doctor') {
            let doctorAppointments = appointments.filter(apt => apt.doctorId === userId);
            console.log('Doctor appointments (before hospital filter):', doctorAppointments);
            if (hospitalId) {
                doctorAppointments = doctorAppointments.filter(apt => apt.hospitalId === hospitalId);
                console.log('Doctor appointments (after hospital filter):', doctorAppointments);
            }
            return doctorAppointments;
        } else if (role === 'admin') {
            if (hospitalId) {
                return appointments.filter(apt => apt.hospitalId === hospitalId);
            }
            return appointments;
        }
        
        return [];
    }

    // Get doctors by hospital
    getDoctorsByHospital(hospitalId) {
        return this.doctors.filter(doctor => doctor.hospitalId === hospitalId);
    }

    // Get doctors by specialty and hospital
    getDoctorsBySpecialtyAndHospital(specialty, hospitalId) {
        return this.doctors.filter(doctor => 
            doctor.specialty === specialty && doctor.hospitalId === hospitalId
        );
    }

    // Get hospital by ID
    getHospitalById(hospitalId) {
        return this.hospitals.find(hospital => hospital.id === hospitalId);
    }

    // Get user's hospitals (for doctors)
    getUserHospitals(user) {
        if (user.role === 'doctor' && user.hospitalIds) {
            return this.hospitals.filter(hospital => user.hospitalIds.includes(hospital.id));
        }
        return [];
    }

    // Create new appointment
    createAppointment(appointmentData) {
        const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
        
        // Get patient code if not provided
        let patientCode = appointmentData.patientCode;
        if (!patientCode && appointmentData.patientId) {
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const patient = users.find(user => user.id === appointmentData.patientId);
            patientCode = patient ? patient.patientCode : null;
        }
        
        const newAppointment = {
            id: appointments.length + 1,
            ...appointmentData,
            patientCode: patientCode,
            status: appointmentData.status || 'upcoming',
            createdAt: new Date().toISOString()
        };
        
        appointments.push(newAppointment);
        localStorage.setItem('appointments', JSON.stringify(appointments));
        
        console.log('Created appointment:', newAppointment);
        return newAppointment;
    }

    // Update appointment status
    updateAppointmentStatus(appointmentId, status) {
        const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
        const appointmentIndex = appointments.findIndex(apt => apt.id === appointmentId);
        
        if (appointmentIndex !== -1) {
            appointments[appointmentIndex].status = status;
            localStorage.setItem('appointments', JSON.stringify(appointments));
            return true;
        }
        
        return false;
    }

    // Add review to appointment
    addReview(appointmentId, rating, review) {
        const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
        const appointmentIndex = appointments.findIndex(apt => apt.id === appointmentId);
        
        if (appointmentIndex !== -1) {
            appointments[appointmentIndex].rating = rating;
            appointments[appointmentIndex].review = review;
            localStorage.setItem('appointments', JSON.stringify(appointments));
            return true;
        }
        
        return false;
    }

    // Get available time slots for a specific date and doctor
    getAvailableTimeSlots(date, doctorId) {
        const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
        const bookedSlots = appointments
            .filter(apt => apt.doctorId === doctorId && apt.date === date && apt.status !== 'cancelled')
            .map(apt => apt.time);
        
        return this.timeSlots.filter(slot => !bookedSlots.includes(slot.start));
    }
    
    // Reset appointments data (for testing)
    resetAppointments() {
        localStorage.removeItem('appointments');
        this.loadAppointments();
    }

    // Format date for display
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // Format time for display
    formatTime(timeString) {
        return timeString;
    }

    // Get status badge HTML
    getStatusBadge(status) {
        const statusMap = {
            'upcoming': { text: 'Sắp tới', class: 'status-upcoming' },
            'completed': { text: 'Đã hoàn thành', class: 'status-completed' },
            'cancelled': { text: 'Đã hủy', class: 'status-cancelled' }
        };
        
        const statusInfo = statusMap[status] || { text: 'Không xác định', class: 'status-upcoming' };
        
        return `<span class="status-badge ${statusInfo.class}">${statusInfo.text}</span>`;
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

    // Show warning message
    showWarning(message) {
        Swal.fire({
            icon: 'warning',
            title: 'Cảnh báo!',
            text: message,
            confirmButtonText: 'OK',
            confirmButtonColor: '#ffc107',
            customClass: {
                container: 'swal2-high-zindex',
                popup: 'swal2-high-zindex'
            }
        });
    }

    // Generate calendar HTML
    generateCalendar(month, year, selectedDate, availableDates) {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        let calendarHTML = `
            <div class="calendar-header">
                <button class="btn btn-sm btn-outline-primary" onclick="app.previousMonth()">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <h5 class="mb-0">${new Date(year, month).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}</h5>
                <button class="btn btn-sm btn-outline-primary" onclick="app.nextMonth()">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
            <div class="calendar-grid">
        `;

        // Add day headers
        const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        dayNames.forEach(day => {
            calendarHTML += `<div class="calendar-day header">${day}</div>`;
        });

        // Add calendar days
        const currentDate = new Date(startDate);
        while (currentDate <= lastDay || currentDate.getDay() !== 0) {
            // Sửa lỗi timezone - sử dụng local date thay vì UTC
            const year = currentDate.getFullYear();
            const month = String(currentDate.getMonth() + 1).padStart(2, '0');
            const day = String(currentDate.getDate()).padStart(2, '0');
            const dateString = `${year}-${month}-${day}`;
            
            const isCurrentMonth = currentDate.getMonth() === month;
            const isSelected = selectedDate === dateString;
            const isAvailable = availableDates.includes(dateString);
            
            // Sửa lỗi timezone cho today check
            const today = new Date();
            const todayYear = today.getFullYear();
            const todayMonth = String(today.getMonth() + 1).padStart(2, '0');
            const todayDay = String(today.getDate()).padStart(2, '0');
            const todayString = `${todayYear}-${todayMonth}-${todayDay}`;
            const isToday = dateString === todayString;

            let dayClass = 'calendar-day';
            if (!isCurrentMonth) dayClass += ' other-month';
            if (isSelected) dayClass += ' selected';
            if (isAvailable && isCurrentMonth) dayClass += ' available';
            if (isToday) dayClass += ' today';

            calendarHTML += `
                <div class="${dayClass}" data-date="${dateString}" onclick="app.selectDate('${dateString}')">
                    ${currentDate.getDate()}
                </div>
            `;

            currentDate.setDate(currentDate.getDate() + 1);
        }

        calendarHTML += '</div>';
        return calendarHTML;
    }

    // Previous month
    previousMonth() {
        // Implementation depends on current calendar state
        console.log('Previous month');
    }

    // Next month
    nextMonth() {
        // Implementation depends on current calendar state
        console.log('Next month');
    }

    // Select date
    selectDate(dateString) {
        // Implementation depends on current context
        console.log('Selected date:', dateString);
    }

    // Validate form
    validateForm(formData) {
        const errors = [];
        
        if (!formData.hospitalId) {
            errors.push('Vui lòng chọn bệnh viện');
        }
        
        if (!formData.specialty) {
            errors.push('Vui lòng chọn chuyên khoa');
        }
        
        if (!formData.doctorId) {
            errors.push('Vui lòng chọn bác sĩ');
        }
        
        if (!formData.date) {
            errors.push('Vui lòng chọn ngày khám');
        }
        
        if (!formData.time) {
            errors.push('Vui lòng chọn giờ khám');
        }
        
        return errors;
    }
}

// Global logout function
function logout() {
    localStorage.removeItem('currentUser');
    alert('Đã đăng xuất thành công!');
    window.location.href = 'index.html';
}

// Initialize main application
const app = new AppointmentApp(); 