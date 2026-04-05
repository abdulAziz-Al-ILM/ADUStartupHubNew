/**
 * 4 xonali tasodifiy OTP kod generatori (Talabalar uchun)
 */
const generateOTP = () => {
  const otp = Math.floor(1000 + Math.random() * 9000);
  return otp.toString();
};

/**
 * 20 xonali juda murakkab kod generatori (Admin xavfsizligi uchun)
 */
const generateComplexOTP = (length = 20) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

module.exports = { generateOTP, generateComplexOTP };
