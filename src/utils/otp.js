/**
 * 4 xonali tasodifiy OTP kod generatori
 * @returns {string} Masalan: "4829"
 */
const generateOTP = () => {
  // 1000 dan 9999 gacha bo'lgan tasodifiy son
  const otp = Math.floor(1000 + Math.random() * 9000);
  return otp.toString();
};

module.exports = { generateOTP };
