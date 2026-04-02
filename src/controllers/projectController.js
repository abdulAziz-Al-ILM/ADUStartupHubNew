const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1. Yangi startap loyiha qo'shish
exports.createProject = async (req, res) => {
  try {
    const { title, description, category } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({ error: "Barcha maydonlarni to'ldirish shart!" });
    }

    const project = await prisma.project.create({
      data: {
        title,
        description,
        category,
        authorId: req.user.id // Token orqali avtomat olinadi
      }
    });

    res.status(201).json({ message: "Loyiha muvaffaqiyatli qo'shildi!", project });
  } catch (error) {
    console.error("Loyiha qo'shishda xatolik:", error);
    res.status(500).json({ error: "Serverda xatolik yuz berdi." });
  }
};

// 2. Barcha startaplarni ko'rish (Feed/Ro'yxat uchun)
exports.getAllProjects = async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: { id: true, email: true, tgUsername: true } // Maxfiy ma'lumotlar berilmaydi
        }
      }
    });
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ error: "Loyihalarni yuklashda xatolik." });
  }
};

// 3. O'zimning loyihalarimni ko'rish (Profil uchun)
exports.getMyProjects = async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      where: { authorId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ error: "Loyihalaringizni yuklashda xatolik." });
  }
};

// 4. O'zim qo'shgan loyihani o'chirish
exports.deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({ where: { id } });

    if (!project) {
      return res.status(404).json({ error: "Loyiha topilmadi." });
    }

    // Faqat o'zi qo'shgan bo'lsa yoki Admin bo'lsa o'chira oladi
    if (project.authorId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: "Bu loyihani o'chirishga huquqingiz yo'q!" });
    }

    await prisma.project.delete({ where: { id } });

    res.status(200).json({ message: "Loyiha muvaffaqiyatli o'chirildi." });
  } catch (error) {
    res.status(500).json({ error: "O'chirishda xatolik yuz berdi." });
  }
};
