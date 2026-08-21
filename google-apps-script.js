/**
 * =========================================================================
 * TUDO EDU - GOOGLE APPS SCRIPT LEAD RECEIVER & DUAL EMAIL NOTIFIER (V2)
 * =========================================================================
 * Tính năng:
 * 1. Tự động lưu thông tin (Họ tên, SĐT, Email, Khóa học...) vào Google Sheet.
 * 2. Tự động gửi Email thông báo chi tiết về Gmail của Trung tâm (Admin).
 * 3. Tự động gửi Email xác nhận & cảm ơn đến Email của Học viên vừa đăng ký.
 * 4. Tương thích 100% với Cloudflare Pages, Vercel, Netlify và Web tĩnh.
 * =========================================================================
 */

// Email nhận thông báo của Admin (có thể nhập 1 hoặc nhiều email, cách nhau bằng dấu phẩy)
var ADMIN_EMAILS = "trungtamngoaingutudo@gmail.com, trungtd.tudoedu@gmail.com";

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var doc = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = doc.getSheetByName("DanhSachDangKy") || doc.getActiveSheet();

    // 1. Tự tạo dòng tiêu đề nếu trang tính đang trống
    if (sheet.getLastRow() === 0) {
      var headers = [
        "Thời Gian", 
        "Họ Và Tên", 
        "Số Điện Thoại", 
        "Email", 
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

    // 2. Phân tích dữ liệu gửi từ Landing Page
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

    var fullName = String(data.fullName || "Khách đăng ký").trim();
    var phone = String(data.phone || "").trim();
    var email = String(data.email || "").trim();
    var interest = String(data.interest || "Tiếng Trung tổng quát").trim();
    var context = String(data.context || "Website Landing Page").trim();
    var timestamp = Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss");

    // 3. Ghi dữ liệu vào Google Sheet
    sheet.appendRow([
      timestamp,
      fullName,
      "'" + phone, // Dấu nháy đơn để không bị mất số 0 ở đầu SĐT
      email,
      interest,
      context,
      "Chưa liên hệ"
    ]);

    // 4. GỬI EMAIL 1: THÔNG BÁO CHO ADMIN TRUNG TÂM
    var adminSubject = "[TUDO EDU] Đăng ký tư vấn mới: " + fullName + " - " + phone;
    var adminPlain = 
      "🔔 TUDO EDU CÓ ĐĂNG KÝ TƯ VẤN MỚI!\n\n" +
      "• Thời gian: " + timestamp + "\n" +
      "• Họ và tên: " + fullName + "\n" +
      "• Số điện thoại: " + phone + "\n" +
      "• Email: " + email + "\n" +
      "• Khóa học quan tâm: " + interest + "\n" +
      "• Nguồn form: " + context + "\n\n" +
      "👉 Dữ liệu đã được lưu vào Google Sheet.";

    var adminHtml = 
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
            '<tr style="background: #f8fafc;"><td style="padding: 12px 14px; border: 1px solid #e2e8f0; font-weight: bold;">Email học viên:</td><td style="padding: 12px 14px; border: 1px solid #e2e8f0;"><a href="mailto:' + email + '" style="color: #2563eb; text-decoration: none;">' + email + '</a></td></tr>' +
            '<tr><td style="padding: 12px 14px; border: 1px solid #e2e8f0; font-weight: bold;">Khóa học quan tâm:</td><td style="padding: 12px 14px; border: 1px solid #e2e8f0; font-weight: bold; color: #2563eb;">' + interest + '</td></tr>' +
            '<tr style="background: #f8fafc;"><td style="padding: 12px 14px; border: 1px solid #e2e8f0; font-weight: bold;">Thời gian gửi:</td><td style="padding: 12px 14px; border: 1px solid #e2e8f0;">' + timestamp + '</td></tr>' +
            '<tr><td style="padding: 12px 14px; border: 1px solid #e2e8f0; font-weight: bold;">Vị trí biểu mẫu:</td><td style="padding: 12px 14px; border: 1px solid #e2e8f0;">' + context + '</td></tr>' +
          '</table>' +
        '</div>' +
      '</div>';

    if (ADMIN_EMAILS && ADMIN_EMAILS.indexOf("@") !== -1) {
      try {
        MailApp.sendEmail({
          to: ADMIN_EMAILS,
          subject: adminSubject,
          body: adminPlain,
          htmlBody: adminHtml
        });
      } catch (adminMailErr) {
        Logger.log("Admin email error: " + adminMailErr.toString());
      }
    }

    // 5. GỬI EMAIL 2: XÁC NHẬN & CẢM ƠN CHO HỌC VIÊN
    if (email && email.indexOf("@") !== -1 && email.indexOf(".") !== -1) {
      var studentSubject = "[TUDO EDU] Xác nhận đăng ký tư vấn lộ trình học tiếng Trung";
      
      var studentPlain = 
        "Chào " + fullName + ",\n\n" +
        "Cảm ơn bạn đã đăng ký nhận tư vấn lộ trình học tiếng Trung tại TUDO EDU!\n\n" +
        "Thông tin đăng ký của bạn:\n" +
        "• Khóa học quan tâm: " + interest + "\n" +
        "• Số điện thoại: " + phone + "\n" +
        "• Ưu đãi: Đã bảo lưu suất học bổng 500.000đ\n\n" +
        "Đội ngũ chuyên môn TUDO EDU sẽ liên hệ với bạn trong thời gian sớm nhất để kiểm tra trình độ và tư vấn lộ trình học tối ưu nhất.\n\n" +
        "Hotline hỗ trợ: 097 138 90 94\n" +
        "Email: trungtamngoaingutudo@gmail.com\n" +
        "Trân trọng,\nĐội ngũ TUDO EDU";

      var studentHtml = 
        '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #ffffff;">' +
          '<div style="background: #13233f; color: #ffffff; padding: 24px; text-align: center; border-bottom: 4px solid #f8a810;">' +
            '<h1 style="margin: 0; font-size: 22px; color: #ffffff; letter-spacing: 0.5px;">TUDO EDU</h1>' +
            '<p style="margin: 6px 0 0; color: #f8a810; font-size: 14px; font-weight: bold;">HỌC ĐỂ DÙNG ĐƯỢC – THỰC CHIẾN & CÁ NHÂN HÓA</p>' +
          '</div>' +
          '<div style="padding: 26px 24px; color: #1e293b; font-size: 15px; line-height: 1.65;">' +
            '<p style="margin-top: 0; font-size: 16px;">Chào <strong>' + fullName + '</strong>,</p>' +
            '<p>Cảm ơn bạn đã quan tâm và để lại thông tin đăng ký tư vấn lộ trình học tiếng Trung tại <strong>TUDO EDU</strong>. Hệ thống đã ghi nhận thông tin của bạn thành công!</p>' +
            '<div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 20px 0;">' +
              '<h3 style="margin: 0 0 12px; font-size: 15px; color: #13233f;">📋 Thông tin đã tiếp nhận:</h3>' +
              '<table style="width: 100%; border-collapse: collapse; font-size: 14px;">' +
                '<tr><td style="padding: 6px 0; color: #64748b; width: 45%;">Họ và tên:</td><td style="padding: 6px 0; font-weight: bold; color: #0f172a;">' + fullName + '</td></tr>' +
                '<tr><td style="padding: 6px 0; color: #64748b;">Số điện thoại:</td><td style="padding: 6px 0; font-weight: bold; color: #0f172a;">' + phone + '</td></tr>' +
                '<tr><td style="padding: 6px 0; color: #64748b;">Mục tiêu / Khóa học:</td><td style="padding: 6px 0; font-weight: bold; color: #2563eb;">' + interest + '</td></tr>' +
                '<tr><td style="padding: 6px 0; color: #64748b;">Ưu đãi học phí:</td><td style="padding: 6px 0; font-weight: bold; color: #ea580c;">Đã bảo lưu Voucher 500.000đ 🎁</td></tr>' +
              '</table>' +
            '</div>' +
            '<p>📞 <strong>Bước tiếp theo:</strong> Thầy/Cô phụ trách học thuật tại TUDO EDU sẽ trực tiếp liên hệ bạn qua số điện thoại <strong>' + phone + '</strong> để đánh giá trình độ hiện tại và thiết kế lộ trình học cá nhân hóa phù hợp nhất với bạn.</p>' +
            '<p style="margin-bottom: 24px;">Nếu cần hỗ trợ gấp hoặc muốn trao đổi ngay, bạn có thể gọi hotline: <a href="tel:0971389094" style="color: #ea580c; font-weight: bold; text-decoration: none;">097 138 90 94</a>.</p>' +
            '<div style="border-top: 1px solid #e2e8f0; padding-top: 18px; color: #64748b; font-size: 13px;">' +
              '<p style="margin: 0 0 4px;"><strong>TRUNG TÂM NGOẠI NGỮ TUDO EDU</strong></p>' +
              '<p style="margin: 0 0 4px;">📍 Hotline: 097 138 90 94 | Email: trungtamngoaingutudo@gmail.com</p>' +
              '<p style="margin: 0;">🌐 Chúc bạn có một hành trình chinh phục tiếng Trung tràn đầy cảm hứng!</p>' +
            '</div>' +
          '</div>' +
        '</div>';

      try {
        MailApp.sendEmail({
          to: email,
          subject: studentSubject,
          body: studentPlain,
          htmlBody: studentHtml
        });
      } catch (studentMailErr) {
        Logger.log("Student email error: " + studentMailErr.toString());
      }
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
    .createTextOutput(JSON.stringify({ status: "active", message: "TUDO EDU Google Apps Script API V2 is active!" }))
    .setMimeType(ContentService.MimeType.JSON);
}