// db/connectDb.js
const mongoose = require('mongoose');

const connectDb = async () => {
  try {
    const uri = process.env.MONGO_URI; // 🔑 read from .env
    if (!uri) {
      throw new Error("❌ MONGO_URI environment variable is not set");
    }

    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1); // stop app if DB not connected
  }
};

module.exports = connectDb;
