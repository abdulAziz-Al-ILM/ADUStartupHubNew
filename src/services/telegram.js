const TelegramBot = require('node-telegram-bot-api');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { generateComplexOTP } = require('../utils/otp');

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.ADMIN_TELEGRAM_ID;

let bot;

// Telegram Botni "Polling" (doimiy quloq solish) rejimida yoqamiz
if (token) {
  bot = new TelegramBot(token, { polling: true });
  console.log("[Telegram Bot] Xavfsizlik tizimi faollashdi.");

  // Tugmalar bosilganda ishlaydigan mantiq
  bot.on('callback_query', async (query) => {
    const data = query.data;
    
    // Agar "Ha, bu menman" bosilsa
    if (data.startsWith('approve_login_')) {
      const email = data.split('_')[2]; 
      
      // 20 xonali murakkab kod va 20 soniyalik cheklov
      const complexCode = generateComplexOTP(20);
      const expiresAt = new Date(Date.now() + 20 * 1000);

      // Bazaga kodni va vaqtni yozamiz
      await prisma.user.update({
        where: { email },
        data: { adminAuthCode: complexCode, adminCodeExp: expiresAt }
      });

      // Tugma bosildi deb xabar beramiz (Yuklanishni to'xtatish uchun)
      bot.answerCallbackQuery(query.id, { text: "Ruxsat berildi. Kod yaratilmoqda!" });

      // Adminga kodni yuboramiz
      bot.sendMessage(query.message.chat.id, `✅ RUXSAT BERILDI!\n\n🔐 Sizning 20 soniyalik murakkab kodingiz:\n\n\`${complexCode}\`\n\n⏳ Zudlik bilan tizimga kiriting!`, { parse_mode: 'Markdown' });
    
    // Agar "Yo'q, bloklash" bosilsa
    } else if (data.startsWith('reject_login_')) {
      bot.answerCallbackQuery(query.id, { text: "Bloklandi!" });
      bot.sendMessage(query.message.chat.id, "🚫 Hakerlik urinishi rad etildi. Tizim xavfsiz.");
    }
  });
}

/**
 * Adminga ruxsat so'rovchi interaktiv xabar yuborish
 */
const sendAdminApprovalRequest = async (email, deviceInfo) => {
  if (!bot || !chatId) {
    console.warn("⚠️ Telegram Bot Token yoki Admin ID mavjud emas!");
    return false;
  }

  const text = `🚨 ADMIN PANELGA KIRISH URINISHI!\n\n💻 Qurilma: ${deviceInfo}\n🕒 Vaqt: ${new Date().toLocaleString()}\n\nBu sizmisiz?`;
  
  // Inline tugmalar
  const options = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "✅ Ha, bu menman", callback_data: `approve_login_${email}` }
        ],
        [
          { text: "❌ Yo'q, bloklash", callback_data: `reject_login_${email}` }
        ]
      ]
    }
  };

  try {
    await bot.sendMessage(chatId, text, options);
    return true;
  } catch (error) {
    console.error("[Telegram] Xabar yuborishda xatolik:", error);
    return false;
  }
};

module.exports = { sendAdminApprovalRequest };
