const nodemailer = require('nodemailer');

// Pochta serveri bilan ulanishni sozlash
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true, // 465 port uchun true (SSL), 587 uchun false (TLS)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Foydalanuvchiga OTP kod yuborish
 * @param {string} email - Qabul qiluvchining pochtasi
 * @param {string} otpCode - 4 xonali kod
 * @returns {boolean} - Yuborilish holati (muvaffaqiyatli/xato)
 */
const sendOTP = async (email, otpCode) => {
  try {
    const mailOptions = {
      from: `"ADU Startup Hub" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Tizimga kirish uchun tasdiqlash kodi',
      html: `
        <div style="font-family: Arial, sans-serif; text-align: center; padding: 30px; background-color: #f1f5f9; border-radius: 12px;">
          <h2 style="color: #0f172a; margin-bottom: 10px;">ADU Startup Hub</h2>
          <p style="color: #64748b; font-size: 16px;">Tizimga kirish uchun sizning bir martalik kodingiz:</p>
          
          <div style="margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; color: #0f172a; letter-spacing: 8px; background: #ffffff; padding: 15px 25px; border-radius: 8px; border: 1px solid #cbd5e1; display: inline-block;">
              ${otpCode}
            </span>
          </div>
          
          <p style="color: #ef4444; font-size: 14px; margin-top: 20px;">
            <b>Diqqat!</b> Kod faqat 5 daqiqa davomida amal qiladi. Uni hech kimga bermang!
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`[Mailer] OTP muvaffaqiyatli yuborildi -> ${email}`);
    return true;
  } catch (error) {
    console.error('[Mailer] Pochta yuborishda xatolik:', error);
    return false;
  }
};

module.exports = { sendOTP };
