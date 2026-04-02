require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Yo'nalishlarni (Routes) chaqirib olamiz
const authRoutes = require('./src/routes/authRoutes');
const projectRoutes = require('./src/routes/projectRoutes'); // Yangi ulangan joy

const app = express();

app.use(cors());
app.use(express.json());

// === MARSHRUTLAR (API ROUTES) ===
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes); // Loyihalar uchun marshrut

app.get('/', (req, res) => {
  res.status(200).json({ 
    status: "success",
    message: "ADU Startup Hub API muvaffaqiyatli ishlamoqda!",
    version: "1.0.0"
  });
});

app.use('*', (req, res) => {
  res.status(404).json({ error: "Bunday manzil tizimda mavjud emas." });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[Server] Ishga tushdi: Port ${PORT}`);
});
