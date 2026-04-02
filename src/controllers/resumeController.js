const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.createResume = async (req, res) => {
  try {
    const { title, skills, category } = req.body;

    if (!title || !skills || !category) {
      return res.status(400).json({ error: "Barcha maydonlarni to'ldirish shart!" });
    }

    const resume = await prisma.resume.create({
      data: {
        title,
        skills, // Masalan: ["Node.js", "React"] (Array shaklida kelishi kerak)
        category,
        authorId: req.user.id
      }
    });

    res.status(201).json({ message: "Rezyume muvaffaqiyatli qo'shildi!", resume });
  } catch (error) {
    console.error("Rezyume qo'shishda xatolik:", error);
    res.status(500).json({ error: "Serverda xatolik yuz berdi." });
  }
};

exports.getAllResumes = async (req, res) => {
  try {
    const resumes = await prisma.resume.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, email: true, tgUsername: true } }
      }
    });
    res.status(200).json(resumes);
  } catch (error) {
    res.status(500).json({ error: "Rezyumelarni yuklashda xatolik." });
  }
};

exports.getMyResumes = async (req, res) => {
  try {
    const resumes = await prisma.resume.findMany({
      where: { authorId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json(resumes);
  } catch (error) {
    res.status(500).json({ error: "Rezyumelaringizni yuklashda xatolik." });
  }
};

exports.deleteResume = async (req, res) => {
  try {
    const { id } = req.params;
    const resume = await prisma.resume.findUnique({ where: { id } });

    if (!resume) return res.status(404).json({ error: "Rezyume topilmadi." });

    if (resume.authorId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: "Bu rezyumeni o'chirishga huquqingiz yo'q!" });
    }

    await prisma.resume.delete({ where: { id } });
    res.status(200).json({ message: "Rezyume muvaffaqiyatli o'chirildi." });
  } catch (error) {
    res.status(500).json({ error: "O'chirishda xatolik yuz berdi." });
  }
};
