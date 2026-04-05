const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { evaluateIdea } = require('../services/ai');

// Kunlik limitni tekshirish utilitasi
const checkAndResetDailyLimit = async (user) => {
  const now = new Date();
  const lastReset = new Date(user.lastResetDate);
  
  // Agar bugun yangi kun bo'lsa, limitlarni nolga tushiramiz
  if (now.getDate() !== lastReset.getDate() || now.getMonth() !== lastReset.getMonth()) {
    return await prisma.user.update({
      where: { id: user.id },
      data: { dailyIdeaCount: 0, dailyMsgCount: 0, lastResetDate: now }
    });
  }
  return user;
};

exports.createProblem = async (req, res) => {
  try {
    const { title, description, isDraft } = req.body;
    let user = await prisma.user.findUnique({ where: { id: req.user.id } });

    // Kunlik limitlarni yangilash tekshiruvi
    user = await checkAndResetDailyLimit(user);

    if (user.dailyIdeaCount >= 2) {
      return res.status(403).json({ error: "Siz bugungi limitni (2 ta muammo) tugatdingiz. Ertaga yana urinib ko'ring." });
    }

    if (!title || !description) {
      return res.status(400).json({ error: "Nomi va tavsifini kiritish shart." });
    }

    let aiFeedbackText = null;

    // Agar qoralama (draft) bo'lmasa, AI tekshiradi
    if (!isDraft) {
      const aiResponse = await evaluateIdea(title, description);
      aiFeedbackText = aiResponse.feedback;
      
      // TODO: Baza bilan takrorlanishni tekshirish logikasi shu yerda bo'ladi
    }

    const problem = await prisma.problem.create({
      data: {
        title,
        description,
        isDraft: isDraft || false,
        aiFeedback: aiFeedbackText,
        authorId: user.id
      }
    });

    // Limitga 1 qo'shamiz
    await prisma.user.update({
      where: { id: user.id },
      data: { dailyIdeaCount: user.dailyIdeaCount + 1 }
    });

    res.status(201).json({ 
      message: isDraft ? "Qoralamaga saqlandi" : "Muammo muvaffaqiyatli bazaga qo'shildi!", 
      aiFeedback: aiFeedbackText,
      problem 
    });

  } catch (error) {
    console.error("Muammo qo'shishda xato:", error);
    res.status(500).json({ error: "Serverda xatolik yuz berdi." });
  }
};

exports.getAllProblems = async (req, res) => {
  try {
    const { search } = req.query;
    let filterOptions = { isDraft: false }; // Faqat tasdiqlanganlarni hammaga ko'rsatish

    if (search) {
      filterOptions.title = { contains: search, mode: 'insensitive' };
    }

    const problems = await prisma.problem.findMany({
      where: filterOptions,
      orderBy: { createdAt: 'desc' },
      include: { author: { select: { nickname: true, profession: true } } }
    });

    res.status(200).json(problems);
  } catch (error) {
    res.status(500).json({ error: "Muammolarni yuklashda xatolik." });
  }
};

exports.deleteProblem = async (req, res) => {
  try {
    const { id } = req.params;
    const problem = await prisma.problem.findUnique({ where: { id } });

    if (!problem) return res.status(404).json({ error: "Muammo topilmadi." });
    if (problem.authorId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: "O'chirishga huquqingiz yo'q!" });
    }

    await prisma.problem.delete({ where: { id } });
    res.status(200).json({ message: "Muammo o'chirildi." });
  } catch (error) {
    res.status(500).json({ error: "O'chirishda xato." });
  }
};
