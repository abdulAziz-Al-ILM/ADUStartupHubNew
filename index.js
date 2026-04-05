require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');       // Yangi qo'shildi
const projectRoutes = require('./src/routes/projectRoutes');
const resumeRoutes = require('./src/routes/resumeRoutes');   
const requestRoutes = require('./src/routes/requestRoutes'); 

const app = express();

app.use(cors());
app.use(express.json());

// === MARSHRUTLAR (API ROUTES) ===
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);         // Profil uchun yo'nalish
app.use('/api/projects', projectRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/requests', requestRoutes);

app.get('/', (req, res) => {
  res.status(200).json({ 
    status: "success",
    message: "ADU Startup Hub API to'liq quvvatda ishlamoqda!",
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
