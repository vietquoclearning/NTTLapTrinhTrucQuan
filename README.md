# Hệ thống Đặt Lịch Khám Bệnh

Một hệ thống quản lý lịch khám bệnh hoàn chỉnh được xây dựng với HTML, CSS, JavaScript và Bootstrap 5.

## 🚀 Tính năng chính

### 👥 Hệ thống người dùng
- **Đăng ký/Đăng nhập** với 3 vai trò: Bệnh nhân, Bác sĩ, Quản lý
- **Xác thực và phân quyền** theo vai trò
- **Quản lý thông tin cá nhân** cho từng loại người dùng

### 🏥 Quản lý bệnh viện
- **Hệ thống bệnh viện** với thông tin chi tiết
- **Chuyên khoa y tế** đa dạng
- **Đội ngũ bác sĩ** chuyên môn cao

### 📅 Đặt lịch khám
- **Giao diện đặt lịch** 4 bước đơn giản
- **Lịch trực quan** với highlight ngày hiện tại
- **Khung giờ linh hoạt** (sáng: 8:00-11:00, chiều: 14:00-17:00)
- **Kiểm tra khả dụng** thời gian thực
- **Validation đầy đủ** cho từng bước

### 🔄 Quản lý lịch khám
- **Dời lịch khám** với giao diện thân thiện
- **Đặt lại lịch khám** từ lịch đã hoàn thành
- **Hủy lịch khám** với xác nhận
- **Lịch sử khám bệnh** chi tiết theo tab

### 📊 Dashboard quản lý
- **Thống kê tổng quan** cho từng vai trò
- **Quản lý người dùng** (Admin)
- **Báo cáo thống kê** theo chuyên khoa và thời gian
- **Reset dữ liệu** và Debug (Admin)

## 🏗️ Cấu trúc project

```
LapTrinhTrucQuan/
├── index.html                 # Trang chủ và đăng nhập
├── patient-dashboard.html     # Dashboard bệnh nhân
├── doctor-dashboard.html      # Dashboard bác sĩ
├── admin-dashboard.html       # Dashboard quản lý
├── assets/
│   ├── css/
│   │   └── style.css         # CSS chính với responsive design
│   ├── js/
│   │   ├── auth.js           # Hệ thống xác thực
│   │   ├── app.js            # Logic chính và dữ liệu
│   │   ├── patient-dashboard.js    # Dashboard bệnh nhân
│   │   ├── doctor-dashboard.js     # Dashboard bác sĩ
│   │   └── admin-dashboard.js      # Dashboard quản lý
│   └── images/               # Hình ảnh và icon
└── README.md
```

## 🎯 Chi tiết từng vai trò

### 👤 Bệnh nhân
- **Đặt lịch khám mới** với 4 bước
- **Xem lịch sử** theo tab (Sắp tới, Đã hoàn thành, Đã hủy)
- **Dời lịch khám** từ lịch sắp tới
- **Đặt lại lịch khám** từ lịch đã hoàn thành/hủy
- **Hủy lịch khám** với xác nhận
- **Đánh giá bác sĩ** sau khi khám

### 👨‍⚕️ Bác sĩ
- **Xem lịch khám** theo ngày
- **Lọc lịch** theo hôm nay/ngày mai
- **Chi tiết bệnh nhân** và thông tin khám
- **Hoàn thành lịch khám** 
- **Đổi lịch khám** cho bệnh nhân
- **Thống kê** số lượng bệnh nhân và lịch khám

### 👨‍💼 Quản lý (Admin)
- **Quản lý người dùng** (thêm, xóa, chỉnh sửa)
- **Xem tất cả lịch khám** với bộ lọc
- **Quản lý bệnh viện** và chuyên khoa
- **Báo cáo thống kê** theo chuyên khoa và tháng
- **Reset dữ liệu** hệ thống
- **Debug dữ liệu** để kiểm tra

## 🎨 Giao diện và UX

### 🎨 Thiết kế
- **Bootstrap 5** cho responsive design
- **Font Awesome** cho icon đẹp mắt
- **CSS custom** với biến CSS và animation
- **Giao diện thân thiện** với người dùng

### 📱 Responsive
- **Mobile-first** approach
- **Grid system** linh hoạt
- **Typography** tối ưu cho mọi thiết bị
- **Touch-friendly** cho mobile

### 🎯 UX Features
- **Progress steps** rõ ràng cho đặt lịch
- **Validation real-time** với thông báo
- **Modal popup** cho các thao tác
- **SweetAlert2** cho thông báo đẹp mắt
- **Z-index management** cho modal layers

## 🔧 Công nghệ sử dụng

### Frontend
- **HTML5** - Cấu trúc trang
- **CSS3** - Styling và responsive
- **JavaScript ES6+** - Logic và tương tác
- **Bootstrap 5** - Framework CSS
- **Font Awesome 6** - Icon library

