// Patient Dashboard JavaScript
class PatientDashboard {
    constructor() {
        this.currentStep = 1;
        this.bookingData = {
            hospitalId: null,
            specialty: null,
            doctorId: null,
            date: null,
            time: null,
            notes: ''
        };
        this.selectedRating = 0;
        
        // Pagination state
        this.upcomingPage = 1;
        this.recentPage = 1;
        this.itemsPerPage = 3;
        
        // Reschedule mode state
        this.isRescheduleMode = false;
        this.rescheduleAppointmentId = null;
        this.originalTimeSlot = null;
        
        // Rebook mode state
        this.isRebookMode = false;
        this.rebookAppointmentId = null;
        
        // Don't call init() immediately, wait for auth to be ready
    }

    init() {
        console.log('PatientDashboard init() called');
        this.checkAuth();
        this.loadDashboard();
        this.setupEventListeners();
    }

    // Check authentication - SIMPLIFIED
    checkAuth() {
        console.log('=== SIMPLE CHECK AUTH ===');
        
        // Get user directly from localStorage
        const userStr = localStorage.getItem('currentUser');
        console.log('User string from localStorage:', userStr);
        
        if (!userStr) {
            console.log('No user in localStorage - staying on page');
            return;
        }
        
        let currentUser;
        try {
            currentUser = JSON.parse(userStr);
            console.log('Parsed user:', currentUser);
        } catch (error) {
            console.log('Error parsing user:', error);
            return;
        }
        
        if (!currentUser || currentUser.role !== 'patient') {
            console.log('User is not patient - staying on page');
            return;
        }

        console.log('Patient authenticated:', currentUser.name);

        // Update user name in UI
        const userNameElement = document.getElementById('userName');
        const welcomeUserNameElement = document.getElementById('welcomeUserName');
        const patientCodeElement = document.getElementById('patientCodeDisplay');
        
        if (userNameElement) userNameElement.textContent = currentUser.name;
        if (welcomeUserNameElement) welcomeUserNameElement.textContent = currentUser.name;
        
        // Display patient code in header
        if (patientCodeElement && currentUser.patientCode) {
            patientCodeElement.textContent = `Mã BN: ${currentUser.patientCode}`;
        } else if (patientCodeElement) {
            patientCodeElement.textContent = 'Chưa có mã BN';
        }
    }

    // Load dashboard data - SIMPLIFIED
    loadDashboard() {
        console.log('=== SIMPLE LOAD DASHBOARD ===');
        
        // Get user directly from localStorage
        const userStr = localStorage.getItem('currentUser');
        if (!userStr) {
            console.log('No user - using empty data');
            this.updateStats([]);
            this.loadUpcomingAppointments([]);
            this.loadRecentAppointments([]);
            return;
        }
        
        let currentUser;
        try {
            currentUser = JSON.parse(userStr);
        } catch (error) {
            console.log('Error parsing user:', error);
            this.updateStats([]);
            this.loadUpcomingAppointments([]);
            this.loadRecentAppointments([]);
            return;
        }
        
        console.log('Loading dashboard for:', currentUser.name);
        
        // Get real appointments data
        let appointments = [];
        if (typeof app !== 'undefined' && app.getAppointments) {
            appointments = app.getAppointments(currentUser.id, 'patient');
            console.log('Real appointments from app:', appointments);
        } else {
            // Fallback: get from localStorage directly
            const appointmentsStr = localStorage.getItem('appointments');
            if (appointmentsStr) {
                const allAppointments = JSON.parse(appointmentsStr);
                appointments = allAppointments.filter(apt => apt.patientId === currentUser.id);
                console.log('Appointments from localStorage:', appointments);
            }
        }
        
        // Process overdue appointments first
        appointments = this.processOverdueAppointments(appointments);
        
        this.updateStats(appointments);
        this.loadUpcomingAppointments(appointments);
        this.loadRecentAppointments(appointments);
    }

    // Update statistics
    updateStats(appointments) {
        const upcoming = appointments.filter(apt => apt.status === 'upcoming').length;
        const completed = appointments.filter(apt => apt.status === 'completed').length;
        const total = appointments.length;

        const upcomingElement = document.getElementById('upcomingCount');
        const completedElement = document.getElementById('completedCount');
        const totalElement = document.getElementById('totalCount');
        
        if (upcomingElement) upcomingElement.textContent = upcoming;
        if (completedElement) completedElement.textContent = completed;
        if (totalElement) totalElement.textContent = total;
    }

