require('dotenv').config(); // Local testing uchun, Railway'da o'zi Variables'dan o'qiydi
const express = require('express');
const cors = require('cors');
const authRoutes = require('./src/routes/authRoutes');

const app = express();

// Xavfsizlik va sozlamalar
app.use(cors()); // Boshqa domenlardan keladigan so'rovlarga ruxsat berish
app.use(express.json()); // Kelayotgan ma'lumotlarni JSON formatida o'qish uchun

// === MARSHRUTLAR (API ROUTES) ===
app.use('/api/auth', authRoutes);

// Server ishlashini tekshirish uchun ochiq eshik
app.get('/', (req, res) => {
  res.status(200).json({ 
    status: "success",
    message: "ADU Startup Hub API muvaffaqiyatli ishlamoqda!",
    version: "1.0.0"
  });
});

// Noto'g'ri manzilga kirilsa, qaytariladigan javob
app.use('*', (req, res) => {
  res.status(404).json({ error: "Bunday manzil tizimda mavjud emas." });
});

// Serverni belgilangan portda yoqish
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[Server] Ishga tushdi: Port ${PORT}`);
});
