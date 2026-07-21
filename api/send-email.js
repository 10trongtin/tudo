const RECIPIENT = process.env.LEAD_NOTIFICATION_EMAIL || 'trungtd.tudoedu@gmail.com';
const ALLOWED_INTERESTS = new Set(['Giao tiếp', 'HSK', 'Tiếng Trung cho công việc', 'Du học']);
const PHONE_PATTERN = /^(03|05|07|08|09)\d{8}$/;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 8;
const rateStore = globalThis.__tudoRateStore || new Map();
globalThis.__tudoRateStore = rateStore;

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
}

function clientIp(req) {
  return String(req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown')
    .split(',')[0].trim();
}

function isRateLimited(ip) {
  const now = Date.now();
  const recent = (rateStore.get(ip) || []).filter((time) => now - time < WINDOW_MS);
  recent.push(now);
  rateStore.set(ip, recent);
  return recent.length > MAX_REQUESTS;
}

function parseBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return {};
}

function respond(res, status, body) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.status(status).json(body);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return respond(res, 405, { ok: false, message: 'Phương thức không được hỗ trợ.' });
  }

  const contentLength = Number(req.headers?.['content-length'] || 0);
  if (contentLength > 10_000) return respond(res, 413, { ok: false, message: 'Dữ liệu gửi lên quá lớn.' });
  if (isRateLimited(clientIp(req))) {
    return respond(res, 429, { ok: false, message: 'Bạn đã gửi quá nhiều lần. Vui lòng thử lại sau 10 phút.' });
  }

  const body = parseBody(req);
  const fullName = String(body.fullName || '').trim().slice(0, 100);
  const phone = String(body.phone || '').replace(/\D/g, '').slice(0, 10);
  const interest = String(body.interest || '').trim();
  const context = String(body.context || 'website').trim().slice(0, 80);

  // Honeypot: silently accept automated submissions without sending email.
  if (body.website) return respond(res, 200, { ok: true });
  const startedAt = Number(body.startedAt || 0);
  if (startedAt && Date.now() - startedAt < 900) return respond(res, 200, { ok: true });

  if (fullName.length < 2 || !PHONE_PATTERN.test(phone) || !ALLOWED_INTERESTS.has(interest)) {
    return respond(res, 422, { ok: false, message: 'Thông tin chưa hợp lệ. Vui lòng kiểm tra lại biểu mẫu.' });
  }
  if (!process.env.RESEND_API_KEY) {
    console.error('Missing RESEND_API_KEY');
    return respond(res, 503, { ok: false, message: 'Hệ thống email chưa được cấu hình. Vui lòng liên hệ hotline.' });
  }

  const safe = {
    fullName: escapeHtml(fullName),
    phone: escapeHtml(phone),
    interest: escapeHtml(interest),
    context: escapeHtml(context)
  };
  const recipients = RECIPIENT.split(',').map((email) => email.trim()).filter(Boolean);
  const from = process.env.RESEND_FROM_EMAIL || 'TUDO EDU <onboarding@resend.dev>';
  const subject = `[TUDO EDU] Đăng ký tư vấn mới – ${fullName}`;
  const text = [
    'TUDO EDU nhận được một đăng ký tư vấn mới.',
    `Họ và tên: ${fullName}`,
    `Số điện thoại: ${phone}`,
    `Quan tâm: ${interest}`,
    `Vị trí biểu mẫu: ${context}`
  ].join('\n');
  const html = `<!doctype html><html><body style="margin:0;background:#f4f6fa;font-family:Arial,sans-serif;color:#13233f">
    <div style="max-width:620px;margin:32px auto;background:#fff;border-radius:18px;overflow:hidden;border:1px solid #e4e8ef">
      <div style="padding:24px 28px;background:#13233f;color:#fff;border-bottom:5px solid #f28b24">
        <strong style="font-size:20px">TUDO EDU</strong><div style="margin-top:5px;color:#cbd4e2">Đăng ký tư vấn mới</div>
      </div>
      <div style="padding:28px">
        <p style="margin-top:0">Một khách hàng vừa gửi thông tin từ landing page.</p>
        <table role="presentation" style="width:100%;border-collapse:collapse">
          <tr><td style="padding:11px;border-bottom:1px solid #edf0f4;color:#667085">Họ và tên</td><td style="padding:11px;border-bottom:1px solid #edf0f4"><strong>${safe.fullName}</strong></td></tr>
          <tr><td style="padding:11px;border-bottom:1px solid #edf0f4;color:#667085">Điện thoại</td><td style="padding:11px;border-bottom:1px solid #edf0f4"><a href="tel:${safe.phone}" style="color:#d86f0b">${safe.phone}</a></td></tr>
          <tr><td style="padding:11px;border-bottom:1px solid #edf0f4;color:#667085">Quan tâm</td><td style="padding:11px;border-bottom:1px solid #edf0f4">${safe.interest}</td></tr>
          <tr><td style="padding:11px;color:#667085">Nguồn</td><td style="padding:11px">${safe.context}</td></tr>
        </table>
      </div>
    </div></body></html>`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        'User-Agent': 'TUDO-EDU-Landing/1.0',
        'Idempotency-Key': `lead-${phone}-${Math.floor(Date.now() / 60000)}`
      },
      body: JSON.stringify({ from, to: recipients, subject, html, text })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error('Resend error', response.status, result);
      return respond(res, 502, { ok: false, message: 'Email chưa gửi được. Vui lòng gọi hotline để được hỗ trợ.' });
    }
    return respond(res, 200, { ok: true, id: result.id });
  } catch (error) {
    console.error('Email transport error', error);
    return respond(res, 502, { ok: false, message: 'Kết nối email gặp sự cố. Vui lòng thử lại.' });
  }
};

module.exports._private = { escapeHtml, parseBody, isRateLimited };
