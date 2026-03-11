# 🙏 Giỗ Chạp — Quản lý Tâm linh & Gia phả số

Ứng dụng di động & web giúp gia đình Việt quản lý lịch Âm, ngày Giỗ, và văn khấn truyền thống. Hỗ trợ tự động tính lịch Âm-Dương, nhắc nhở ngày Rằm/Mùng 1, và lưu trữ gia phả số.

## ✨ Tính năng chính

- 📅 **Lịch Âm-Dương**: Chuyển đổi chính xác theo múi giờ Việt Nam (UTC+7), tra cứu Can Chi, giờ Hoàng Đạo
- 🕯️ **Hồ sơ Gia tiên**: Lưu thông tin người quá cố, tự động tính ngày Giỗ hàng năm (Giỗ đầu/hết/thường)
- 📖 **Thư viện Văn khấn**: 9 bài khấn mẫu, tự động điền tên gia chủ & ngày Âm lịch
- 🔔 **Nhắc nhở thông minh**: Nhắc trước 1-7 ngày cho Giỗ, Rằm, Mùng 1
- 🔍 **Tìm kiếm**: Lọc gia tiên & văn khấn nhanh chóng
- 🌓 **Dark/Light mode**: Giao diện tâm linh truyền thống

## 🛠 Tech Stack

| Thành phần | Công nghệ |
|---|---|
| Framework | [Expo SDK 54](https://expo.dev) + React Native |
| Ngôn ngữ | TypeScript |
| Navigation | expo-router (file-based routing) |
| Database | expo-sqlite (native) / localStorage (web) |
| Notifications | expo-notifications (native) / Web Notifications API |
| Lịch Âm | Hồ Ngọc Đức algorithm (UTC+7) |

## 📦 Cài đặt

```bash
# Clone repository
git clone https://github.com/your-username/gio-chap.git
cd gio-chap

# Cài đặt dependencies
npm install

# Chạy development server
npx expo start --web          # Web
npx expo start --ios          # iOS Simulator
npx expo start --android      # Android Emulator
```

> **Yêu cầu**: Node.js >= 20, npm >= 10

## 📁 Cấu trúc thư mục

```
gio-chap/
├── app/                          # Screens (file-based routing)
│   ├── (tabs)/                   # Tab navigation
│   │   ├── index.tsx             # 🏠 Trang chủ (Dashboard)
│   │   ├── calendar.tsx          # 📅 Lịch Âm Dương
│   │   ├── ancestors.tsx         # 🕯️ Danh sách Gia tiên
│   │   ├── prayers.tsx           # 📖 Thư viện Văn khấn
│   │   ├── settings.tsx          # ⚙️ Cài đặt
│   │   └── _layout.tsx           # Tab bar config
│   ├── ancestor/
│   │   ├── new.tsx               # Form thêm gia tiên
│   │   └── [id].tsx              # Chi tiết gia tiên
│   ├── prayer/
│   │   └── [id].tsx              # Chi tiết văn khấn
│   └── _layout.tsx               # Root layout
├── lib/
│   ├── lunar/converter.ts        # Bộ máy lịch Âm-Dương
│   ├── db/
│   │   ├── database.ts           # SQLite (native)
│   │   └── database.web.ts       # localStorage (web)
│   └── notifications/
│       ├── provider.ts           # Platform notifications
│       └── scheduler.ts          # Reminder scheduler
├── constants/
│   ├── theme.ts                  # Design tokens
│   └── prayers.ts                # 9 prayer templates
├── components/                   # Shared UI components
├── hooks/                        # Custom React hooks
└── types/                        # TypeScript types
```

## 📸 Screenshots

| Trang chủ | Lịch Âm | Gia tiên | Văn khấn | Cài đặt |
|:-:|:-:|:-:|:-:|:-:|
| Dashboard với lịch Âm, sự kiện sắp tới | Calendar grid Âm-Dương, ngày Giỗ | Danh sách gia tiên, countdown | 9 bài khấn mẫu, search | Thông tin, nhắc nhở |

## 🗺 Roadmap

- [x] **Phase 1**: Foundation — Lịch Âm, Gia phả, Văn khấn, Nhắc nhở, Settings
- [ ] **Phase 2**: Nhật ký Mâm cúng — Chụp ảnh, danh sách đồ lễ, chi tiêu
- [ ] **Phase 3**: Gia đình & Chia sẻ — Multi-user, sync cloud, family tree
- [ ] **Phase 4**: IoT & Smart Home — Kết nối đèn thờ, loa đọc kinh
- [ ] **Phase 5**: Dịch vụ — E-commerce đồ thờ cúng, booking thầy cúng

## 📝 Giấy phép

MIT License — Tự do sử dụng và phát triển.

---

*Lịch Âm Dương chính xác cho Việt Nam — Thuật toán Hồ Ngọc Đức (UTC+7)*