### Libraries
- **SweetAlert2** - Alert và confirmation dialogs
- **LocalStorage API** - Lưu trữ dữ liệu local

### Development
- **ES6 Classes** - Object-oriented programming
- **Async/Await** - Xử lý bất đồng bộ
- **Event-driven architecture** - Tương tác người dùng
- **Modular JavaScript** - Tổ chức code

## 📊 Cấu trúc dữ liệu

### 👥 Users
```javascript
{
  id: number,
  name: string,
  email: string,
  phone: string,
  password: string,
  role: 'patient' | 'doctor' | 'admin',
  specialty?: string,        // Cho bác sĩ
  hospitalIds?: number[]     // Cho bác sĩ
}
```

### 🏥 Hospitals
```javascript
{
  id: number,
  name: string,
  address: string,
  phone: string,
  email: string
}
```

### 🩺 Specialties
```javascript
{
  id: number,
  name: string,
  icon: string,
  description: string
}
```

### 👨‍⚕️ Doctors
```javascript
{
  id: number,
  name: string,
  specialty: string,
  hospitalId: number,
  avatar: string,
  experience: string,
  rating: number
}
```

### 📅 Appointments
```javascript
{
  id: number,
  patientId: number,
  patientName: string,
  doctorId: number,
  doctorName: string,
  specialty: string,
  hospitalId: number,
  hospitalName: string,
  date: string,              // YYYY-MM-DD
  time: string,              // HH:MM
  timeRange?: string,        // HH:MM - HH:MM
  status: 'upcoming' | 'completed' | 'cancelled',
  notes?: string,
  rating?: number,           // Đánh giá
  review?: string,           // Nhận xét
  rescheduledAt?: string,    // Thời gian dời lịch
  originalDate?: string,     // Ngày gốc (dời lịch)
  originalTime?: string,     // Giờ gốc (dời lịch)
  rebookedFrom?: number      // ID lịch gốc (đặt lại)
}
```

## 🚀 Cách sử dụng

### 1. Khởi chạy
- Mở `index.html` trong trình duyệt
- Hoặc sử dụng local server (Live Server VS Code)

### 2. Đăng nhập
- **Bệnh nhân**: `patient@example.com` / `123456`
- **Bác sĩ**: `doctor@example.com` / `123456`
- **Admin**: `admin@example.com` / `123456`

### 3. Sử dụng hệ thống
- **Bệnh nhân**: Đặt lịch, xem lịch sử, dời/hủy lịch
- **Bác sĩ**: Xem lịch khám, quản lý bệnh nhân
- **Admin**: Quản lý toàn bộ hệ thống

## 🔍 Tính năng nâng cao

### 📅 Calendar System
- **Highlight ngày hiện tại** tự động
- **Kiểm tra khả dụng** thời gian thực
- **Navigation tháng** linh hoạt
- **Weekend styling** (Thứ 7, Chủ nhật)

### ⏰ Time Slot Management
- **12 khung giờ** mỗi ngày
- **Kiểm tra xung đột** thời gian
- **Past time slots** tự động disable
- **Available/Booked** status rõ ràng

### 🔄 Reschedule System
- **Pre-fill thông tin** từ lịch cũ
- **Highlight khung giờ gốc** 
- **Validation** đầy đủ
- **Conflict detection** thông minh

### 📊 Statistics & Reporting
- **Real-time stats** cho mỗi dashboard
- **Filter theo ngày** và trạng thái
- **Export data** (có thể mở rộng)
- **Performance metrics** chi tiết

## 🛠️ Development

### Code Structure
- **Class-based architecture** cho mỗi dashboard
- **Event-driven** cho user interactions
- **LocalStorage** cho data persistence
- **Modular functions** cho reusability

### Best Practices
- **Error handling** đầy đủ
- **Console logging** cho debugging
- **Code comments** chi tiết
- **Consistent naming** conventions

### Performance
- **Lazy loading** cho modals
- **Efficient DOM manipulation**
- **Optimized event listeners**
- **Memory management** tốt

## 🔮 Roadmap

### Phase 1 (Current)
- ✅ Core booking system
- ✅ User management
- ✅ Basic dashboard
- ✅ Appointment management

### Phase 2 (Future)
- 🔲 Database integration
- 🔲 Real-time notifications
- 🔲 Payment integration
- 🔲 Mobile app

### Phase 3 (Advanced)
- 🔲 AI scheduling
- 🔲 Telemedicine
- 🔲 Analytics dashboard
- 🔲 Multi-language support

## 🤝 Contributing

1. **Fork** project
2. **Create** feature branch
3. **Commit** changes
4. **Push** to branch
5. **Create** Pull Request

## 📝 License

Project này được phát triển cho mục đích học tập và nghiên cứu.

## 👨‍💻 Author

**LapTrinhTrucQuan** - Hệ thống đặt lịch khám bệnh hoàn chỉnh

---

*Được xây dựng với ❤️ và JavaScript* 