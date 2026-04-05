const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');
const { sendAdminApprovalRequest } = require('../services/telegram');

// 1. Faqat parol tekshiriladi va Telegramga so'rov ketadi
exports.requestAdminLogin = async (req, res) => {
  try {
    const { email, password, deviceInfo } = req.body;

    const admin = await prisma.user.findUnique({ where: { email } });

    if (!admin || admin.role !== 'ADMIN') {
      return res.status(403).json({ error: "Siz admin emassiz!" });
    }

    if (admin.adminPassword && admin.adminPassword !== password) {
      return res.status(401).json({ error: "Maxfiy parol noto'g'ri yozildi!" });
    }

    // Telegramga faqat ruxsat so'rovchi xabar yuboramiz
    const isSent = await sendAdminApprovalRequest(email, deviceInfo || "Noma'lum brauzer");

    if (!isSent) {
      return res.status(500).json({ error: "Telegram bot bilan aloqa yo'q." });
    }

    res.status(200).json({ message: "Telegramingizga tasdiqlash so'rovi yuborildi. Iltimos, Telegram orqali 'Ha, bu menman' tugmasini bosing va olingan kodni shu yerga kiriting." });
  } catch (error) {
    res.status(500).json({ error: "Xatolik yuz berdi." });
  }
};

// 2. Telegramdan olingan 20 xonali murakkab kodni tekshirish
exports.verifyAdminLogin = async (req, res) => {
  try {
    const { email, otpCode } = req.body;

    const admin = await prisma.user.findUnique({ where: { email } });

    // Kod noto'g'ri bo'lsa yoki umuman telegramdan tugma bosilmagan bo'lsa
    if (!admin || !admin.adminAuthCode || admin.adminAuthCode !== otpCode) {
      return res.status(400).json({ error: "Kod noto'g'ri yoki siz hali Telegram orqali ruxsat tugmasini bosmadingiz." });
    }

    if (new Date() > admin.adminCodeExp) {
      return res.status(400).json({ error: "Kod yaroqlilik muddati (20 soniya) o'tib ketgan. Boshidan urinib ko'ring." });
    }

    // Kodni xavfsizlik uchun darhol o'chirib tashlaymiz
    await prisma.user.update({
      where: { email },
      data: { adminAuthCode: null, adminCodeExp: null }
    });

    // Adminga maxsus token beramiz
    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1d' } 
    );

    res.status(200).json({ message: "Admin panelga muvaffaqiyatli kirdingiz.", token });
  } catch (error) {
    res.status(500).json({ error: "Server xatosi." });
  }
};
