import * as mongoose from 'mongoose';
export const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI ||
      process.env.MONGODB_URI ||
      process.env.DATABASE_URL ||
      "mongodb://127.0.0.1:27017/blogDB"
    );
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1); // stop server if DB fails
  }
};
