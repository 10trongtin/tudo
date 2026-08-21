# 📋 HƯỚNG DẪN CẤU HÌNH GỬI FORM VỀ GOOGLE SHEET & GMAIL (CHO CLOUDFLARE PAGES)

Hệ thống đã được lập trình sẵn. Bạn chỉ cần thực hiện 3 bước cực kỳ đơn giản (mất khoảng 2 phút) là website trên **Cloudflare Pages** sẽ tự động lưu thông tin khách hàng vào Excel và bắn Email về Gmail ngay lập tức.

---

### BƯỚC 1: TẠO FILE GOOGLE SHEETS
1. Truy cập [Google Sheets (docs.google.com/spreadsheets)](https://docs.google.com/spreadsheets) bằng tài khoản Gmail của bạn.
2. Tạo một bảng tính mới, đặt tên là: **"TUDO EDU - Danh Sách Đăng Ký Tư Vấn"**.

---

### BƯỚC 2: DÁN ĐOẠN MÃ GOOGLE APPS SCRIPT
1. Trên thanh menu của Google Sheets, bấm vào: **Tiện ích mở rộng (Extensions)** → **Apps Script**.
2. Xóa toàn bộ nội dung mặc định trong khung soạn thảo.
3. Mở file `google-apps-script.js` (trong thư mục source code dự án) hoặc copy toàn bộ đoạn mã bên dưới rồi dán vào Apps Script:

```javascript
var ADMIN_EMAILS = "trungtamngoaingutudo@gmail.com, trungtd.tudoedu@gmail.com";

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var doc = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = doc.getSheetByName("DanhSachDangKy") || doc.getActiveSheet();

    if (sheet.getLastRow() === 0) {
      var headers = ["Thời Gian", "Họ Và Tên", "Số Điện Thoại", "Khóa Học Quan Tâm", "Vị Trí Form", "Trạng Thái Tư Vấn"];
      sheet.appendRow(headers);
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#13233f");
      headerRange.setFontColor("#ffffff");
      headerRange.setHorizontalAlignment("center");
      sheet.setFrozenRows(1);
    }

    var data = {};
    if (e.postData && e.postData.contents) {
      try { data = JSON.parse(e.postData.contents); } catch (err) { data = e.parameter || {}; }
    } else if (e.parameter) {
      data = e.parameter;
    }

    if (data.website) {
      return ContentService.createTextOutput(JSON.stringify({ ok: true, message: "Spam suppressed" })).setMimeType(ContentService.MimeType.JSON);
    }

    var fullName = String(data.fullName || "Khách ẩn danh").trim();
    var phone = String(data.phone || "").trim();
    var interest = String(data.interest || "Chưa chọn").trim();
    var context = String(data.context || "Website Landing Page").trim();
    var timestamp = Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss");

    sheet.appendRow([timestamp, fullName, "'" + phone, interest, context, "Chưa liên hệ"]);

    var emailSubject = "[TUDO EDU] Đăng ký tư vấn mới: " + fullName + " - " + phone;
    var emailPlain = "🔔 TUDO EDU CÓ ĐĂNG KÝ TƯ VẤN MỚI!\n\n• Thời gian: " + timestamp + "\n• Họ và tên: " + fullName + "\n• Số điện thoại: " + phone + "\n• Khóa học quan tâm: " + interest + "\n• Nguồn: " + context;
    
    var emailHtml = 
      '<div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #ffffff;">' +
        '<div style="background: #13233f; color: #ffffff; padding: 20px 24px; border-bottom: 4px solid #f8a810;">' +
          '<h2 style="margin: 0; font-size: 20px; color: #ffffff;">🔔 ĐĂNG KÝ TƯ VẤN MỚI - TUDO EDU</h2>' +
          '<p style="margin: 5px 0 0; color: #cbd5e1; font-size: 13px;">Hệ thống thông báo tự động từ Landing Page</p>' +
        '</div>' +
        '<div style="padding: 24px; color: #1e293b; font-size: 15px; line-height: 1.6;">' +
          '<p style="margin-top: 0;">Xin chào <strong>TUDO EDU</strong>, vừa có một học viên để lại thông tin tư vấn:</p>' +
          '<table style="width: 100%; border-collapse: collapse; margin: 18px 0; font-size: 14px;">' +
            '<tr style="background: #f8fafc;"><td style="padding: 12px 14px; border: 1px solid #e2e8f0; font-weight: bold; width: 35%;">Họ và tên:</td><td style="padding: 12px 14px; border: 1px solid #e2e8f0; font-weight: bold; color: #0f172a;">' + fullName + '</td></tr>' +
            '<tr><td style="padding: 12px 14px; border: 1px solid #e2e8f0; font-weight: bold;">Số điện thoại:</td><td style="padding: 12px 14px; border: 1px solid #e2e8f0;"><a href="tel:' + phone + '" style="color: #ea580c; font-weight: bold; text-decoration: none; font-size: 16px;">' + phone + ' 📞 (Bấm để gọi)</a></td></tr>' +
            '<tr style="background: #f8fafc;"><td style="padding: 12px 14px; border: 1px solid #e2e8f0; font-weight: bold;">Khóa học quan tâm:</td><td style="padding: 12px 14px; border: 1px solid #e2e8f0; font-weight: bold; color: #2563eb;">' + interest + '</td></tr>' +
            '<tr><td style="padding: 12px 14px; border: 1px solid #e2e8f0; font-weight: bold;">Thời gian gửi:</td><td style="padding: 12px 14px; border: 1px solid #e2e8f0;">' + timestamp + '</td></tr>' +
            '<tr style="background: #f8fafc;"><td style="padding: 12px 14px; border: 1px solid #e2e8f0; font-weight: bold;">Vị trí biểu mẫu:</td><td style="padding: 12px 14px; border: 1px solid #e2e8f0;">' + context + '</td></tr>' +
          '</table>' +
        '</div>' +
      '</div>';

    if (ADMIN_EMAILS && ADMIN_EMAILS.indexOf("@") !== -1) {
      MailApp.sendEmail({ to: ADMIN_EMAILS, subject: emailSubject, body: emailPlain, htmlBody: emailHtml });
    }

    return ContentService.createTextOutput(JSON.stringify({ ok: true, result: "success" })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: error.toString() })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
```

---

### BƯỚC 3: TRIỂN KHAI (DEPLOY) VÀ LẤY ĐƯỜNG LINK WEB APP
1. Nhấn nút **Lưu (Save icon)** trong Apps Script.
2. Nhấn nút **Triển khai (Deploy)** ở góc trên bên phải → Chọn **Tùy chọn triển khai mới (New deployment)**.
3. Bấm vào biểu tượng bánh răng **⚙️ Chọn loại (Select type)** → Chọn **Ứng dụng web (Web app)**.
4. Điền các trường:
   * **Mô tả (Description):** `TUDO EDU Lead API`
   * **Thực thi dưới dạng (Execute as):** `Tôi (Me - email của bạn)`
   * **Ai có quyền truy cập (Who has access):** Chọn **`Bất kỳ ai (Anyone)`** *(BẮT BUỘC để website có thể gửi dữ liệu)*.
5. Bấm **Triển khai (Deploy)** → Cấp quyền cho Google Apps Script (Nhấn *Nâng cao/Advanced* → *Đi tới dự án (không an toàn)* → *Cho phép/Allow*).
6. Google sẽ cung cấp cho bạn một **URL Ứng dụng web** có dạng:
   `https://script.google.com/macros/s/AKfycb.../exec`
7. Mở file `script.js` ở dòng số 6 và dán URL vào biến `GOOGLE_SHEET_WEBAPP_URL`:

```javascript
const GOOGLE_SHEET_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycb.../exec';
```

---

🎉 **HOÀN TẤT!** 
Bây giờ khi bạn deploy website lên **Cloudflare Pages**, mỗi khi có khách điền form:
* Google Sheet sẽ lập tức ghi nhận 1 dòng với đầy đủ Tên, SĐT, Khóa học.
* Hộp thư Gmail `trungtamngoaingutudo@gmail.com` sẽ nhận thông báo với link click-to-call gọi học viên ngay lập tức.