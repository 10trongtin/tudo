# 📋 HƯỚNG DẪN CẬP NHẬT GOOGLE APPS SCRIPT V2 (LƯU EMAIL & GỬI 2 EMAIL TỰ ĐỘNG)

Hệ thống đã được nâng cấp để:
1. **Lưu cột Email** của học viên vào Google Sheets.
2. **Gửi Email thông báo về Admin** (`trungtamngoaingutudo@gmail.com`).
3. **Tự động gửi Email xác nhận & cảm ơn đến Học viên** ngay sau khi đăng ký.

---

### CÁC BƯỚC CẬP NHẬT TRÊN GOOGLE SHEETS (MẤT 1 PHÚT):

1. Mở file **Google Sheets** quản lý học viên của bạn.
2. Trên menu, chọn **Tiện ích mở rộng (Extensions)** → **Apps Script**.
3. **Xóa toàn bộ mã cũ** trong Apps Script và copy toàn bộ nội dung từ file [`google-apps-script.js`](./google-apps-script.js) dán vào.
4. Nhấn nút **Lưu (Save icon)**.
5. Nhấn nút **Triển khai (Deploy)** ở góc trên bên phải → Chọn **Quản lý bản triển khai (Manage deployments)**.
6. Bấm vào biểu tượng cây bút **✏️ (Chỉnh sửa / Edit)**:
   * Mục **Phiên bản (Version):** Chọn **`Phiên bản mới (New version)`**.
   * Bấm **Triển khai (Deploy)**.

---

🎉 **Xong!** 
Bây giờ khi có học viên nhập Họ tên, SĐT, Email và gửi:
* Google Sheet sẽ ghi đầy đủ: *Thời gian | Họ tên | Số điện thoại | Email | Khóa học | Nguồn | Trạng thái*.
* Admin nhận được email thông báo có số điện thoại để gọi ngay.
* Học viên nhận được email xác nhận thương hiệu TUDO EDU thông báo đã bảo lưu voucher 500k và chuẩn bị có người gọi tư vấn!