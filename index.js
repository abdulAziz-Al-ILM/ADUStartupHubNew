require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const projectRoutes = require('./src/routes/projectRoutes');
const problemRoutes = require('./src/routes/problemRoutes');
const resumeRoutes = require('./src/routes/resumeRoutes');   
const requestRoutes = require('./src/routes/requestRoutes'); 
const socialRoutes = require('./src/routes/socialRoutes');       
const dashboardRoutes = require('./src/routes/dashboardRoutes'); 

const app = express();

app.use(cors());
app.use(express.json());

// === FRONTEND SOZLAMALARI (EJS) ===
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));
app.use(express.static(path.join(__dirname, 'public')));

// === MARSHRUTLAR (API ROUTES) ===
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/problems', problemRoutes); 
app.use('/api/resumes', resumeRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/social', socialRoutes);       
app.use('/api/dashboard', dashboardRoutes); 

// === SAYT SAHIFALARI (FRONTEND) ===
app.get('/', (req, res) => {
  res.render('pages/landing'); // Yangi Asosiy Sahifa
});

app.get('/login', (req, res) => {
  res.render('pages/login'); // Kirish oynasi alohida manzilga ko'chdi
});

app.use('/api/*', (req, res) => {
  res.status(404).json({ error: "Bunday API manzil mavjud emas." });
});

app.use('*', (req, res) => {
  res.redirect('/'); 
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`[Server] Ishga tushdi: Port ${PORT}`);
});
