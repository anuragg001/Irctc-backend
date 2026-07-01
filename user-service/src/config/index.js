const config = {
  SERVICE_NAME: require('../../package.json').name,
  PORT: Number(process.env.PORT) || 4001,
  NODE_ENV: process.env.NODE_ENV || "development",
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
  DATABASE_URL: process.env.DATABASE_URL,
  REDIS_URL: process.env.REDIS_URL,
  KAFKA_BROKER: process.env.KAFKA_BROKER,
  KAFKA_CLIENT_ID: process.env.KAFKA_CLIENT_ID,
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,

  OTP_TTL: process.env.OTP_TTL || 300,
  OTP_RATE_MAX_PER_HOUR: process.env.OTP_RATE_MAX_PER_HOUR || 5,
  OTP_MAX_VERIFY_ATTEMPTS: process.env.OTP_MAX_VERIFY_ATTEMPTS || 5,
  OTP_HMAC_SECRET: process.env.OTP_HMAC_SECRET || "09dc0abbb2961391d822610b31b912e3231d4d2745c76b1ef4765af4c62f6079",

  MAIL_USER: process.env.MAIL_USER,
  MAIL_PASS: process.env.MAIL_PASS,

  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || "1804f8166540b4f34c0d5504ec56d6f61df11bb1ac604acad319cddfcb58c1ba",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "3f2f10664f26665f19a58f27d7b05be4cb2272db04ef38f855531a44ff1dfbdda63e97b5fe8b8e3db172bea57e10e16aeb9c444bfa5c05dde54a8b25932116ec",

  ACCESS_TOKEN_EXP: process.env.ACCESS_TOKEN_EXP || "15m",
  REFRESH_TOKEN_EXP: process.env.REFRESH_TOKEN_EXP || "7d",

  ACCESS_TOKEN_EXP_SEC: Number(process.env.ACCESS_TOKEN_EXP_SEC || 900),
  REFRESH_TOKEN_EXP_SEC: Number(process.env.REFRESH_TOKEN_EXP_SEC || 604800),

  REDIS_USER_TTL: Number(process.env.REDIS_USER_TTL || 86400)
}


module.exports = { config };