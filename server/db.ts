import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MONGO_URI is missing in server/.env");
    }

    const conn = await mongoose.connect(mongoUri, {
      dbName: process.env.MONGO_DB_NAME || "violet",
    });

    console.log(`🚀 MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`❌ Error: ${error.message}`);
    } else {
      console.error("❌ An unknown error occurred while connecting to MongoDB");
    }
    // Exit process with failure
    process.exit(1);
  }
};
