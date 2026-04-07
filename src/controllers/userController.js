const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// "Mock" (soxta) AI filtri - Tizim yonganda xato bermasligi uchun
const checkTextContent = async (text) => {
  return { isSafe: true, filteredText: text }; 
};

// Kunlik tahrir limitini tekshirish
const checkAndResetProfileEditLimit = async (user) => {
  const now = new Date();
  const lastReset = new Date(user.lastResetDate);
  
  if (now.getDate() !== lastReset.getDate() || now.getMonth() !== lastReset.getMonth()) {
    return await prisma.user.update({
      where: { id: user.id },
      data: { dailyProfileEdits: 0, dailyIdeaCount: 0, dailyMsgCount: 0, lastResetDate: now }
    });
  }
  return user;
};

// ===========================================
// 1. PROFILNI YANGILASH (Rezyume sozlamalari)
// ===========================================
exports.updateProfile = async (req, res) => {
  try {
    const { 
      nickname, avatarSticker, profession, aboutMe, isEmailPublic,
      firstName, age, faculty, course, principles, weeklyHours, dailyHours 
    } = req.body;
    
    let user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: "Foydalanuvchi topilmadi" });

    // Kunlik limitni tekshirish
    user = await checkAndResetProfileEditLimit(user);
    if (user.dailyProfileEdits >= 2 && user.role !== 'ADMIN') {
      return res.status(403).json({ error: "Kunlik profilni tahrirlash limiti (2 marta) tugadi." });
    }

    let updateData = {};

    if (avatarSticker !== undefined) updateData.avatarSticker = avatarSticker;
    if (profession) updateData.profession = profession;

    if (nickname && nickname !== user.nickname) {
      if (user.nicknameSetAt) {
        const diffInDays = (new Date() - new Date(user.nicknameSetAt)) / (1000 * 60 * 60 * 24);
        if (diffInDays < 30) return res.status(403).json({ error: "Nikneymni oyiga 1 marta o'zgartirish mumkin." });
      }
      const existingNick = await prisma.user.findUnique({ where: { nickname } });
      if (existingNick) return res.status(400).json({ error: "Bu nikneym band." });

      updateData.nickname = nickname;
      updateData.nicknameSetAt = new Date();
    }

    if (firstName !== undefined) updateData.firstName = firstName;
    if (age !== undefined) updateData.age = parseInt(age);
    if (faculty !== undefined) updateData.faculty = faculty;
    if (course !== undefined) updateData.course = parseInt(course);
    if (weeklyHours !== undefined) updateData.weeklyHours = parseInt(weeklyHours);
    if (dailyHours !== undefined) updateData.dailyHours = parseInt(dailyHours);
    if (isEmailPublic !== undefined) updateData.isEmailPublic = isEmailPublic;

    if (aboutMe) updateData.aboutMe = (await checkTextContent(aboutMe)).filteredText;
    if (principles) updateData.principles = (await checkTextContent(principles)).filteredText;

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...updateData,
        dailyProfileEdits: user.dailyProfileEdits + 1
      }
    });

    res.status(200).json({ message: "Profil muvaffaqiyatli saqlandi!", user: updatedUser });

  } catch (error) {
    console.error("Profil yangilashda xato:", error);
    res.status(500).json({ error: "Serverda xatolik yuz berdi" });
  }
};

// ===========================================
// 2. PROFILNI YUKLASH 
// (Aynan shu qism yo'qligi uchun Server Crash bo'layotgan edi!)
// ===========================================
exports.getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, email: true, role: true, nickname: true, 
        avatarSticker: true, profession: true, aboutMe: true, isEmailPublic: true,
        firstName: true, age: true, faculty: true, course: true, principles: true,
        weeklyHours: true, dailyHours: true,
        dailyMsgCount: true, dailyIdeaCount: true, dailyProfileEdits: true,
        canCreateProject: true 
      }
    });
    
    if (!user) return res.status(404).json({ error: "Foydalanuvchi topilmadi" });
    
    res.status(200).json(user);
  } catch (error) {
    console.error("Profilni yuklashda xato:", error);
    res.status(500).json({ error: "Profilni yuklashda xatolik." });
  }
};
