# Cấu hình gửi email bằng Resend

Landing page gửi biểu mẫu đến endpoint `/api/send-email`. API key chỉ được đọc ở phía máy chủ và tuyệt đối không đưa vào `script.js`.

## Triển khai trên Vercel

1. Tạo tài khoản và API key trong Resend.
2. Xác minh domain gửi email trong Resend (DNS SPF và DKIM).
3. Deploy thư mục này lên Vercel.
4. Trong **Project Settings → Environment Variables**, thêm:
   - `RESEND_API_KEY`: API key bắt đầu bằng `re_`.
   - `RESEND_FROM_EMAIL`: ví dụ `TUDO EDU <tu-van@tudoedu.vn>`. Domain phải được xác minh.
   - `LEAD_NOTIFICATION_EMAIL`: mặc định là `trungtd.tudoedu@gmail.com`; có thể nhập nhiều email, cách nhau bằng dấu phẩy.
5. Redeploy sau khi thêm biến môi trường, rồi gửi thử một biểu mẫu.

## Chạy local

Dùng `vercel dev` và tạo file `.env.local` từ `.env.example`. File môi trường đã được loại khỏi Git. Không chạy bằng server tĩnh thông thường vì đường dẫn `/api/send-email` cần môi trường Node/serverless.

## Bảo vệ đã tích hợp

- Xác thực dữ liệu ở cả trình duyệt và máy chủ.
- Honeypot, giới hạn tốc độ cơ bản và giới hạn kích thước request.
- Escape HTML để dữ liệu người dùng không chèn mã vào email.
- Timeout phía trình duyệt và thông báo thành công/thất bại rõ ràng.
