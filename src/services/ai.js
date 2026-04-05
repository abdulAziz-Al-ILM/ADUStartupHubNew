/**
 * AI Xizmati - Matnlarni tekshirish va tahlil qilish uchun
 * Agar .env da AI_API_KEY bo'lmasa, tizim to'xtab qolmasligi uchun himoyaviy simulyator ishlaydi.
 */

// 1. Matnni senzuradan o'tkazish (Profil, Xabarlar, Bekor qilish sabablari uchun)
const checkTextContent = async (text) => {
  if (!text) return { isSafe: true, filteredText: "" };

  // Yomon so'zlar ro'yxati (Simulyatsiya uchun)
  const badWords = ['ahmoq', 'jinnixona', 'yomon_soz_1', 'terror', 'radikal'];
  
  let isSafe = true;
  let filteredText = text;

  badWords.forEach(word => {
    const regex = new RegExp(word, 'gi');
    if (regex.test(filteredText)) {
      isSafe = false;
      filteredText = filteredText.replace(regex, '[o\'zgartirildi]');
    }
  });

  // Agar haqiqiy AI API ulangan bo'lsa, bu yerda fetch orqali AI ga so'rov ketadi...
  // if(process.env.AI_API_KEY) { ... }

  return { isSafe, filteredText };
};

// 2. Startap loyihasi uchun AI tomonidan 15 ta sohadan birini tanlash
const categorizeProject = async (goal, reason) => {
  const text = (goal + " " + reason).toLowerCase();
  
  // Oddiy AI klassifikator simulyatsiyasi
  if (text.includes('dastur') || text.includes('texnologiya')) return 'IT_ENGINEER';
  if (text.includes('dizayn') || text.includes('rang')) return 'UI_UX_DESIGNER';
  if (text.includes('sotish') || text.includes('bozor')) return 'MARKETOLOG';
  if (text.includes('pul') || text.includes('daromad')) return 'ECONOMIST';
  if (text.includes('tabiat') || text.includes('daraxt')) return 'ECOLOGIST';
  if (text.includes('o\'qish') || text.includes('maktab')) return 'PEDAGOGUE';
  if (text.includes('bemor') || text.includes('shifo')) return 'DOCTOR';
  
  // Hech biriga tushmasa, default menejer
  return 'PROJECT_MANAGER'; 
};

// 3. Muammolar bazasi uchun g'oyani baholash
const evaluateIdea = async (title, description) => {
  const len = description.length;
  if (len < 20) {
    return { isUseful: false, feedback: "Bu muammo juda qisqa yozilgan, iltimos to'liqroq yoriting." };
  }
  
  return { 
    isUseful: true, 
    feedback: "Ajoyib muammo! Bu haqiqatan ham jamiyatda yechimini kutayotgan masalalardan biri." 
  };
};

module.exports = {
  checkTextContent,
  categorizeProject,
  evaluateIdea
};
