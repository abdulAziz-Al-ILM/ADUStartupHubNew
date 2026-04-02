const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1. Ariza yuborish (Startapga yoki Rezyumega)
exports.sendRequest = async (req, res) => {
  try {
    const { projectId, resumeId } = req.body;

    if (!projectId && !resumeId) {
      return res.status(400).json({ error: "Loyiha yoki Rezyume ID si ko'rsatilishi shart!" });
    }

    const newRequest = await prisma.request.create({
      data: {
        senderId: req.user.id,
        projectId: projectId || null,
        resumeId: resumeId || null
      }
    });

    res.status(201).json({ message: "Arizangiz muvaffaqiyatli yuborildi!", request: newRequest });
  } catch (error) {
    console.error("Ariza yuborishda xatolik:", error);
    res.status(500).json({ error: "Serverda xatolik yuz berdi." });
  }
};

// 2. Menga kelgan arizalarni ko'rish (Inbox)
exports.getIncomingRequests = async (req, res) => {
  try {
    const requests = await prisma.request.findMany({
      where: {
        OR: [
          { project: { authorId: req.user.id } },
          { resume: { authorId: req.user.id } }
        ]
      },
      include: {
        sender: { select: { email: true, tgUsername: true } },
        project: { select: { title: true } },
        resume: { select: { title: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ error: "Arizalarni yuklashda xatolik." });
  }
};

// 3. Ariza holatini o'zgartirish (Qabul qilish / Rad etish)
exports.updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'ACCEPTED' yoki 'REJECTED' bo'lishi kerak

    if (!['ACCEPTED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: "Noto'g'ri status holati yuborildi." });
    }

    const request = await prisma.request.findUnique({
      where: { id },
      include: { project: true, resume: true }
    });

    if (!request) return res.status(404).json({ error: "Ariza topilmadi." });

    // Egasi ekanligini tekshirish
    const isProjectOwner = request.project && request.project.authorId === req.user.id;
    const isResumeOwner = request.resume && request.resume.authorId === req.user.id;

    if (!isProjectOwner && !isResumeOwner) {
      return res.status(403).json({ error: "Bu arizani boshqarishga huquqingiz yo'q!" });
    }

    const updatedReq = await prisma.request.update({
      where: { id },
      data: { status }
    });

    res.status(200).json({ message: `Ariza holati ${status} ga o'zgardi.`, updatedReq });
  } catch (error) {
    res.status(500).json({ error: "Statusni o'zgartirishda xatolik." });
  }
};
