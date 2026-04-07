const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getDashboardStats = async (req, res) => {
  try {
    const userRole = req.user.role;

    // 1. Asosiy umumiy statistika (Barcha rollar uchun)
    const totalSpecialists = await prisma.user.count({ where: { role: 'STUDENT' } });

    // Mutaxassislar sohalar bo'yicha taqsimoti (Rahbar va Tyutor paneli diagrammasi uchun)
    const professionStats = await prisma.user.groupBy({
      by: ['profession'],
      where: { role: 'STUDENT', profession: { not: null } },
      _count: { profession: true }
    });

    // Barcha Startaplar holatlari bo'yicha taqsimoti
    const statuses = await prisma.project.groupBy({
      by: ['status'],
      _count: { status: true }
    });

    let formatStatuses = {
      TEAM_BUILDING: 0,
      MVP_PREPARATION: 0,
      NEED_INVESTMENT: 0,
      READY_FOR_MARKET: 0,
      MARKET_TESTING: 0,
      IN_MARKET: 0,
      FINISHED: 0
    };

    statuses.forEach(s => {
      if(formatStatuses[s.status] !== undefined) {
         formatStatuses[s.status] = s._count.status;
      }
    });

    // 2. Rahbarlar (LEADER, ADMIN) uchun MAXSUS axborot
    let leaderData = null;
    if (userRole === 'LEADER' || userRole === 'ADMIN') {
      // AI tomonidan tasalli berilgan yoki sababi ko'rsatilib yopilgan loyihalar
      const canceledProjects = await prisma.project.findMany({
        where: { status: 'FINISHED' },
        select: { title: true, status: true, cancelReason: true },
        orderBy: { updatedAt: 'desc' },
        take: 10 // Oxirgi 10 tasini oladi
      });
      leaderData = { canceledProjects, professionStats };
    }

    // 3. Tyutorlar (TUTOR) uchun MAXSUS axborot
    let tutorData = null;
    if (userRole === 'TUTOR') {
      const invitedStudents = await prisma.user.findMany({
        where: { invitedById: req.user.id },
        select: { nickname: true, profession: true, projects: { select: { title: true, status: true } } }
      });
      tutorData = { invitedStudentsCount: invitedStudents.length, invitedStudents, professionStats };
    }

    // Natijani mijozga yuborish
    res.status(200).json({
      role: userRole,
      generalStats: {
        totalSpecialists,
        projectStatuses: formatStatuses
      },
      ...(leaderData && { leaderData }),
      ...(tutorData && { tutorData })
    });

  } catch (error) {
    console.error("Dashboard yuklashda xato:", error);
    res.status(500).json({ error: "Dashboard ma'lumotlarini yuklashda xato." });
  }
};
