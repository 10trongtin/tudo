/**
 * =========================================================================
 * TUDO EDU - GOOGLE APPS SCRIPT LEAD RECEIVER & EMAIL NOTIFIER
 * =========================================================================
 * Tính năng:
 * 1. Tự động lưu thông tin học viên vào Google Sheet (tự tạo bảng tiêu đề).
 * 2. Tự động gửi Email thông báo ngay lập tức về Gmail trung tâm.
 * 3. Hoạt động 100% trên Cloudflare Pages, Vercel, Netlify hoặc Hosting tĩnh.
 * =========================================================================
 */

// Email nhận thông báo (có thể điền 1 hoặc nhiều email, cách nhau bởi dấu phẩy)
var ADMIN_EMAILS = "trungtamngoaingutudo@gmail.com, trungtd.tudoedu@gmail.com";

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var doc = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = doc.getSheetByName("DanhSachDangKy") || doc.getActiveSheet();

    // 1. Tự tạo tiêu đề bảng nếu sheet trống
    if (sheet.getLastRow() === 0) {
      var headers = [
        "Thời Gian", 
        "Họ Và Tên", 
        "Số Điện Thoại", 
        "Khóa Học Quan Tâm", 
        "Vị Trí Form", 
        "Trạng Thái Tư Vấn"
      ];
      sheet.appendRow(headers);
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#13233f");
      headerRange.setFontColor("#ffffff");
      headerRange.setHorizontalAlignment("center");
      sheet.setFrozenRows(1);
    }

    // 2. Lấy dữ liệu gửi từ website
    var data = {};
    if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        data = e.parameter || {};
      }
    } else if (e.parameter) {
      data = e.parameter;
    }

    // Chặn bot spam qua honeypot
    if (data.website) {
      return ContentService
        .createTextOutput(JSON.stringify({ ok: true, message: "Spam suppressed" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var fullName = String(data.fullName || "Khách ẩn danh").trim();
    var phone = String(data.phone || "").trim();
    var interest = String(data.interest || "Chưa chọn").trim();
    var context = String(data.context || "Website Landing Page").trim();
    var timestamp = Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss");

    // 3. Ghi vào Google Sheet
    sheet.appendRow([
      timestamp,
      fullName,
      "'" + phone, // Dấu nháy đơn để không bị mất số 0 ở đầu SĐT
      interest,
      context,
      "Chưa liên hệ"
    ]);

    // 4. Gửi Email thông báo về Gmail Quản lý
    var emailSubject = "[TUDO EDU] Đăng ký tư vấn mới: " + fullName + " - " + phone;
    
    var emailPlain = 
      "🔔 TUDO EDU CÓ ĐĂNG KÝ TƯ VẤN MỚI!\n\n" +
      "• Thời gian: " + timestamp + "\n" +
      "• Họ và tên: " + fullName + "\n" +
      "• Số điện thoại: " + phone + "\n" +
      "• Khóa học quan tâm: " + interest + "\n" +
      "• Nguồn form: " + context + "\n\n" +
      "👉 Dữ liệu đã được lưu tự động vào Google Sheet.";

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
          '<div style="margin-top: 20px; padding: 12px 16px; background: #fefce8; border-left: 4px solid #f8a810; border-radius: 4px; font-size: 13px; color: #713f12;">' +
            '💡 <strong>Gợi ý:</strong> Hãy liên hệ sớm cho học viên trong vòng 15-30 phút để đạt tỉ lệ chốt lớp tốt nhất!' +
          '</div>' +
        '</div>' +
      '</div>';

    if (ADMIN_EMAILS && ADMIN_EMAILS.indexOf("@") !== -1) {
      MailApp.sendEmail({
        to: ADMIN_EMAILS,
        subject: emailSubject,
        body: emailPlain,
        htmlBody: emailHtml
      });
    }

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, result: "success", message: "Đăng ký thành công!" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, result: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: "active", message: "TUDO EDU Google Apps Script API is running perfectly!" }))
    .setMimeType(ContentService.MimeType.JSON);
}