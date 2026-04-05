const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getDashboardStats = async (req, res) => {
  try {
    const userRole = req.user.role;

    // 1. Asosiy umumiy statistika
    const totalSpecialists = await prisma.user.count({ where: { role: 'STUDENT' } });
    
    // Statuslar bo'yicha loyihalar
    const statuses = await prisma.project.groupBy({
      by: ['status'],
      _count: { status: true }
    });

    let formatStatuses = {
      TEAM_BUILDING: 0,
      MVP_PREPARATION: 0,
      MARKET_PREPARATION: 0,
      IN_MARKET: 0,
      FINISHED: 0,
      REJECTED: 0
    };

    statuses.forEach(s => {
      formatStatuses[s.status] = s._count.status;
    });

    // 2. Rahbarlar (LEADER, ADMIN) uchun qo'shimcha ma'lumotlar
    let leaderData = null;
    if (userRole === 'LEADER' || userRole === 'ADMIN') {
      const canceledProjects = await prisma.project.findMany({
        where: { OR: [{ status: 'REJECTED' }, { status: 'FINISHED' }] },
        select: { title: true, status: true, cancelReason: true } // AI tozalagan sabablar
      });
      leaderData = { canceledProjects };
    }

    // 3. Tyutorlar (TUTOR) uchun o'zining talabalari statistikasi
    let tutorData = null;
    if (userRole === 'TUTOR') {
      const invitedStudents = await prisma.user.findMany({
        where: { invitedById: req.user.id },
        select: { nickname: true, profession: true, projects: { select: { title: true, status: true } } }
      });
      tutorData = { invitedStudentsCount: invitedStudents.length, invitedStudents };
    }

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
    res.status(500).json({ error: "Dashboard ma'lumotlarini yuklashda xato." });
  }
};
