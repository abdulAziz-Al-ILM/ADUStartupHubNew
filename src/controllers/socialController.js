const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { checkTextContent } = require('../services/ai');

// Kunlik xabar limitini tekshirish utilitasi
const checkAndResetDailyMsgLimit = async (user) => {
  const now = new Date();
  const lastReset = new Date(user.lastResetDate);
  
  if (now.getDate() !== lastReset.getDate() || now.getMonth() !== lastReset.getMonth()) {
    return await prisma.user.update({
      where: { id: user.id },
      data: { dailyMsgCount: 0, dailyIdeaCount: 0, lastResetDate: now }
    });
  }
  return user;
};

// 1. Mutaxassislarni filtrlash va izlash
exports.getSpecialists = async (req, res) => {
  try {
    const { search, profession } = req.query;
    let filterOptions = { role: 'STUDENT' };

    if (search) {
      filterOptions.OR = [
        { nickname: { contains: search, mode: 'insensitive' } },
        { aboutMe: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (profession) {
      filterOptions.profession = profession;
    }

    const specialists = await prisma.user.findMany({
      where: filterOptions,
      select: {
        id: true,
        nickname: true,
        avatarSticker: true,
        profession: true,
        aboutMe: true,
        isEmailPublic: true,
        email: true // Pochtani keyingi qadamda filtrlaymiz
      }
    });

    // Pochta yashirin bo'lsa, o'chirib tashlaymiz (Faqat ruxsat berilganlar yoki mutual (o'zaro) obunalar ko'ra oladi)
    const filteredSpecialists = specialists.map(sp => {
      if (!sp.isEmailPublic) {
        delete sp.email;
      }
      return sp;
    });

    res.status(200).json(filteredSpecialists);
  } catch (error) {
    res.status(500).json({ error: "Mutaxassislarni yuklashda xatolik." });
  }
};

// 2. Foydalanuvchini kuzatish (Follow)
exports.followUser = async (req, res) => {
  try {
    const { followingId } = req.body;
    const followerId = req.user.id;

    if (followingId === followerId) {
      return res.status(400).json({ error: "O'zingizni kuzata olmaysiz." });
    }

    const existingFollow = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } }
    });

    if (existingFollow) {
      // Agar avval follow bosgan bo'lsa, unfollow qilamiz
      await prisma.follow.delete({ where: { id: existingFollow.id } });
      return res.status(200).json({ message: "Kuzatish to'xtatildi." });
    }

    await prisma.follow.create({
      data: { followerId, followingId }
    });

    res.status(200).json({ message: "Foydalanuvchini kuzatishni boshladingiz." });
  } catch (error) {
    res.status(500).json({ error: "Amaliyotda xatolik." });
  }
};

// 3. Xabar yuborish (Kuniga 3 ta limit va AI senzura)
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, text } = req.body;
    let user = await prisma.user.findUnique({ where: { id: req.user.id } });

    if (receiverId === user.id) {
      return res.status(400).json({ error: "O'zingizga xabar yoza olmaysiz." });
    }

    user = await checkAndResetDailyMsgLimit(user);

    if (user.dailyMsgCount >= 3) {
      return res.status(403).json({ error: "Kunlik xabar yozish limitini (3 ta) tugatdingiz. Ertaga yana yozishingiz mumkin." });
    }

    // AI orqali xabarni tekshirish
    const aiCheck = await checkTextContent(text);
    if (!aiCheck.isSafe) {
      return res.status(400).json({ 
        error: "Xabaringizda yomon so'zlar aniqlandi. Iltimos, madaniyatliroq so'zlar ishlating.",
        filteredText: aiCheck.filteredText
      });
    }

    const message = await prisma.message.create({
      data: {
        text: aiCheck.filteredText, // Xavfsiz matn saqlanadi
        senderId: user.id,
        receiverId
      }
    });

    // Limitni oshirish
    await prisma.user.update({
      where: { id: user.id },
      data: { dailyMsgCount: user.dailyMsgCount + 1 }
    });

    res.status(201).json({ message: "Xabar muvaffaqiyatli yuborildi.", data: message });
  } catch (error) {
    res.status(500).json({ error: "Xabar yuborishda xato." });
  }
};
