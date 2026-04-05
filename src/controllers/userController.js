const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { checkTextContent } = require('../services/ai');

exports.updateProfile = async (req, res) => {
  try {
    const { nickname, avatarSticker, profession, aboutMe, isEmailPublic } = req.body;
    const userId = req.user.id;

    // Jori foydalanuvchini bazadan topish
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: "Foydalanuvchi topilmadi" });

    let updateData = {};

    // 1. AVATAR STIKER (Faqat 1 dan 8 gacha bo'lishi shart)
    if (avatarSticker !== undefined) {
      if (avatarSticker < 1 || avatarSticker > 8) {
        return res.status(400).json({ error: "Faqat 1 dan 8 gacha bo'lgan stikerlarni tanlash mumkin!" });
      }
      updateData.avatarSticker = avatarSticker;
    }

    // 2. MUTAXASSISLIK (15 ta sohadan biri)
    if (profession) {
      const validProfessions = [
        'IT_ENGINEER', 'UI_UX_DESIGNER', 'PROJECT_MANAGER', 'MARKETOLOG',
        'ECONOMIST', 'BIOLOGIST', 'ECOLOGIST', 'PEDAGOGUE', 'DOCTOR',
        'PHARMACIST', 'LINGUIST', 'JURIST', 'AGRONOMIST', 'CHEMIST', 'PHYSICIST'
      ];
      if (!validProfessions.includes(profession)) {
        return res.status(400).json({ error: "Faqat tasdiqlangan 15 ta mutaxassislikdan birini tanlashingiz mumkin." });
      }
      updateData.profession = profession;
    }

    // 3. NIKNEYM VA LIMIT (1 oyda 1 marta o'zgaradi)
    if (nickname && nickname !== user.nickname) {
      const now = new Date();
      // Agar avval o'zgartirgan bo'lsa, vaqtni tekshiramiz
      if (user.nicknameSetAt) {
        const diffInDays = (now - new Date(user.nicknameSetAt)) / (1000 * 60 * 60 * 24);
        if (diffInDays < 30) {
          return res.status(403).json({ error: `Nikneymni faqat 1 oyda 1 marta o'zgartirish mumkin. Yana ${Math.ceil(30 - diffInDays)} kun kuting.` });
        }
      }

      // Nikneymni AI orqali tekshirish
      const aiCheck = await checkTextContent(nickname);
      if (!aiCheck.isSafe) {
        return res.status(400).json({ error: "Nikneymda taqiqlangan so'zlar mavjud!" });
      }

      // Takrorlanmasligini tekshirish
      const existingNick = await prisma.user.findUnique({ where: { nickname } });
      if (existingNick) {
        return res.status(400).json({ error: "Bu nikneym band, boshqasini tanlang." });
      }

      updateData.nickname = nickname;
      updateData.nicknameSetAt = now;
    }

    // 4. MEN HAQIMDA MATNI (AI Senzura)
    if (aboutMe) {
      const aiCheck = await checkTextContent(aboutMe);
      if (!aiCheck.isSafe) {
        return res.status(400).json({ 
          error: "Matningizda yomon so'zlar aniqlandi. Iltimos tahrirlang.",
          filteredSuggestion: aiCheck.filteredText 
        });
      }
      updateData.aboutMe = aboutMe;
    }

    // 5. Pochta ochiqligi sozlamasi
    if (isEmailPublic !== undefined) {
      updateData.isEmailPublic = isEmailPublic;
    }

    // Bazani yangilash
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true, email: true, nickname: true, avatarSticker: true, 
        profession: true, aboutMe: true, isEmailPublic: true
      }
    });

    res.status(200).json({ message: "Profil muvaffaqiyatli yangilandi", user: updatedUser });

  } catch (error) {
    console.error("Profil yangilashda xato:", error);
    res.status(500).json({ error: "Serverda xatolik yuz berdi" });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, email: true, role: true, nickname: true, 
        avatarSticker: true, profession: true, aboutMe: true, isEmailPublic: true,
        dailyMsgCount: true, dailyIdeaCount: true
      }
    });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: "Profilni yuklashda xatolik." });
  }
};