    // Load upcoming appointments with pagination
    loadUpcomingAppointments(appointments) {
        // Filter and process appointments
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        const upcoming = appointments
            .filter(apt => {
                // Check if appointment is overdue (more than 1 day past)
                const aptDate = new Date(apt.date);
                const aptDateOnly = new Date(aptDate.getFullYear(), aptDate.getMonth(), aptDate.getDate());
                const daysDiff = Math.floor((today - aptDateOnly) / (1000 * 60 * 60 * 24));
                
                // If overdue by 1 day or more, update status to 'completed'
                if (daysDiff >= 1 && apt.status === 'upcoming') {
                    this.updateAppointmentStatusToCompleted(apt.id);
                    return false; // Remove from upcoming list
                }
                
                return apt.status === 'upcoming';
            })
            .sort((a, b) => {
                // First sort by date (ascending)
                const dateComparison = new Date(a.date) - new Date(b.date);
                if (dateComparison !== 0) {
                    return dateComparison;
                }
                // If same date, sort by time (ascending)
                return (a.time || a.timeRange || '').localeCompare(b.time || b.timeRange || '');
            });

        const totalPages = Math.ceil(upcoming.length / this.itemsPerPage);
        const startIndex = (this.upcomingPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const currentPageItems = upcoming.slice(startIndex, endIndex);

        const container = document.getElementById('dashboardUpcomingAppointments');
        
        if (upcoming.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">Không có lịch khám sắp tới</p>';
            this.updateUpcomingPagination(0, 0);
            return;
        }

        container.innerHTML = currentPageItems.map(apt => `
            <div class="appointment-item upcoming">
                <div class="row align-items-center">
                    <div class="col-md-8">
                        <div class="appointment-info-grid">
                            <div class="appointment-info-left">
                                <div class="appointment-info-item">
                                    <span class="appointment-info-label">Bệnh viện:</span>
                                    <span class="appointment-info-value">${apt.hospitalName || 'Bệnh viện'}</span>
                                </div>
                                <div class="appointment-info-item">
                                    <span class="appointment-info-label">Khoa:</span>
                                    <span class="appointment-info-value">${apt.specialty}</span>
                                </div>
                                <div class="appointment-info-item">
                                    <span class="appointment-info-label">Bác sĩ:</span>
                                    <span class="appointment-info-value">${apt.doctorName}</span>
                                </div>
                            </div>
                            <div class="appointment-info-right">
                                <div class="appointment-info-item">
                                    <span class="appointment-info-label">Ngày khám:</span>
                                    <span class="appointment-info-value">${app.formatDate(apt.date)}</span>
                                </div>
                                <div class="appointment-info-item">
                                    <span class="appointment-info-label">Giờ khám:</span>
                                    <span class="appointment-info-value">${apt.timeRange || apt.time}</span>
                                </div>
                                <div class="appointment-info-item">
                                    <span class="appointment-info-label">Ghi chú:</span>
                                    <span class="appointment-info-value">${apt.notes || 'Không có'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4 text-end">
                        <div class="mt-2 d-flex flex-column gap-2 align-items-end">
                            <button class="btn btn-sm btn-warning" style="width: 120px;" onclick="rescheduleAppointment(${apt.id})">
                                <i class="fas fa-calendar-alt me-1"></i>Dời lịch
                            </button>
                            <button class="btn btn-sm btn-danger" style="width: 120px; color: #fff;" onclick="cancelAppointment(${apt.id})">
                                <i class="fas fa-times me-1"></i>Hủy lịch
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        // Update pagination controls
        this.updateUpcomingPagination(upcoming.length, totalPages);
    }

    // Load recent appointments
    loadRecentAppointments(appointments) {
        // Process overdue appointments first
        appointments = this.processOverdueAppointments(appointments);
        
        const recent = appointments
            .filter(apt => apt.status === 'completed')
            .sort((a, b) => {
                // First sort by date (descending - newest first)
                const dateComparison = new Date(b.date) - new Date(a.date);
                if (dateComparison !== 0) {
                    return dateComparison;
                }
                // If same date, sort by time (ascending)
                return (a.time || a.timeRange || '').localeCompare(b.time || b.timeRange || '');
            });

        const totalPages = Math.ceil(recent.length / this.itemsPerPage);
        const startIndex = (this.recentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const currentPageItems = recent.slice(startIndex, endIndex);

        const container = document.getElementById('dashboardRecentAppointments');
        
        if (recent.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">Không có lịch khám gần đây</p>';
            this.updateRecentPagination(0, 0);
            return;
        }

        container.innerHTML = currentPageItems.map(apt => `
            <div class="appointment-item completed">
                <div class="row align-items-center">
                    <div class="col-md-8">
                        <div class="appointment-info-grid">
                            <div class="appointment-info-left">
                                <div class="appointment-info-item">
                                    <span class="appointment-info-label">Bệnh viện:</span>
                                    <span class="appointment-info-value">${apt.hospitalName || 'Bệnh viện'}</span>
                                </div>
                                <div class="appointment-info-item">
                                    <span class="appointment-info-label">Khoa:</span>
                                    <span class="appointment-info-value">${apt.specialty}</span>
                                </div>
                                <div class="appointment-info-item">
                                    <span class="appointment-info-label">Bác sĩ:</span>
                                    <span class="appointment-info-value">${apt.doctorName}</span>
                                </div>
                            </div>
                            <div class="appointment-info-right">
                                <div class="appointment-info-item">
                                    <span class="appointment-info-label">Ngày khám:</span>
                                    <span class="appointment-info-value">${app.formatDate(apt.date)}</span>
                                </div>
                                <div class="appointment-info-item">
                                    <span class="appointment-info-label">Giờ khám:</span>
                                    <span class="appointment-info-value">${apt.timeRange || apt.time}</span>
                                </div>
                                <div class="appointment-info-item">
                                    <span class="appointment-info-label">Ghi chú:</span>
                                    <span class="appointment-info-value">${apt.notes || 'Không có'}</span>
                                </div>
                            </div>
                        </div>
                        ${apt.rating ? `
                            <div class="mt-1">
                                <i class="fas fa-star text-warning"></i>
                                <span class="text-muted">${apt.rating}/5</span>
                            </div>
                        ` : ''}
                    </div>
                    <div class="col-md-4 text-end">
                        <div class="mt-2 d-flex flex-column gap-2 align-items-end">
                            ${!apt.rating && apt.status === 'examined' ? `
                                <button class="btn btn-sm btn-outline-warning" style="width: 120px;" onclick="showReviewModal(${apt.id})">
                                    <i class="fas fa-star me-1"></i>Đánh giá
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        // Update pagination controls
        this.updateRecentPagination(recent.length, totalPages);
    }

    // Setup event listeners
    setupEventListeners() {
        // Rating stars
        document.querySelectorAll('.star').forEach(star => {
            star.addEventListener('click', (e) => {
                const rating = parseInt(e.target.dataset.rating);
                this.setRating(rating);
            });
        });
    }
    
    setupModalEventListeners() {
        console.log('Setting up modal event listeners...');
        
        // Remove existing listeners to avoid duplicates
        const nextBtn = document.getElementById('nextBtn');
        const prevBtn = document.getElementById('prevBtn');
        const confirmBtn = document.getElementById('confirmBtn');
        
        if (nextBtn) {
            // Remove old listeners
            nextBtn.replaceWith(nextBtn.cloneNode(true));
            const newNextBtn = document.getElementById('nextBtn');
            
            newNextBtn.addEventListener('click', () => {
                console.log('Next button clicked');
                console.log('this context:', this);
                console.log('currentStep:', this.currentStep);
                console.log('bookingData:', this.bookingData);
                this.nextStep();
            });
        }
        
        if (prevBtn) {
            prevBtn.replaceWith(prevBtn.cloneNode(true));
            const newPrevBtn = document.getElementById('prevBtn');
            
            newPrevBtn.addEventListener('click', () => {
                console.log('Prev button clicked');
                this.prevStep();
            });
        }
        
        if (confirmBtn) {
            confirmBtn.replaceWith(confirmBtn.cloneNode(true));
            const newConfirmBtn = document.getElementById('confirmBtn');
            
            newConfirmBtn.addEventListener('click', () => {
                console.log('Confirm button clicked');
                this.confirmBooking();
            });
        }
    }

    // Show booking form
    showBookingForm() {
        try {
            console.log('showBookingForm called');
            console.log('app object:', typeof app !== 'undefined' ? 'exists' : 'undefined');
            
            // Reset reschedule mode
            this.isRescheduleMode = false;
            this.rescheduleAppointmentId = null;
            this.originalTimeSlot = null;
            
            // Reset rebook mode
            this.isRebookMode = false;
            this.rebookAppointmentId = null;
            
            this.currentStep = 1;
            this.bookingData = {
                hospitalId: 1, // Fixed to VTK Hospital
                specialty: null,
                doctorId: null,
                date: null,
                time: null,
                notes: ''
            };
            
            // Reset modal title to "Đặt lịch khám"
            const bookingModal = document.getElementById('bookingModal');
            const modalTitle = bookingModal.querySelector('.modal-title');
            modalTitle.innerHTML = '<i class="fas fa-calendar-plus me-2"></i>Đặt lịch khám';
            
            // Remove reschedule modal classes
            bookingModal.classList.remove('reschedule-modal');
            const modalDialog = bookingModal.querySelector('.modal-dialog');
            if (modalDialog) {
                modalDialog.classList.remove('reschedule-modal');
            }
            
            // Load specialties directly (step 1)
            this.loadSpecialties();
            this.updateProgressSteps();
            this.showStep(1);
            
            // Setup event listeners when modal is opened
            this.setupModalEventListeners();
            
            const bookingModalElement = document.getElementById('bookingModal');
            if (bookingModalElement && typeof bootstrap !== 'undefined') {
                const modal = new bootstrap.Modal(bookingModalElement);
                modal.show();
            } else {
                // Fallback: show modal manually
                bookingModalElement.style.display = 'block';
                bookingModalElement.classList.add('show');
                document.body.classList.add('modal-open');
            }
        } catch (error) {
            console.error('Error showing booking form:', error);
            alert('Có lỗi xảy ra khi mở form đặt lịch. Vui lòng thử lại.');
        }
    }



    // Load specialties
    loadSpecialties() {
        const container = document.getElementById('specialtyList');
        container.innerHTML = app.specialties.map(specialty => `
            <div class="col-md-6 mb-3">
                <div class="specialty-card" onclick="selectSpecialty(${specialty.id})">
                    <div class="text-center">
                        <i class="${specialty.icon} fa-2x text-primary mb-2"></i>
                        <h6>${specialty.name}</h6>
                        <p class="text-muted small mb-0">${specialty.description}</p>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Select specialty
    selectSpecialty(specialtyId) {
        // Remove previous selection
        document.querySelectorAll('.specialty-card').forEach(card => {
            card.classList.remove('selected');
        });

        // Add selection to clicked card
        event.target.closest('.specialty-card').classList.add('selected');
        
        this.bookingData.specialty = specialtyId;
    }
    
    // Restore specialty selection
    restoreSpecialtySelection() {
        if (this.bookingData.specialty) {
            document.querySelectorAll('.specialty-card').forEach(card => {
                card.classList.remove('selected');
            });
            
            // Find the specialty card with matching ID and select it
            const specialtyCards = document.querySelectorAll('.specialty-card');
            specialtyCards.forEach(card => {
                const specialtyId = parseInt(card.getAttribute('onclick').match(/\d+/)[0]);
                if (specialtyId === this.bookingData.specialty) {
                    card.classList.add('selected');
                }
            });
        }
    }

    // Load doctors for selected specialty
    loadDoctors() {
        const specialty = app.specialties.find(s => s.id === this.bookingData.specialty);
        const doctors = app.doctors.filter(d => d.specialty === specialty.name);
        
        const container = document.getElementById('doctorList');
        if (doctors.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center">
                    <p class="text-muted">Không có bác sĩ nào thuộc chuyên khoa ${specialty.name}</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = doctors.map(doctor => `
            <div class="col-md-6 mb-3">
                <div class="doctor-card" onclick="selectDoctor(${doctor.id})">
                    <div class="text-center">
                        <div class="doctor-avatar-placeholder">
                            <i class="fas fa-user-md fa-2x text-primary"></i>
                        </div>
                        <h6>${doctor.name}</h6>
                        <p class="text-muted small mb-1">${doctor.specialty}</p>
                        <p class="text-muted small mb-0">
                            <i class="fas fa-star text-warning"></i>
                            ${doctor.rating} (${doctor.experience})
                        </p>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Select doctor
    selectDoctor(doctorId) {
        // Remove previous selection
        document.querySelectorAll('.doctor-card').forEach(card => {
            card.classList.remove('selected');
        });

        // Add selection to clicked card
        event.target.closest('.doctor-card').classList.add('selected');
        
        this.bookingData.doctorId = doctorId;
        
        // Auto-load time slots if date is already selected
        if (this.bookingData.date) {
            this.loadTimeSlots();
        }
    }
    
    // Restore doctor selection
    restoreDoctorSelection() {
        if (this.bookingData.doctorId) {
            document.querySelectorAll('.doctor-card').forEach(card => {
                card.classList.remove('selected');
            });
            
            // Find the doctor card with matching ID and select it
            const doctorCards = document.querySelectorAll('.doctor-card');
            doctorCards.forEach(card => {
                const doctorId = parseInt(card.getAttribute('onclick').match(/\d+/)[0]);
                if (doctorId === this.bookingData.doctorId) {
                    card.classList.add('selected');
                }
            });
        }
    }

    // Load calendar
    loadCalendar() {
        const currentDate = new Date();
        
        // Use stored month/year or default to current
        if (this.currentCalendarMonth === undefined) {
            this.currentCalendarMonth = currentDate.getMonth();
            this.currentCalendarYear = currentDate.getFullYear();
        }
        
        // Generate calendar with new logic
        const container = document.getElementById('calendarContainer');
        container.innerHTML = this.generateCalendar(this.currentCalendarMonth, this.currentCalendarYear);
        
        // Add event listeners to calendar days
        container.querySelectorAll('.calendar-day').forEach(day => {
            day.addEventListener('click', (e) => {
                const date = e.target.dataset.date;
                if (date && !e.target.classList.contains('past') && !e.target.classList.contains('booked') && !e.target.classList.contains('other-month')) {
                    this.selectDate(date);
                }
            });
        });
        
        // Ensure calendar is fully rendered before proceeding
        console.log('Calendar rendered, container children:', container.children.length);
        
        // Only auto-select today's date if no date is currently selected
        if (!this.bookingData.date) {
            const today = new Date();
            const todayYear = today.getFullYear();
            const todayMonth = String(today.getMonth() + 1).padStart(2, '0');
            const todayDay = String(today.getDate()).padStart(2, '0');
            const todayStr = `${todayYear}-${todayMonth}-${todayDay}`;
            this.bookingData.date = todayStr;
            
            console.log('=== LOAD CALENDAR ===');
            console.log('Auto-selected today:', todayStr);
        } else {
            console.log('=== LOAD CALENDAR ===');
            console.log('Using existing selected date:', this.bookingData.date);
        }
        
        console.log('Current booking data:', this.bookingData);
        
        // Load time slots for selected date
        this.loadTimeSlots();
        
        // Ensure today's date is properly highlighted
        setTimeout(() => {
            console.log('Calling restoreDateSelection after delay...');
            this.restoreDateSelection();
        }, 200); // Tăng delay để đảm bảo calendar được render hoàn toàn
        
        // Also try to highlight immediately after a shorter delay
        setTimeout(() => {
            console.log('Trying immediate highlight...');
            this.forceHighlightToday();
        }, 50);
        
        // Final attempt to ensure highlighting works
        setTimeout(() => {
            console.log('Final attempt to highlight today...');
            this.restoreDateSelection();
        }, 500);
    }
    
    // Previous month
    previousMonth() {
        this.currentCalendarMonth--;
        if (this.currentCalendarMonth < 0) {
            this.currentCalendarMonth = 11;
            this.currentCalendarYear--;
        }
        this.loadCalendar();
    }
    
    // Next month
    nextMonth() {
        this.currentCalendarMonth++;
        if (this.currentCalendarMonth > 11) {
            this.currentCalendarMonth = 0;
            this.currentCalendarYear++;
        }
        this.loadCalendar();
    }
    
    // Generate calendar with new styling
    generateCalendar(month, year) {
        const currentDate = new Date();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());
        
        // Use stored month/year if available
        const displayMonth = this.currentCalendarMonth !== undefined ? this.currentCalendarMonth : month;
        const displayYear = this.currentCalendarYear !== undefined ? this.currentCalendarYear : year;
        
        let calendarHTML = `
            <div class="calendar-header">
                <button class="btn btn-sm btn-outline-primary" onclick="patientDashboard.previousMonth()">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <h5 class="mb-0">${this.getMonthName(displayMonth)} ${displayYear}</h5>
                <button class="btn btn-sm btn-outline-primary" onclick="patientDashboard.nextMonth()">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
            <div class="calendar-grid">
                <div class="calendar-day text-muted">CN</div>
                <div class="calendar-day text-muted">T2</div>
                <div class="calendar-day text-muted">T3</div>
                <div class="calendar-day text-muted">T4</div>
                <div class="calendar-day text-muted">T5</div>
                <div class="calendar-day text-muted">T6</div>
                <div class="calendar-day text-muted">T7</div>
        `;
        
        for (let i = 0; i < 35; i++) { // Chỉ hiển thị 5 tuần thay vì 6 tuần
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            
            // Sửa lỗi timezone - sử dụng local date thay vì UTC
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;
            const dayOfWeek = date.getDay();
            const isToday = date.toDateString() === currentDate.toDateString();
            const isPast = date < currentDate && !isToday; // Không coi ngày hiện tại là quá khứ
            const isCurrentMonth = date.getMonth() === displayMonth;
            const isAvailable = this.isDateAvailable(dateStr);
            const isBooked = this.isDateBooked(dateStr);
            const isSelected = this.bookingData.date === dateStr;
            
            let classes = 'calendar-day';
            
            // Ngày được chọn - ưu tiên cao nhất
            if (isSelected) {
                classes += ' selected';
            }
            // Ngày hiện tại - highlight nếu không được chọn và không có ngày nào được chọn
            else if (isToday && !this.bookingData.date) {
                classes += ' today';
            }
            // Ngày trong quá khứ (không bao gồm ngày hiện tại)
            else if (isPast) {
                classes += ' past';
            }
            // Ngày hết lịch
            else if (isBooked) {
                classes += ' booked';
            }
            // Ngày có lịch trống
            else if (isAvailable && isCurrentMonth) {
                classes += ' available';
            }
            
            // Weekend styling - chỉ áp dụng cho ngày trong tháng hiện tại
            if (isCurrentMonth) {
                if (dayOfWeek === 0) classes += ' sunday'; // Chủ nhật
                if (dayOfWeek === 6) classes += ' saturday'; // Thứ 7
            }
            
            // Ngày của tháng khác - mờ hơn
            if (!isCurrentMonth) {
                classes += ' other-month';
            }
            
            calendarHTML += `
                <div class="${classes}" data-date="${dateStr}">
                    ${date.getDate()}
                </div>
            `;
        }
        
        calendarHTML += '</div>';
        return calendarHTML;
    }
    
    // Check if date is available
    isDateAvailable(dateStr) {
        // Check if there are any available time slots for this date for the selected doctor
        const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
        const dateAppointments = appointments.filter(apt => 
            apt.date === dateStr &&
            apt.status !== 'cancelled' &&
            (this.bookingData.doctorId ? apt.doctorId === this.bookingData.doctorId : true)
        );
        
        // Get all time slots for this date (per doctor)
        const allTimeSlots = app.timeSlots.length; // 12 slots per day
        
        // If less than 80% of slots are booked, date is available
        return dateAppointments.length < allTimeSlots * 0.8;
    }
    
    // Check if date is booked
    isDateBooked(dateStr) {
        // Check if all time slots are booked for this date for the selected doctor
        const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
        const dateAppointments = appointments.filter(apt => 
            apt.date === dateStr &&
            apt.status !== 'cancelled' &&
            (this.bookingData.doctorId ? apt.doctorId === this.bookingData.doctorId : true)
        );
        
        // Get all time slots for this date (per doctor)
        const allTimeSlots = app.timeSlots.length; // 12 slots per day
        
        // If more than 80% of slots are booked, mark as booked
        return dateAppointments.length >= allTimeSlots * 0.8;
    }
    
    // Get month name
    getMonthName(month) {
        const months = [
            'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
            'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
        ];
        return months[month];
    }

    // Select date
    selectDate(date) {
        console.log('=== SELECT DATE ===');
        console.log('Previous date:', this.bookingData.date);
        console.log('New date:', date);
        
        // Check if date has changed
        const dateChanged = this.bookingData.date !== date;
        
        this.bookingData.date = date;
        
        console.log('Updated booking data:', this.bookingData);
        
        // If date changed and in reschedule/rebook mode, clear the selected time slot
        if (dateChanged && (this.isRescheduleMode || this.isRebookMode)) {
            console.log('Date changed in reschedule/rebook mode, clearing selected time slot');
            this.bookingData.time = null;
            this.bookingData.timeRange = null;
        }
        
        // In rebook mode, always clear time selection when date changes (like new booking)
        if (this.isRebookMode && dateChanged) {
            console.log('Date changed in rebook mode, clearing time selection like new booking');
            this.bookingData.time = null;
            this.bookingData.timeRange = null;
        }
        
        // Regenerate calendar to show new selection
        this.loadCalendar();
        
        // Ensure calendar shows the new selection
        setTimeout(() => {
            console.log('Ensuring calendar shows new selection for date:', this.bookingData.date);
            this.restoreDateSelection();
        }, 100);
        
        // Load time slots for selected date
        this.loadTimeSlots();
        
        console.log('Date selection completed for:', date);
    }

    // Load time slots
    loadTimeSlots() {
        if (!this.bookingData.date) return;
        
        // If no doctor is selected, show message
        if (!this.bookingData.doctorId) {
            const container = document.getElementById('timeSlotsContainer');
            container.innerHTML = '<p class="text-muted">Vui lòng chọn bác sĩ trước</p>';
            return;
        }

        const container = document.getElementById('timeSlotsContainer');
        container.innerHTML = '';
        
        // Create time slots container with grid layout
        const timeSlotsDiv = document.createElement('div');
        timeSlotsDiv.className = 'time-slots';
        
        // Get current time for comparison
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTime = currentHour * 60 + currentMinute; // Convert to minutes for easy comparison
        
        // Get all time slots
        app.timeSlots.forEach(slot => {
            const timeSlotDiv = document.createElement('div');
            timeSlotDiv.className = 'time-slot';
            timeSlotDiv.innerHTML = `${slot.start} - ${slot.end}`;
            
            // Check if this time slot is in the past
            const slotHour = parseInt(slot.start.split(':')[0]);
            const slotMinute = parseInt(slot.start.split(':')[1]);
            const slotTime = slotHour * 60 + slotMinute;
            
            // Check if slot is in the past (for selected date)
            const isPast = this.isTimeSlotInPast(slot.start);
            
            console.log(`Time slot ${slot.start}: isPast=${isPast}, selectedDate=${this.bookingData.date}`);
            
            if (isPast) {
                // Past time slot - gray out and disable
                timeSlotDiv.classList.add('past');
                timeSlotDiv.style.opacity = '0.5';
                timeSlotDiv.style.cursor = 'not-allowed';
                timeSlotDiv.title = 'Khung giờ đã qua';
                console.log(`  → Disabled past slot: ${slot.start}`);
            } else {
                // Check if this is the currently selected time slot in reschedule mode
                const isCurrentlySelected = this.isRescheduleMode && 
                    this.originalTimeSlot && 
                    this.originalTimeSlot.date === this.bookingData.date && 
                    this.originalTimeSlot.time === slot.start;
                
                // In rebook mode, don't highlight any time slot as selected
                if (this.isRebookMode) {
                    // Just make it available for selection
                    timeSlotDiv.classList.add('available');
                    timeSlotDiv.onclick = () => this.selectTimeSlot(slot.start, slot.end);
                    console.log(`  → Enabled available slot for rebook: ${slot.start}`);
                } else if (isCurrentlySelected) {
                    // This is the currently selected time slot - highlight it
                    timeSlotDiv.classList.add('selected', 'reschedule-original');
                    timeSlotDiv.onclick = () => this.selectTimeSlot(slot.start, slot.end);
                    console.log(`  → Highlighted currently selected slot: ${slot.start}`);
                } else {
                    // Check if slot is available for booking
                    const isAvailable = this.isTimeSlotAvailable(slot.start, slot.end);
                    if (isAvailable) {
                        timeSlotDiv.classList.add('available');
                        timeSlotDiv.onclick = () => this.selectTimeSlot(slot.start, slot.end);
                        console.log(`  → Enabled available slot: ${slot.start}`);
                    } else {
                        timeSlotDiv.classList.add('booked');
                        console.log(`  → Disabled booked slot: ${slot.start}`);
                    }
                }
            }
            
            timeSlotsDiv.appendChild(timeSlotDiv);
        });
        
        container.appendChild(timeSlotsDiv);
    }
    
    // Check if time slot is available
    isTimeSlotAvailable(startTime, endTime) {
        const dateStr = this.bookingData.date;
        const timeStr = startTime;
        
        // Check if this slot is already booked for any doctor
        const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
        const isBooked = appointments.some(apt => 
            apt.date === dateStr && 
            apt.time === timeStr &&
            apt.status !== 'cancelled' &&
            (this.bookingData.doctorId ? apt.doctorId === this.bookingData.doctorId : true)
        );
        
        return !isBooked;
    }
    
    // Check if time slot is in the past
    isTimeSlotInPast(timeStr) {
        const selectedDate = this.bookingData.date;
        if (!selectedDate) return false;
        
        // Get current date and time
        const now = new Date();
        const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        // Get selected date
        const selectedDateObj = new Date(selectedDate);
        const selectedDateOnly = new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth(), selectedDateObj.getDate());
        
        // If selected date is not today, it's not past
        if (selectedDateOnly.getTime() !== currentDate.getTime()) {
            console.log('Selected date is not today, time slot is not past');
            return false;
        }
        
        // If it's today, check if time is in the past
        const [hours, minutes] = timeStr.split(':').map(Number);
        const slotTime = new Date();
        slotTime.setHours(hours, minutes, 0, 0);
        
        const isPast = slotTime < now;
        console.log(`Time slot ${timeStr} on today (${selectedDate}): ${isPast ? 'PAST' : 'FUTURE'}`);
        
        return isPast;
    }

    // Select time slot
    selectTimeSlot(startTime, endTime) {
        // Remove previous selection
        document.querySelectorAll('.time-slot').forEach(slot => {
            slot.classList.remove('selected');
        });

        // Add selection to clicked slot
        event.target.classList.add('selected');
        
        this.bookingData.time = startTime;
        this.bookingData.timeRange = `${startTime} - ${endTime}`;
        
        console.log('Time slot selected:', startTime, '-', endTime);
    }
    
    // Restore date selection
    restoreDateSelection() {
        console.log('=== RESTORE DATE SELECTION ===');
        console.log('Booking data date:', this.bookingData.date);
        
        if (this.bookingData.date) {
            // Remove all previous selections
            document.querySelectorAll('.calendar-day').forEach(day => {
                day.classList.remove('selected');
            });
            
            // Find the date element and select it
            const dateElements = document.querySelectorAll('.calendar-day');
            console.log('Found calendar days:', dateElements.length);
            
            dateElements.forEach(day => {
                const dayDate = day.getAttribute('data-date');
                
                // Skip header days (CN, T2, T3, T4, T5, T6, T7) which have no data-date
                if (!dayDate) {
                    console.log('Skipping header day (no data-date)');
                    return;
                }
                
                console.log('Day element date:', dayDate, 'Target date:', this.bookingData.date);
                
                if (dayDate === this.bookingData.date) {
                    day.classList.add('selected');
                    console.log('✅ Date selected successfully:', dayDate);
                }
            });
            
            // Double check if any day is selected
            const selectedDays = document.querySelectorAll('.calendar-day.selected');
            console.log('Selected days count:', selectedDays.length);
            
            // Debug: Check which days have the selected class
            selectedDays.forEach((day, index) => {
                const dayDate = day.getAttribute('data-date');
                console.log(`Selected day ${index + 1}:`, dayDate, 'Classes:', day.className);
            });
        } else {
            console.log('❌ No date in booking data');
        }
    }

    // Force highlight today's date
    forceHighlightToday() {
        console.log('=== FORCE HIGHLIGHT TODAY ===');
        
        if (!this.bookingData.date) {
            console.log('❌ No date in booking data for force highlight');
            return;
        }
        
        // Try to find and highlight today's date
        const calendarDays = document.querySelectorAll('.calendar-day');
        console.log('Found calendar days for force highlight:', calendarDays.length);
        
        let found = false;
        calendarDays.forEach(day => {
            const dayDate = day.getAttribute('data-date');
            
            // Skip header days (CN, T2, T3, T4, T5, T6, T7) which have no data-date
            if (!dayDate) {
                return;
            }
            
            if (dayDate === this.bookingData.date) {
                day.classList.add('selected');
                found = true;
                console.log('✅ Force highlighted date:', dayDate);
            }
        });
        
        if (!found) {
            console.log('❌ Could not find today\'s date in calendar');
        }
    }
    
    // Restore time selection
    restoreTimeSelection() {
        if (this.bookingData.timeRange) {
            document.querySelectorAll('.time-slot').forEach(slot => {
                slot.classList.remove('selected');
            });
            
            // Find the time slot and select it
            const timeSlots = document.querySelectorAll('.time-slot');
            timeSlots.forEach(slot => {
                if (slot.textContent.trim() === this.bookingData.timeRange) {
                    slot.classList.add('selected');
                }
            });
        } else if (this.isRescheduleMode && this.originalTimeSlot) {
            // In reschedule mode, highlight the original time slot if no new one is selected
            const timeSlots = document.querySelectorAll('.time-slot');
            timeSlots.forEach(slot => {
                if (slot.textContent.trim() === this.originalTimeSlot.timeRange) {
                    slot.classList.add('selected');
                }
            });
        }
        // In rebook mode, don't restore any time selection - user must choose
    }

    // Next step
    nextStep() {
        // Validate current step before proceeding
        if (!this.validateCurrentStep()) {
            return;
        }
        
        if (this.isRescheduleMode || this.isRebookMode) {
            // In reschedule/rebook mode, allow going to any step
            if (this.currentStep < 4) {
                this.currentStep++;
                this.updateProgressSteps();
                this.showStep(this.currentStep);
            }
        } else {
            // Normal mode
            if (this.currentStep < 4) {
                this.currentStep++;
                this.updateProgressSteps();
                this.showStep(this.currentStep);
            }
        }
    }
    
    // Validate current step
    validateCurrentStep() {
        console.log('Validating step:', this.currentStep);
        console.log('Booking data:', this.bookingData);
        
        switch (this.currentStep) {
            case 1: // Specialty selection
                if (!this.bookingData.specialty) {
                    app.showWarning('Vui lòng chọn chuyên khoa');
                    return false;
                }
                break;
            case 2: // Doctor selection
                if (!this.bookingData.doctorId) {
                    app.showWarning('Vui lòng chọn bác sĩ');
                    return false;
                }
                break;
            case 3: // Date and time selection
                if (!this.bookingData.date) {
                    app.showWarning('Vui lòng chọn ngày khám');
                    return false;
                }
                if (!this.bookingData.time) {
                    if (this.isRescheduleMode) {
                        app.showWarning('Vui lòng chọn giờ khám mới cho ngày đã chọn');
                    } else if (this.isRebookMode) {
                        app.showWarning('Vui lòng chọn giờ khám cho ngày đã chọn (giống như đặt lịch khám mới)');
                    } else {
                        app.showWarning('Vui lòng chọn giờ khám');
                    }
                    return false;
                }
                break;
        }
        return true;
    }

    // Previous step
    prevStep() {
        if (this.isRescheduleMode || this.isRebookMode) {
            // In reschedule/rebook mode, allow going back to any step
            if (this.currentStep > 1) {
                this.currentStep--;
                this.updateProgressSteps();
                this.showStep(this.currentStep);
            }
        } else {
            // Normal mode
            if (this.currentStep > 1) {
                this.currentStep--;
                this.updateProgressSteps();
                this.showStep(this.currentStep);
            }
        }
    }

    // Update progress steps
    updateProgressSteps() {
        for (let i = 1; i <= 4; i++) {
            const stepNumber = document.getElementById(`step${i}`);
            stepNumber.className = 'step-number';
            
            if (this.isRescheduleMode || this.isRebookMode) {
                // In reschedule/rebook mode, show current step as active
                if (i < this.currentStep) {
                    stepNumber.classList.add('completed');
                } else if (i === this.currentStep) {
                    stepNumber.classList.add('active');
                }
            } else {
                // Normal mode
                if (i < this.currentStep) {
                    stepNumber.classList.add('completed');
                } else if (i === this.currentStep) {
                    stepNumber.classList.add('active');
                }
            }
        }
    }

    // Show step
    showStep(step) {
        // Hide all steps
        for (let i = 1; i <= 4; i++) {
            document.getElementById(`step${i}Content`).style.display = 'none';
        }

        // Show current step
        document.getElementById(`step${step}Content`).style.display = 'block';

        // Update buttons
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const confirmBtn = document.getElementById('confirmBtn');

        prevBtn.style.display = step > 1 ? 'inline-block' : 'none';
        nextBtn.style.display = step < 4 ? 'inline-block' : 'none';
        confirmBtn.style.display = step === 4 ? 'inline-block' : 'none';

        // Load step content and restore selections
        switch (step) {
            case 1:
                if (!this.isRescheduleMode) {
                    this.loadSpecialties();
                    this.restoreSpecialtySelection();
                }
                break;
            case 2:
                if (!this.isRescheduleMode) {
                    this.loadDoctors();
                    this.restoreDoctorSelection();
                }
                break;
            case 3:
                this.loadCalendar();
                this.restoreDateSelection();
                this.restoreTimeSelection();
                break;
            case 4:
                this.loadConfirmation();
                break;
        }
        
        // In reschedule mode, load content for steps 1 and 2 but don't auto-skip
        if (this.isRescheduleMode) {
            if (step === 1) {
                this.loadSpecialties();
                this.restoreSpecialtySelection();
            } else if (step === 2) {
                this.loadDoctors();
                this.restoreDoctorSelection();
            }
        }
        
        // In rebook mode, load content for steps 1 and 2 but don't auto-skip
        if (this.isRebookMode) {
            if (step === 1) {
                this.loadSpecialties();
                this.restoreSpecialtySelection();
            } else if (step === 2) {
                this.loadDoctors();
                this.restoreDoctorSelection();
            }
        }
    }

    // Load confirmation
    loadConfirmation() {
        const specialty = app.specialties.find(s => s.id === this.bookingData.specialty);
        const doctor = app.doctors.find(d => d.id === this.bookingData.doctorId);

        // Hospital name is fixed as "Bệnh viện VTK"
        document.getElementById('confirmHospital').textContent = 'Bệnh viện VTK';
        document.getElementById('confirmSpecialty').textContent = specialty.name;
        document.getElementById('confirmDoctor').textContent = doctor.name;
        document.getElementById('confirmDate').textContent = app.formatDate(this.bookingData.date);
        document.getElementById('confirmTime').textContent = this.bookingData.timeRange || this.bookingData.time;
        
        // Show/hide reschedule/rebook info based on mode
        const rescheduleInfo = document.getElementById('rescheduleInfo');
        if (rescheduleInfo) {
            if (this.isRescheduleMode) {
                rescheduleInfo.style.display = 'block';
                rescheduleInfo.innerHTML = `
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle me-2"></i>
                        <strong>Lưu ý:</strong> Bạn đang thay đổi lịch khám. Lịch khám cũ sẽ được cập nhật với thông tin mới.
                    </div>
                `;
            } else if (this.isRebookMode) {
                rescheduleInfo.style.display = 'block';
                rescheduleInfo.innerHTML = `
                    <div class="alert alert-success">
                        <i class="fas fa-redo me-2"></i>
                        <strong>Lưu ý:</strong> Bạn đang đặt lại lịch khám. Một lịch khám mới sẽ được tạo với thông tin tương tự.<br>
                        <small class="text-muted">Ngày hiện tại được chọn mặc định, bạn cần chọn lại khung giờ khám.</small>
                    </div>
                `;
            } else {
                rescheduleInfo.style.display = 'none';
            }
        }
    }

    // Confirm booking
    confirmBooking() {
        const notes = document.getElementById('appointmentNotes').value;
        this.bookingData.notes = notes;

        // Validate booking data
        const errors = app.validateForm(this.bookingData);
        if (errors.length > 0) {
            app.showError(errors.join('\n'));
            return;
        }

        if (this.isRescheduleMode) {
            // Handle reschedule
            this.handleReschedule();
        } else if (this.isRebookMode) {
            // Handle rebook
            this.handleRebook();
        } else {
            // Handle new booking
            this.handleNewBooking();
        }
    }
    
    // Handle new booking
    handleNewBooking() {
        const currentUser = auth.getCurrentUser();
        const specialty = app.specialties.find(s => s.id === this.bookingData.specialty);
        const doctor = app.doctors.find(d => d.id === this.bookingData.doctorId);

        const appointmentData = {
            patientId: currentUser.id,
            patientName: currentUser.name,
            hospitalId: 1, // Fixed VTK Hospital ID
            hospitalName: 'Bệnh viện VTK',
            doctorId: this.bookingData.doctorId,
            doctorName: doctor.name,
            specialty: specialty.name,
            date: this.bookingData.date,
            time: this.bookingData.time,
            timeRange: this.bookingData.timeRange,
            notes: this.bookingData.notes,
            status: 'upcoming'
        };

        const newAppointment = app.createAppointment(appointmentData);

                // Close modal and show success message
        const bookingModal = bootstrap.Modal.getInstance(document.getElementById('bookingModal'));
        bookingModal.hide();
        
        // Remove reschedule/rebook modal classes if any
        const modalElement = document.getElementById('bookingModal');
        modalElement.classList.remove('reschedule-modal', 'rebook-modal');
        const modalDialog = modalElement.querySelector('.modal-dialog');
        if (modalDialog) {
            modalDialog.classList.remove('reschedule-modal', 'rebook-modal');
        }
        
        app.showSuccess('Đặt lịch khám thành công!');
        
        // Reload dashboard immediately
        this.loadDashboard();
        
        // Also reload after a short delay to ensure data is saved
        setTimeout(() => {
            this.loadDashboard();
        }, 500);
    }
    
    // Handle reschedule
    handleReschedule() {
        console.log('=== HANDLE RESCHEDULE ===');
        console.log('Reschedule appointment ID:', this.rescheduleAppointmentId);
        console.log('New booking data:', this.bookingData);
        
        // Get the original appointment
        const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
        const originalAppointmentIndex = appointments.findIndex(apt => apt.id === this.rescheduleAppointmentId);
        
        if (originalAppointmentIndex === -1) {
            app.showError('Không tìm thấy lịch khám gốc');
            return;
        }
        
        const originalAppointment = appointments[originalAppointmentIndex];
        
        // Update the original appointment with new date/time
        appointments[originalAppointmentIndex] = {
            ...originalAppointment,
            date: this.bookingData.date,
            time: this.bookingData.time,
            timeRange: this.bookingData.timeRange,
            notes: this.bookingData.notes,
            rescheduledAt: new Date().toISOString(),
            originalDate: originalAppointment.date,
            originalTime: originalAppointment.time
        };
        
        // Save updated appointments
        localStorage.setItem('appointments', JSON.stringify(appointments));
        
        // Close modal and show success message
        const bookingModal = bootstrap.Modal.getInstance(document.getElementById('bookingModal'));
        bookingModal.hide();
        
        // Remove reschedule modal classes
        const modalElement = document.getElementById('bookingModal');
        modalElement.classList.remove('reschedule-modal');
        const modalDialog = modalElement.querySelector('.modal-dialog');
        if (modalDialog) {
            modalDialog.classList.remove('reschedule-modal');
        }
        
        app.showSuccess('Dời lịch khám thành công!');
        
        // Reset reschedule mode
        this.isRescheduleMode = false;
        this.rescheduleAppointmentId = null;
        this.originalTimeSlot = null;
        
        // Also reset rebook mode
        this.isRebookMode = false;
        this.rebookAppointmentId = null;
        
        // Reload dashboard
        this.loadDashboard();
        
        // Also reload after a short delay to ensure data is saved
        setTimeout(() => {
            this.loadDashboard();
        }, 500);
    }
    
    // Handle rebook
    handleRebook() {
        console.log('=== HANDLE REBOOK ===');
        console.log('Rebook appointment ID:', this.rebookAppointmentId);
        console.log('New booking data:', this.bookingData);
        
        // Create new appointment with the same data
        const currentUser = auth.getCurrentUser();
        const specialty = app.specialties.find(s => s.id === this.bookingData.specialty);
        const doctor = app.doctors.find(d => d.id === this.bookingData.doctorId);

        const appointmentData = {
            patientId: currentUser.id,
            patientName: currentUser.name,
            hospitalId: 1, // Fixed VTK Hospital ID
            hospitalName: 'Bệnh viện VTK',
            doctorId: this.bookingData.doctorId,
            doctorName: doctor.name,
            specialty: specialty.name,
            date: this.bookingData.date,
            time: this.bookingData.time,
            timeRange: this.bookingData.timeRange,
            notes: this.bookingData.notes,
            status: 'upcoming',
            rebookedFrom: this.rebookAppointmentId // Track that this is a rebook
        };

        const newAppointment = app.createAppointment(appointmentData);

        // Close modal and show success message
        const bookingModal = bootstrap.Modal.getInstance(document.getElementById('bookingModal'));
        bookingModal.hide();
        
        // Remove rebook/reschedule modal classes if any
        const modalElement = document.getElementById('bookingModal');
        modalElement.classList.remove('rebook-modal', 'reschedule-modal');
        const modalDialog = modalElement.querySelector('.modal-dialog');
        if (modalDialog) {
            modalDialog.classList.remove('rebook-modal', 'reschedule-modal');
        }
        
        app.showSuccess('Đặt lại lịch khám thành công!');
        
        // Reset rebook mode
        this.isRebookMode = false;
        this.rebookAppointmentId = null;
        
        // Reload dashboard
        this.loadDashboard();
        
        // Also reload after a short delay to ensure data is saved
        setTimeout(() => {
            this.loadDashboard();
        }, 500);
    }

    // Show appointment history with tab navigation
    showAppointmentHistory() {
        console.log('=== SHOW APPOINTMENT HISTORY ===');
        
        const currentUser = auth.getCurrentUser();
        console.log('Current user:', currentUser);
        
        let appointments = [];
        if (typeof app !== 'undefined' && app.getAppointments) {
            appointments = app.getAppointments(currentUser.id, 'patient');
            console.log('Appointments from app.getAppointments:', appointments);
        } else {
            // Fallback: get from localStorage directly
            const appointmentsStr = localStorage.getItem('appointments');
            if (appointmentsStr) {
                const allAppointments = JSON.parse(appointmentsStr);
                appointments = allAppointments.filter(apt => apt.patientId === currentUser.id);
                console.log('Appointments from localStorage:', appointments);
            }
        }
        
        console.log('Final appointments for history:', appointments);
        
        if (appointments.length === 0) {
            console.log('No appointments - showing empty state');
            // Show empty state for all tabs
            document.getElementById('upcomingAppointments').innerHTML = this.getEmptyStateHTML();
            document.getElementById('completedAppointments').innerHTML = this.getEmptyStateHTML();
            document.getElementById('cancelledAppointments').innerHTML = this.getEmptyStateHTML();
        } else {
            // Process overdue appointments first
            appointments = this.processOverdueAppointments(appointments);
            
            // Sort appointments by date (newest first)
            appointments.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            // Categorize appointments
            const upcoming = appointments.filter(apt => 
                apt.status === 'upcoming' || apt.status === 'ongoing'
            );
            
            const completed = appointments.filter(apt => 
                apt.status === 'completed' || apt.status === 'examined'
            );
            
            const cancelled = appointments.filter(apt => 
                apt.status === 'cancelled'
            );
            
            // Process overdue appointments before categorization
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            
            appointments.forEach(apt => {
                if (apt.status === 'upcoming') {
                    const aptDate = new Date(apt.date);
                    const aptDateOnly = new Date(aptDate.getFullYear(), aptDate.getMonth(), aptDate.getDate());
                    const daysDiff = Math.floor((today - aptDateOnly) / (1000 * 60 * 60 * 24));
                    
                    // If overdue by 1 day or more, update status
                    if (daysDiff >= 1) {
                        this.updateAppointmentStatusToCompleted(apt.id);
                        apt.status = 'completed';
                        apt.overdueAutoCompleted = true;
                    }
                }
            });
            
            console.log('Categorized appointments:');
            console.log('- Upcoming:', upcoming);
            console.log('- Completed:', completed);
            console.log('- Cancelled:', cancelled);
            
            // Sort upcoming: ongoing first, then upcoming by date asc, then by time asc
            upcoming.sort((a, b) => {
                // First priority: ongoing appointments
                if (a.status === 'ongoing' && b.status !== 'ongoing') return -1;
                if (a.status !== 'ongoing' && b.status === 'ongoing') return 1;
                
                // Second priority: date (ascending for upcoming appointments)
                const dateComparison = new Date(a.date) - new Date(b.date);
                if (dateComparison !== 0) {
                    return dateComparison;
                }
                
                // Third priority: time (ascending) if same date
                return (a.time || a.timeRange || '').localeCompare(b.time || b.timeRange || '');
            });
            
            console.log('Sorted upcoming appointments:', upcoming);
            
            // Load each tab
            this.loadUpcomingTab(upcoming);
            this.loadCompletedTab(completed);
            this.loadCancelledTab(cancelled);
        }

        const historyModal = new bootstrap.Modal(document.getElementById('historyModal'));
        historyModal.show();
        
        // Add event listener for tab changes
        document.querySelectorAll('#historyTabs .nav-link').forEach(tab => {
            tab.addEventListener('shown.bs.tab', (e) => {
                console.log('Tab changed to:', e.target.getAttribute('data-bs-target'));
                // Reload content for the active tab
                this.reloadActiveTab();
            });
        });
        
        // Initial load for active tab
        setTimeout(() => {
            this.reloadActiveTab();
        }, 100);
    }
    
    // Load upcoming tab
    loadUpcomingTab(appointments) {
        console.log('=== LOAD UPCOMING TAB ===');
        console.log('Appointments to load:', appointments);
        
        // Apply same sorting logic as dashboard upcoming appointments
        const sortedAppointments = appointments
            .filter(apt => apt.status === 'upcoming')
            .sort((a, b) => {
                // First sort by date (ascending)
                const dateComparison = new Date(a.date) - new Date(b.date);
                if (dateComparison !== 0) {
                    return dateComparison;
                }
                // If same date, sort by time (ascending)
                return (a.time || a.timeRange || '').localeCompare(b.time || b.timeRange || '');
            });
        
        console.log('Sorted appointments:', sortedAppointments);
        
        const container = document.getElementById('upcomingAppointments');
        console.log('Container element:', container);
        
        if (sortedAppointments.length === 0) {
            console.log('No upcoming appointments - showing empty state');
            container.innerHTML = this.getEmptyStateHTML();
            return;
        }
        
        console.log('Generating HTML for', sortedAppointments.length, 'appointments...');
        
        container.innerHTML = sortedAppointments.map(appointment => {
            try {
                console.log('Processing appointment:', appointment);
                
                const statusClass = this.getStatusClass(appointment.status);
                const statusText = this.getStatusText(appointment.status);
                
                console.log('Status class:', statusClass, 'Status text:', statusText);
            
            const html = `
                <div class="appointment-item ${statusClass} mb-3">
                    <div class="row">
                        <div class="col-md-8">
                            <div class="appointment-info-grid">
                                <div class="appointment-info-left">
                                    <div class="appointment-info-item">
                                        <span class="appointment-info-label">Bệnh viện:</span>
                                        <span class="appointment-info-value">${appointment.hospitalName || 'Bệnh viện'}</span>
                                    </div>
                                    <div class="appointment-info-item">
                                        <span class="appointment-info-label">Khoa:</span>
                                        <span class="appointment-info-value">${appointment.specialty}</span>
                                    </div>
                                    <div class="appointment-info-item">
                                        <span class="appointment-info-label">Bác sĩ:</span>
                                        <span class="appointment-info-value">${appointment.doctorName}</span>
                                    </div>
                                </div>
                                <div class="appointment-info-right">
                                    <div class="appointment-info-item">
                                        <span class="appointment-info-label">Ngày khám:</span>
                                        <span class="appointment-info-value">${app.formatDate(appointment.date)}</span>
                                    </div>
                                    <div class="appointment-info-item">
                                        <span class="appointment-info-label">Giờ khám:</span>
                                        <span class="appointment-info-value">${appointment.timeRange || appointment.time}</span>
                                    </div>
                                    <div class="appointment-info-item">
                                        <span class="appointment-info-label">Ghi chú:</span>
                                        <span class="appointment-info-value">${appointment.notes || 'Không có'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4 text-end">
                            <div class="action-buttons">
                                <button class="btn btn-warning" onclick="rescheduleAppointment(${appointment.id})">
                                    <i class="fas fa-calendar-alt me-1"></i>Dời lịch
                                </button>
                                <button class="btn btn-danger" onclick="cancelAppointment(${appointment.id})">
                                    <i class="fas fa-times me-1"></i>Hủy lịch
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
                console.log('Generated HTML for appointment', appointment.id, ':', html.substring(0, 100) + '...');
                return html;
            } catch (error) {
                console.error('Error processing appointment:', appointment.id, error);
                return `<div class="alert alert-danger">Error loading appointment ${appointment.id}: ${error.message}</div>`;
            }
        }).join('');
        
        console.log('Final HTML length:', container.innerHTML.length);
        console.log('Container innerHTML preview:', container.innerHTML.substring(0, 200) + '...');
        
        // Debug container visibility
        console.log('Container display:', window.getComputedStyle(container).display);
        console.log('Container visibility:', window.getComputedStyle(container).visibility);
        console.log('Container height:', window.getComputedStyle(container).height);
        console.log('Container parent display:', window.getComputedStyle(container.parentElement).display);
        
        const tabPane = container.closest('.tab-pane');
        if (tabPane) {
            console.log('Tab pane classes:', tabPane.className);
        } else {
            console.log('Tab pane not found');
        }
    }
    
    // Load completed tab
    loadCompletedTab(appointments) {
        // Apply same sorting logic as dashboard recent appointments
        const sortedAppointments = appointments
            .filter(apt => apt.status === 'completed')
            .sort((a, b) => {
                // First sort by date (descending - newest first)
                const dateComparison = new Date(b.date) - new Date(a.date);
                if (dateComparison !== 0) {
                    return dateComparison;
                }
                // If same date, sort by time (ascending)
                return (a.time || a.timeRange || '').localeCompare(b.time || b.timeRange || '');
            });
        
        const container = document.getElementById('completedAppointments');
        
        if (sortedAppointments.length === 0) {
            container.innerHTML = this.getEmptyStateHTML();
            return;
        }
        
        container.innerHTML = sortedAppointments.map(appointment => {
            const statusClass = this.getStatusClass(appointment.status);
            const statusText = this.getStatusText(appointment.status);
            
            return `
                <div class="appointment-item ${statusClass} mb-3">
                    <div class="row">
                        <div class="col-md-8">
                            <div class="appointment-info-grid">
                                <div class="appointment-info-left">
                                    <div class="appointment-info-item">
                                        <span class="appointment-info-label">Bệnh viện:</span>
                                        <span class="appointment-info-value">${appointment.hospitalName || 'Bệnh viện'}</span>
                                    </div>
                                    <div class="appointment-info-item">
                                        <span class="appointment-info-label">Khoa:</span>
                                        <span class="appointment-info-value">${appointment.specialty}</span>
                                    </div>
                                    <div class="appointment-info-item">
                                        <span class="appointment-info-label">Bác sĩ:</span>
                                        <span class="appointment-info-value">${appointment.doctorName}</span>
                                    </div>
                                </div>
                                <div class="appointment-info-right">
                                    <div class="appointment-info-item">
                                        <span class="appointment-info-label">Ngày khám:</span>
                                        <span class="appointment-info-value">${app.formatDate(appointment.date)}</span>
                                    </div>
                                    <div class="appointment-info-item">
                                        <span class="appointment-info-label">Giờ khám:</span>
                                        <span class="appointment-info-value">${appointment.timeRange || appointment.time}</span>
                                    </div>
                                    <div class="appointment-info-item">
                                        <span class="appointment-info-label">Ghi chú:</span>
                                        <span class="appointment-info-value">${appointment.notes || 'Không có'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4 text-end">
                            <div class="action-buttons">
                                <button class="btn btn-primary" onclick="rebookAppointment(${appointment.id})">
                                    <i class="fas fa-redo me-1"></i>Đặt lại
                                </button>
                                ${appointment.status === 'examined' ? `
                                    <button class="btn btn-success" onclick="showReviewModal(${appointment.id})">
                                        <i class="fas fa-star me-1"></i>Đánh giá
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    // Load cancelled tab
    loadCancelledTab(appointments) {
        // Apply same sorting logic as dashboard recent appointments
        const sortedAppointments = appointments
            .filter(apt => apt.status === 'cancelled')
            .sort((a, b) => {
                // First sort by date (descending - newest first)
                const dateComparison = new Date(b.date) - new Date(a.date);
                if (dateComparison !== 0) {
                    return dateComparison;
                }
                // If same date, sort by time (ascending)
                return (a.time || a.timeRange || '').localeCompare(b.time || b.timeRange || '');
            });
        
        const container = document.getElementById('cancelledAppointments');
        
        if (sortedAppointments.length === 0) {
            container.innerHTML = this.getEmptyStateHTML();
            return;
        }
            
        container.innerHTML = sortedAppointments.map(appointment => {
            const statusClass = this.getStatusClass(appointment.status);
            const statusText = this.getStatusText(appointment.status);
            
            return `
                <div class="appointment-item ${statusClass} mb-3">
                    <div class="row">
                        <div class="col-md-8">
                            <div class="appointment-info-grid">
                                <div class="appointment-info-left">
                                    <div class="appointment-info-item">
                                        <span class="appointment-info-label">Bệnh viện:</span>
                                        <span class="appointment-info-value">${appointment.hospitalName || 'Bệnh viện'}</span>
                                    </div>
                                    <div class="appointment-info-item">
                                        <span class="appointment-info-label">Khoa:</span>
                                        <span class="appointment-info-value">${appointment.specialty}</span>
                                    </div>
                                    <div class="appointment-info-item">
                                        <span class="appointment-info-label">Bác sĩ:</span>
                                        <span class="appointment-info-value">${appointment.doctorName}</span>
                                    </div>
                                </div>
                                <div class="appointment-info-right">
                                    <div class="appointment-info-item">
                                        <span class="appointment-info-label">Ngày khám:</span>
                                        <span class="appointment-info-value">${app.formatDate(appointment.date)}</span>
                                    </div>
                                    <div class="appointment-info-item">
                                        <span class="appointment-info-label">Giờ khám:</span>
                                        <span class="appointment-info-value">${appointment.timeRange || appointment.time}</span>
                                    </div>
                                    <div class="appointment-info-item">
                                        <span class="appointment-info-label">Ghi chú:</span>
                                        <span class="appointment-info-value">${appointment.notes || 'Không có'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4 text-end">
                            <div class="action-buttons">
                                <button class="btn btn-primary" onclick="rebookAppointment(${appointment.id})">
                                    <i class="fas fa-redo me-1"></i>Đặt lại
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    // Get empty state HTML
    getEmptyStateHTML() {
        return `
            <div class="text-center py-4">
                <i class="fas fa-calendar-times fa-3x text-muted mb-3"></i>
                <h5 class="text-muted">Chưa có dữ liệu</h5>
                <p class="text-muted">Bạn chưa có lịch khám nào trong danh mục này.</p>
            </div>
        `;
    }
    
    // Reload active tab content
    reloadActiveTab() {
        console.log('=== RELOAD ACTIVE TAB ===');
        
        const currentUser = auth.getCurrentUser();
        let appointments = [];
        
        if (typeof app !== 'undefined' && app.getAppointments) {
            appointments = app.getAppointments(currentUser.id, 'patient');
        } else {
            const appointmentsStr = localStorage.getItem('appointments');
            if (appointmentsStr) {
                const allAppointments = JSON.parse(appointmentsStr);
                appointments = allAppointments.filter(apt => apt.patientId === currentUser.id);
            }
        }
        
        // Get active tab
        const activeTab = document.querySelector('#historyTabs .nav-link.active');
        const activeTabId = activeTab ? activeTab.getAttribute('data-bs-target') : '#upcoming';
        
        console.log('Active tab:', activeTabId);
        
        // Process overdue appointments first
        appointments = this.processOverdueAppointments(appointments);
        
        // Categorize appointments
        const upcoming = appointments.filter(apt => apt.status === 'upcoming' || apt.status === 'ongoing');
        const completed = appointments.filter(apt => apt.status === 'completed' || apt.status === 'examined');
        const cancelled = appointments.filter(apt => apt.status === 'cancelled');
        
        // Sort upcoming
        upcoming.sort((a, b) => {
            // First priority: ongoing appointments
            if (a.status === 'ongoing' && b.status !== 'ongoing') return -1;
            if (a.status !== 'ongoing' && b.status === 'ongoing') return 1;
            
            // Second priority: date (ascending for upcoming appointments)
            const dateComparison = new Date(a.date) - new Date(b.date);
            if (dateComparison !== 0) {
                return dateComparison;
            }
            
            // Third priority: time (ascending) if same date
            return (a.time || a.timeRange || '').localeCompare(b.time || b.timeRange || '');
        });
        
        // Load appropriate tab content
        switch (activeTabId) {
            case '#upcoming':
                this.loadUpcomingTab(upcoming);
                break;
            case '#completed':
                this.loadCompletedTab(completed);
                break;
            case '#cancelled':
                this.loadCancelledTab(cancelled);
                break;
        }
    }
    
    // Get status class for styling
    getStatusClass(status) {
        switch (status) {
            case 'upcoming': return 'upcoming';
            case 'ongoing': return 'ongoing';
            case 'completed': return 'completed';
            case 'examined': return 'examined';
            case 'cancelled': return 'cancelled';
            default: return 'upcoming';
        }
    }
    
    // Get status text for display
    getStatusText(status) {
        switch (status) {
            case 'upcoming': return 'Sắp tới';
            case 'ongoing': return 'Đang diễn ra';
            case 'completed': return 'Đã hoàn thành';
            case 'examined': return 'Đã khám';
            case 'cancelled': return 'Đã hủy';
            default: return 'Sắp tới';
        }
    }

    // Set rating
    setRating(rating) {
        this.selectedRating = rating;
        
        // Update star display
        document.querySelectorAll('.star').forEach((star, index) => {
            if (index < rating) {
                star.classList.add('text-warning');
            } else {
                star.classList.remove('text-warning');
            }
        });
    }

    // Submit review
    submitReview() {
        const reviewText = document.getElementById('reviewText').value;
        
        if (this.selectedRating === 0) {
            app.showError('Vui lòng chọn đánh giá');
            return;
        }

        const appointmentId = parseInt(document.getElementById('reviewAppointmentId').value);
        const success = app.addReview(appointmentId, this.selectedRating, reviewText);

        if (success) {
            // Close modal
            const reviewModal = bootstrap.Modal.getInstance(document.getElementById('reviewModal'));
            reviewModal.hide();

            app.showSuccess('Cảm ơn bạn đã đánh giá!');
            
            // Reload dashboard
            setTimeout(() => {
                this.loadDashboard();
            }, 1000);
        } else {
            app.showError('Có lỗi xảy ra khi gửi đánh giá');
        }
    }

    // Pagination functions for upcoming appointments
    updateUpcomingPagination(totalItems, totalPages) {
        const pagination = document.getElementById('upcomingPagination');
        const prevBtn = document.getElementById('upcomingPrevBtn');
        const nextBtn = document.getElementById('upcomingNextBtn');
        const pageInfo = document.getElementById('upcomingPageInfo');

        if (totalItems <= this.itemsPerPage) {
            pagination.style.display = 'none';
            return;
        }

        pagination.style.display = 'flex';
        pageInfo.textContent = `${this.upcomingPage}/${totalPages}`;
        
        prevBtn.disabled = this.upcomingPage <= 1;
        nextBtn.disabled = this.upcomingPage >= totalPages;
    }

    previousUpcomingPage() {
        if (this.upcomingPage > 1) {
            this.upcomingPage--;
            this.loadDashboard();
        }
    }

    nextUpcomingPage() {
        const appointments = this.getCurrentUserAppointments();
        const upcoming = appointments.filter(apt => apt.status === 'upcoming');
        const totalPages = Math.ceil(upcoming.length / this.itemsPerPage);
        
        if (this.upcomingPage < totalPages) {
            this.upcomingPage++;
            this.loadDashboard();
        }
    }

    // Pagination functions for recent appointments
    updateRecentPagination(totalItems, totalPages) {
        const pagination = document.getElementById('recentPagination');
        const prevBtn = document.getElementById('recentPrevBtn');
        const nextBtn = document.getElementById('recentNextBtn');
        const pageInfo = document.getElementById('recentPageInfo');

        if (totalItems <= this.itemsPerPage) {
            pagination.style.display = 'none';
            return;
        }

        pagination.style.display = 'flex';
        pageInfo.textContent = `${this.recentPage}/${totalPages}`;
        
        prevBtn.disabled = this.recentPage <= 1;
        nextBtn.disabled = this.recentPage >= totalPages;
    }

    previousRecentPage() {
        if (this.recentPage > 1) {
            this.recentPage--;
            this.loadDashboard();
        }
    }

    nextRecentPage() {
        const appointments = this.getCurrentUserAppointments();
        const recent = appointments.filter(apt => apt.status === 'completed');
        const totalPages = Math.ceil(recent.length / this.itemsPerPage);
        
        if (this.recentPage < totalPages) {
            this.recentPage++;
            this.loadDashboard();
        }
    }

    // Helper function to get current user appointments
    getCurrentUserAppointments() {
        const currentUser = auth.getCurrentUser();
        if (!currentUser) return [];
        
        if (typeof app !== 'undefined' && app.getAppointments) {
            return app.getAppointments(currentUser.id, 'patient');
        } else {
            const appointmentsStr = localStorage.getItem('appointments');
            if (appointmentsStr) {
                const allAppointments = JSON.parse(appointmentsStr);
                return allAppointments.filter(apt => apt.patientId === currentUser.id);
            }
        }
        return [];
    }

    // Update appointment status to completed when overdue
    updateAppointmentStatusToCompleted(appointmentId) {
        const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
        const appointmentIndex = appointments.findIndex(apt => apt.id === appointmentId);
        
        if (appointmentIndex !== -1) {
            appointments[appointmentIndex].status = 'completed';
            appointments[appointmentIndex].overdueAutoCompleted = true; // Mark as auto-completed
            localStorage.setItem('appointments', JSON.stringify(appointments));
            console.log(`Appointment ${appointmentId} auto-completed due to being overdue`);
        }
    }

    // Helper function to process overdue appointments
    processOverdueAppointments(appointments) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        appointments.forEach(apt => {
            if (apt.status === 'upcoming') {
                const aptDate = new Date(apt.date);
                const aptDateOnly = new Date(aptDate.getFullYear(), aptDate.getMonth(), aptDate.getDate());
                const daysDiff = Math.floor((today - aptDateOnly) / (1000 * 60 * 60 * 24));
                
                // If overdue by 1 day or more, update status
                if (daysDiff >= 1) {
                    this.updateAppointmentStatusToCompleted(apt.id);
                    apt.status = 'completed';
                    apt.overdueAutoCompleted = true;
                }
            }
        });
        
        return appointments;
    }
}

// Global functions for onclick handlers
function showBookingForm() {
    console.log('showBookingForm called');
    console.log('patientDashboard:', patientDashboard);
    console.log('auth:', typeof auth !== 'undefined' ? 'exists' : 'undefined');
    console.log('app:', typeof app !== 'undefined' ? app : 'undefined');
    
    if (typeof patientDashboard !== 'undefined') {
        patientDashboard.showBookingForm();
    } else {
        console.log('patientDashboard is undefined, trying to initialize...');
        // Try to initialize again
        if (typeof auth !== 'undefined' && typeof app !== 'undefined' && app.hospitals) {
            patientDashboard = new PatientDashboard();
            patientDashboard.showBookingForm();
        } else {
            // Fallback: show modal directly
            console.log('Showing modal directly as fallback...');
            const bookingModalElement = document.getElementById('bookingModal');
            if (bookingModalElement) {
                if (typeof bootstrap !== 'undefined') {
                    const bookingModal = new bootstrap.Modal(bookingModalElement);
                    bookingModal.show();
                } else {
                    // Manual modal display
                    bookingModalElement.style.display = 'block';
                    bookingModalElement.classList.add('show');
                    document.body.classList.add('modal-open');
                }
            } else {
                alert('Hệ thống chưa sẵn sàng. Vui lòng thử lại.');
            }
        }
    }
}

function showAppointmentHistory() {
    patientDashboard.showAppointmentHistory();
}



function selectSpecialty(specialtyId) {
    patientDashboard.selectSpecialty(specialtyId);
}

function selectDoctor(doctorId) {
    patientDashboard.selectDoctor(doctorId);
}

function selectTimeSlot(startTime, endTime) {
    patientDashboard.selectTimeSlot(startTime, endTime);
}

function cancelAppointment(appointmentId) {
    app.showConfirmation('Bạn có chắc chắn muốn hủy lịch khám này?', () => {
        const success = app.updateAppointmentStatus(appointmentId, 'cancelled');
        if (success) {
            app.showSuccess('Đã hủy lịch khám thành công');
            patientDashboard.loadDashboard();
        } else {
            app.showError('Có lỗi xảy ra khi hủy lịch khám');
        }
    });
}

function showReviewModal(appointmentId) {
    document.getElementById('reviewAppointmentId').value = appointmentId;
    document.getElementById('reviewText').value = '';
    patientDashboard.selectedRating = 0;
    
    // Reset stars
    document.querySelectorAll('.star').forEach(star => {
        star.classList.remove('text-warning');
    });

    const reviewModal = new bootstrap.Modal(document.getElementById('reviewModal'));
    reviewModal.show();
}

function rescheduleAppointment(appointmentId) {
    console.log('=== RESCHEDULE APPOINTMENT ===');
    console.log('Appointment ID:', appointmentId);
    
    // Get appointment data
    const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    const appointment = appointments.find(apt => apt.id === appointmentId);
    
    if (!appointment) {
        app.showError('Không tìm thấy lịch khám');
        return;
    }
    
    console.log('Appointment to reschedule:', appointment);
    
    // Show confirmation dialog with high z-index
    Swal.fire({
        title: 'Dời lịch khám',
        text: `Bạn có muốn dời lịch khám với bác sĩ ${appointment.doctorName} không?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Có, dời lịch',
        cancelButtonText: 'Hủy',
        confirmButtonColor: '#ffc107',
        cancelButtonColor: '#6c757d',
        customClass: {
            container: 'swal2-high-zindex',
            popup: 'swal2-high-zindex'
        }
    }).then((result) => {
        if (result.isConfirmed) {
            // Open reschedule modal
            showRescheduleModal(appointment);
        }
    });
}

function rebookAppointment(appointmentId) {
    console.log('=== REBOOK APPOINTMENT ===');
    console.log('Appointment ID:', appointmentId);
    
    // Get appointment data
    const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    const appointment = appointments.find(apt => apt.id === appointmentId);
    
    if (!appointment) {
        app.showError('Không tìm thấy lịch khám');
        return;
    }
    
    console.log('Appointment to rebook:', appointment);
    
    // Show confirmation dialog with high z-index
    Swal.fire({
        title: 'Đặt lại lịch khám',
        text: `Bạn có muốn đặt lại lịch khám với bác sĩ ${appointment.doctorName} không?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Có, đặt lại',
        cancelButtonText: 'Hủy',
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#6c757d',
        customClass: {
            container: 'swal2-high-zindex',
            popup: 'swal2-high-zindex'
        }
    }).then((result) => {
        if (result.isConfirmed) {
            // Open rebook modal
            showRebookModal(appointment);
        }
    });
}

function showRebookModal(appointment) {
    console.log('=== SHOW REBOOK MODAL ===');
    console.log('Appointment data:', appointment);
    
    // Set rebook mode
    patientDashboard.isRebookMode = true;
    patientDashboard.rebookAppointmentId = appointment.id;
    
    // Pre-fill booking data with existing appointment data, but set current date
    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = String(today.getMonth() + 1).padStart(2, '0');
    const todayDay = String(today.getDate()).padStart(2, '0');
    const todayStr = `${todayYear}-${todayMonth}-${todayDay}`;
    
    patientDashboard.bookingData = {
        hospitalId: appointment.hospitalId,
        specialty: app.specialties.find(s => s.name === appointment.specialty)?.id,
        doctorId: appointment.doctorId,
        date: todayStr, // Set to current date instead of old date
        time: null, // Don't pre-select time
        timeRange: null, // Don't pre-select time range
        notes: appointment.notes
    };
    
    console.log('Pre-filled booking data:', patientDashboard.bookingData);
    
    // Set current step to 3 (Date & Time)
    patientDashboard.currentStep = 3;
    
    // Show booking modal with rebook title
    const bookingModal = document.getElementById('bookingModal');
    const modalTitle = bookingModal.querySelector('.modal-title');
    
    // Change title to "Đặt lại lịch khám"
    modalTitle.innerHTML = '<i class="fas fa-redo me-2"></i>Đặt lại lịch khám';
    
    // Add rebook modal class for higher z-index
    bookingModal.classList.add('rebook-modal');
    const modalDialog = bookingModal.querySelector('.modal-dialog');
    if (modalDialog) {
        modalDialog.classList.add('rebook-modal');
    }
    
    // Force inline z-index to ensure it's applied
    bookingModal.style.zIndex = '9998';
    if (modalDialog) {
        modalDialog.style.zIndex = '9999';
    }
    
    // Close history modal first to avoid z-index conflicts
    const historyModal = document.getElementById('historyModal');
    if (historyModal) {
        const historyModalInstance = bootstrap.Modal.getInstance(historyModal);
        if (historyModalInstance) {
            historyModalInstance.hide();
        }
    }
    
    // Show modal
    const modal = new bootstrap.Modal(bookingModal);
    modal.show();
    
    // Update progress steps to show step 3 as active
    patientDashboard.updateProgressSteps();
    
    // Show step 3 content directly
    patientDashboard.showStep(3);
    
    // Setup modal event listeners for rebook mode
    patientDashboard.setupModalEventListeners();
}

function showRescheduleModal(appointment) {
    console.log('=== SHOW RESCHEDULE MODAL ===');
    console.log('Appointment data:', appointment);
    
    // Set reschedule mode
    patientDashboard.isRescheduleMode = true;
    patientDashboard.rescheduleAppointmentId = appointment.id;
    
    // Pre-fill booking data with existing appointment data
    patientDashboard.bookingData = {
        hospitalId: appointment.hospitalId,
        specialty: app.specialties.find(s => s.name === appointment.specialty)?.id,
        doctorId: appointment.doctorId,
        date: appointment.date,
        time: appointment.time,
        timeRange: appointment.timeRange,
        notes: appointment.notes
    };
    
    // Store original time slot for comparison
    patientDashboard.originalTimeSlot = {
        date: appointment.date,
        time: appointment.time,
        timeRange: appointment.timeRange
    };
    
    console.log('Pre-filled booking data:', patientDashboard.bookingData);
    
    // Set current step to 3 (Date & Time)
    patientDashboard.currentStep = 3;
    
    // Show booking modal with reschedule title
    const bookingModal = document.getElementById('bookingModal');
    const modalTitle = bookingModal.querySelector('.modal-title');
    
    // Change title to "Thay đổi lịch khám"
    modalTitle.innerHTML = '<i class="fas fa-calendar-alt me-2"></i>Thay đổi lịch khám';
    
    // Add reschedule modal class for higher z-index
    bookingModal.classList.add('reschedule-modal');
    const modalDialog = bookingModal.querySelector('.modal-dialog');
    if (modalDialog) {
        modalDialog.classList.add('reschedule-modal');
    }
    
    // Force inline z-index to ensure it's applied
    bookingModal.style.zIndex = '9998';
    if (modalDialog) {
        modalDialog.style.zIndex = '9999';
    }
    
    // Close history modal first to avoid z-index conflicts
    const historyModal = document.getElementById('historyModal');
    if (historyModal) {
        const historyModalInstance = bootstrap.Modal.getInstance(historyModal);
        if (historyModalInstance) {
            historyModalInstance.hide();
        }
    }
    
    // Show modal
    const modal = new bootstrap.Modal(bookingModal);
    modal.show();
    
    // Update progress steps to show step 3 as active
    patientDashboard.updateProgressSteps();
    
    // Show step 3 content directly
    patientDashboard.showStep(3);
    
    // Setup modal event listeners for reschedule mode
    patientDashboard.setupModalEventListeners();
}

function submitReview() {
    patientDashboard.submitReview();
}

// Global logout function
function logout() {
    console.log('Logout function called');
    localStorage.removeItem('currentUser');
    sessionStorage.removeItem('redirecting');
    alert('Đã đăng xuất thành công!');
    window.location.href = 'index.html';
}

// Initialize patient dashboard
let patientDashboard;

// Simple initialization - no complex logic
function initializePatientDashboard() {
    console.log('=== SIMPLE INITIALIZATION START ===');
    
    // Create minimal auth object if needed
    if (typeof auth === 'undefined') {
        console.log('Creating minimal auth object...');
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
    
    // Create minimal app object if needed
    if (typeof app === 'undefined') {
        console.log('Creating minimal app object...');
        window.app = {
            getAppointments: function() { return []; },
            hospitals: [
                { id: 1, name: 'Bệnh viện Bạch Mai' },
                { id: 2, name: 'Bệnh viện Việt Đức' }
            ]
        };
    }
    
    console.log('Creating patient dashboard...');
    patientDashboard = new PatientDashboard();
    patientDashboard.init();
    console.log('=== SIMPLE INITIALIZATION COMPLETE ===');
}

// Start initialization after a delay to ensure auth.js and app.js are loaded
setTimeout(() => {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializePatientDashboard);
    } else {
        initializePatientDashboard();
    }
}, 500); 