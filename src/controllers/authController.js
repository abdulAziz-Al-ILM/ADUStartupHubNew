const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { generateOTP } = require('../utils/otp');
const { sendOTP } = require('../services/mailer');

/**
 * 1-QADAM: Pochta kiritilganda OTP kod yuborish
 */
exports.requestOtp = async (req, res) => {
  try {
    const { email } = req.body;

    // Faqat @adu.uz domeniga ruxsat beramiz
    if (!email.endsWith('@adu.uz')) {
      return res.status(403).json({ error: "Tizimga faqat korporativ @adu.uz pochtasi orqali kirish mumkin!" });
    }

    // Tizim yopiq yoki ochiqligini tekshiramiz (Zirhli eshik)
    const system = await prisma.systemSettings.findFirst();
    const userExists = await prisma.user.findUnique({ where: { email } });

    if (!system?.isSystemOpen && !userExists) {
      return res.status(403).json({ error: "Tizim hozircha yopiq. Yangi a'zolar faqat Tyutor taklif kodi orqali kira oladi." });
    }

    let otpCode;

    // VAQTINCHALIK ADMIN ESHIGI (Railway'da DEV_MODE=true bo'lsa ishlaydi)
    if (email === 'admin@adu.uz' && process.env.DEV_MODE === 'true') {
      otpCode = '0000'; // Parolni pochta kutmasdan 0000 qilib belgilaymiz
      console.log('⚠️ DIQQAT: Vaqtinchalik Admin rejimida ishlanmoqda!');
    } else {
      otpCode = generateOTP();
      // Haqiqiy OTP yuborish xizmatini chaqiramiz
      const isSent = await sendOTP(email, otpCode);
      if (!isSent) {
        return res.status(500).json({ error: "Kodni yuborishda xatolik yuz berdi. Pochtani tekshiring." });
      }
    }

    // Kodni bazaga 5 daqiqalik yaroqlilik muddati bilan saqlaymiz
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.user.upsert({
      where: { email },
      update: { otpCode, otpExpiresAt: expiresAt },
      create: { 
        email, 
        otpCode, 
        otpExpiresAt: expiresAt,
        role: email === 'admin@adu.uz' ? 'ADMIN' : 'STUDENT' // Birinchi adminni belgilash
      }
    });

    res.status(200).json({ message: "Tasdiqlash kodi pochtangizga yuborildi." });

  } catch (error) {
    console.error("OTP yuborishda xatolik:", error);
    res.status(500).json({ error: "Serverda ichki xatolik yuz berdi." });
  }
};

/**
 * 2-QADAM: Kiritilgan OTP kodni tekshirish va tizimga kiritish
 */
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otpCode } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.otpCode !== otpCode) {
      return res.status(400).json({ error: "Kod noto'g'ri yozildi." });
    }

    if (new Date() > user.otpExpiresAt) {
      return res.status(400).json({ error: "Kodning muddati tugagan (5 daqiqa o'tdi). Qaytadan so'rang." });
    }

    // Kod to'g'ri bo'lsa, bazadan tozalaymiz (xavfsizlik uchun)
    await prisma.user.update({
      where: { email },
      data: { otpCode: null, otpExpiresAt: null }
    });

    // TODO: Bu yerda Foydalanuvchiga JWT (Token) berish mantig'ini qo'shamiz
    
    res.status(200).json({ 
      message: "Muvaffaqiyatli kirdingiz!", 
      user: { id: user.id, email: user.email, role: user.role } 
    });

  } catch (error) {
    console.error("Kodni tekshirishda xatolik:", error);
    res.status(500).json({ error: "Serverda ichki xatolik yuz berdi." });
  }
};
