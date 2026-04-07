const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { categorizeProject, checkTextContent } = require('../services/ai');

// 1. Yangi startap loyiha qo'shish
exports.createProject = async (req, res) => {
  try {
    const { title, goal, reason, benefit, telegramLink, currentProblems, deadline } = req.body;
    const userId = req.user.id;

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user.canCreateProject) {
      return res.status(403).json({ error: "Sizda allaqachon faol loyiha bor! Diqqatingizni bir joyga qarating." });
    }

    if (!title || !goal || !reason || !benefit || !telegramLink) {
      return res.status(400).json({ error: "Asosiy maydonlar va Telegram guruh havolasini kiritish shart!" });
    }

    // AI orqali matnlarni tekshirish va tozalash
    const safeGoal = (await checkTextContent(goal)).filteredText;
    const safeReason = (await checkTextContent(reason)).filteredText;
    const safeBenefit = (await checkTextContent(benefit)).filteredText;
    const safeProblems = currentProblems ? (await checkTextContent(currentProblems)).filteredText : null;

    // AI orqali sohani aniqlash
    const aiCategory = await categorizeProject(safeGoal, safeReason);

    const project = await prisma.project.create({
      data: {
        title,
        goal: safeGoal,
        reason: safeReason,
        benefit: safeBenefit,
        telegramLink,
        currentProblems: safeProblems,
        deadline,
        category: aiCategory,
        authorId: userId
      }
    });

    // Bitta faol loyiha qoidasi
    await prisma.user.update({
      where: { id: userId },
      data: { canCreateProject: false }
    });

    res.status(201).json({ message: "Loyiha muvaffaqiyatli yaratildi!", project });
  } catch (error) {
    console.error("Loyiha qo'shishda xato:", error);
    res.status(500).json({ error: "Serverda xatolik yuz berdi." });
  }
};

// 2. Startaplarni filtrlash
exports.getAllProjects = async (req, res) => {
  try {
    const { search, category, status } = req.query;
    let filterOptions = {};

    if (search) {
      filterOptions.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { goal: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (category) filterOptions.category = category;
    if (status) filterOptions.status = status;

    const projects = await prisma.project.findMany({
      where: filterOptions,
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, nickname: true, profession: true, avatarSticker: true } }
      }
    });

    // Xavfsizlik: Telegram havolani yashiramiz (Faqat qabul qilinganlarga ko'rsatiladi)
    const secureProjects = projects.map(p => {
      const { telegramLink, ...safeProject } = p;
      return safeProject;
    });

    res.status(200).json(secureProjects);
  } catch (error) {
    res.status(500).json({ error: "Loyihalarni yuklashda xatolik." });
  }
};

// 3. Loyiha holatini o'zgartirish va AI sabablarni filtrlash
exports.updateProjectStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, cancelReason } = req.body;
    const userId = req.user.id;

    const project = await prisma.project.findUnique({ where: { id } });

    if (!project) return res.status(404).json({ error: "Loyiha topilmadi." });
    if (project.authorId !== userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: "Bu amaliyotga huquqingiz yo'q!" });
    }

    let updateData = { status };

    // AI Sabablarni "chiroyli qog'ozga o'rash"
    if (status === 'REJECTED' || status === 'FINISHED') {
      if (cancelReason) {
        const aiCheck = await checkTextContent(cancelReason);
        updateData.cancelReason = aiCheck.filteredText; 
      }
      
      // Loyiha yopilgach, yangisiga ruxsat beriladi
      await prisma.user.update({
        where: { id: project.authorId },
        data: { canCreateProject: true }
      });
    }

    if (status === 'IN_MARKET' || status === 'MARKET_TESTING') {
      await prisma.user.update({
        where: { id: project.authorId },
        data: { canCreateProject: true }
      });
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: updateData
    });

    res.status(200).json({ message: `Loyiha holati yangilandi.`, project: updatedProject });
  } catch (error) {
    res.status(500).json({ error: "Holatni o'zgartirishda xatolik." });
  }
};
