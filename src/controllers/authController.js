const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { generateOTP } = require('../utils/otp');
const { sendOTP } = require('../services/mailer');

exports.requestOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email.endsWith('@adu.uz')) {
      return res.status(403).json({ error: "Tizimga faqat korporativ @adu.uz pochtasi orqali kirish mumkin!" });
    }

    const system = await prisma.systemSettings.findFirst();
    const userExists = await prisma.user.findUnique({ where: { email } });

    // Admin DevMode'da ekanligini aniqlash
    const isAdminDev = (email === 'admin@adu.uz' && process.env.DEV_MODE === 'true');

    // Agar tizim yopiq bo'lsa, foydalanuvchi yangi bo'lsa VA u admin bo'lmasa -> BLOKLASH
    if (!system?.isSystemOpen && !userExists && !isAdminDev) {
      return res.status(403).json({ error: "Tizim hozircha yopiq. Yangi a'zolar faqat Tyutor taklif kodi orqali kira oladi." });
    }

    // Spamdan himoya
    if (userExists && userExists.otpExpiresAt) {
      const timeDiff = (new Date(userExists.otpExpiresAt) - new Date()) / 1000;
      if (timeDiff > 180) { 
        return res.status(429).json({ error: "Kodni qayta so'rash uchun biroz kuting." });
      }
    }

    let otpCode;

    if (isAdminDev) {
      otpCode = '0000'; // Admin eshigi
    } else {
      otpCode = generateOTP();
      const isSent = await sendOTP(email, otpCode);
      if (!isSent) return res.status(500).json({ error: "Kodni yuborishda xatolik." });
    }

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.user.upsert({
      where: { email },
      update: { otpCode, otpExpiresAt: expiresAt },
      create: { 
        email, 
        otpCode, 
        otpExpiresAt: expiresAt,
        role: email === 'admin@adu.uz' ? 'ADMIN' : 'STUDENT'
      }
    });

    res.status(200).json({ message: "Tasdiqlash kodi pochtangizga yuborildi." });
  } catch (error) {
    res.status(500).json({ error: "Ichki xatolik." });
  }
};

exports.loginWithInviteCode = async (req, res) => {
  try {
    const { email, inviteCode } = req.body;

    if (!email.endsWith('@adu.uz')) return res.status(403).json({ error: "Faqat @adu.uz pochtasi." });

    const validCode = await prisma.inviteCode.findUnique({ where: { code: inviteCode } });

    if (!validCode) return res.status(404).json({ error: "Taklif kodi topilmadi." });
    if (validCode.isUsed) return res.status(400).json({ error: "Bu koddan allaqachon foydalanilgan." });
    if (new Date() > validCode.expiresAt) return res.status(400).json({ error: "Kodning 10 daqiqalik muddati tugagan." });

    await prisma.inviteCode.update({ where: { id: validCode.id }, data: { isUsed: true } });

    const user = await prisma.user.upsert({
      where: { email },
      update: { invitedById: validCode.tutorId },
      create: { email, invitedById: validCode.tutorId }
    });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(200).json({ message: "Tizimga muvaffaqiyatli kirdingiz!", token });
  } catch (error) {
    res.status(500).json({ error: "Xatolik yuz berdi." });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otpCode } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.otpCode !== otpCode) return res.status(400).json({ error: "Kod noto'g'ri." });
    if (new Date() > user.otpExpiresAt) return res.status(400).json({ error: "Kod muddati tugagan." });

    await prisma.user.update({
      where: { email },
      data: { otpCode: null, otpExpiresAt: null }
    });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(200).json({ message: "Muvaffaqiyatli kirdingiz!", token });
  } catch (error) {
    res.status(500).json({ error: "Ichki xatolik." });
  }
};
