const jwt = require('jsonwebtoken');

/**
 * Foydalanuvchi tizimga kirganligini tekshiruvchi himoya
 */
const protect = (req, res, next) => {
  let token;

  // Header'da "Bearer <token>" shaklida kelganini tekshiramiz
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Tokenning o'zini ajratib olamiz
      token = req.headers.authorization.split(' ')[1];

      // Tokenni .env dagi maxfiy kalit orqali ochamiz (qalbaki emasligini tekshiramiz)
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Foydalanuvchi ma'lumotlarini keyingi jarayonlar uchun saqlab qo'yamiz
      req.user = decoded;
      
      next(); // Ruxsat berildi, keyingi bosqichga o'tish mumkin
    } catch (error) {
      console.error("Token xatosi:", error);
      return res.status(401).json({ error: "Ruxsat yo'q, token muddati tugagan yoki xato!" });
    }
  }

  if (!token) {
    return res.status(401).json({ error: "Ruxsat yo'q, tizimga kirmagansiz!" });
  }
};

/**
 * Faqat Adminlarga ruxsat beruvchi qulf
 */
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    res.status(403).json({ error: "Bu amaliyotni faqat Admin bajara oladi!" });
  }
};

module.exports = { protect, adminOnly };
