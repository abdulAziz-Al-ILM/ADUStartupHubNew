const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { categorizeProject, checkTextContent } = require('../services/ai');

// 1. Yangi startap loyiha qo'shish
exports.createProject = async (req, res) => {
  try {
    const { title, goal, reason, benefit } = req.body;
    const userId = req.user.id;

    // Foydalanuvchini tekshirish
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user.canCreateProject) {
      return res.status(403).json({ error: "Sizda allaqachon faol startap bor! Uni bozorga chiqarmaguncha yoki tugatmaguncha yangisini qo'sha olmaysiz. Diqqatingizni bitta loyihaga qarating." });
    }

    if (!title || !goal || !reason || !benefit) {
      return res.status(400).json({ error: "Barcha maydonlarni (nomi, maqsad, sabab, foyda) to'ldirish shart!" });
    }

    // AI orqali sohani aniqlash
    const aiCategory = await categorizeProject(goal, reason);

    const project = await prisma.project.create({
      data: {
        title,
        goal,
        reason,
        benefit,
        category: aiCategory,
        authorId: userId
      }
    });

    // Foydalanuvchining yangi loyiha qo'shish huquqini yopamiz
    await prisma.user.update({
      where: { id: userId },
      data: { canCreateProject: false }
    });

    res.status(201).json({ 
      message: "Loyiha muvaffaqiyatli qo'shildi va AI unga soha belgiladi!", 
      project 
    });
  } catch (error) {
    console.error("Loyiha qo'shishda xato:", error);
    res.status(500).json({ error: "Serverda xatolik yuz berdi." });
  }
};

// 2. Startaplarni filtrlash (Nomi, Sohasi va Holati bo'yicha)
exports.getAllProjects = async (req, res) => {
  try {
    const { search, category, status } = req.query;

    let filterOptions = {};

    if (search) {
      filterOptions.title = { contains: search, mode: 'insensitive' };
    }
    if (category) {
      filterOptions.category = category;
    }
    if (status) {
      filterOptions.status = status;
    }

    const projects = await prisma.project.findMany({
      where: filterOptions,
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, nickname: true, profession: true } }
      }
    });

    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ error: "Loyihalarni yuklashda xatolik." });
  }
};

// 3. Loyiha holatini o'zgartirish (Jamoa yig'ish, MVP, Bozor, Bekor qilish)
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

    // Agar loyiha to'xtatilsa yoki rad etilsa, sababini AI tekshiradi
    if (status === 'REJECTED' || status === 'FINISHED') {
      if (cancelReason) {
        const aiCheck = await checkTextContent(cancelReason);
        updateData.cancelReason = aiCheck.filteredText; // Yomon so'zlar tozalangan holati
      }
      
      // Loyiha tugatilgani uchun, foydalanuvchiga yana loyiha ochishga ruxsat beramiz
      await prisma.user.update({
        where: { id: project.authorId },
        data: { canCreateProject: true }
      });
    }

    // Agar bozorga chiqsa ham yangi loyihaga ruxsat ochiladi
    if (status === 'IN_MARKET') {
      await prisma.user.update({
        where: { id: project.authorId },
        data: { canCreateProject: true }
      });
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: updateData
    });

    res.status(200).json({ message: `Loyiha holati ${status} ga o'zgardi.`, project: updatedProject });
  } catch (error) {
    res.status(500).json({ error: "Holatni o'zgartirishda xatolik." });
  }
};
