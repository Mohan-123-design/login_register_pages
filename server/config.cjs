require("dotenv").config();

module.exports = {
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI || "mongodb://localhost:27017/aieducation",
  JWT_SECRET: process.env.JWT_SECRET || "aieducation-secret-key",
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || "http://localhost:5173",
};