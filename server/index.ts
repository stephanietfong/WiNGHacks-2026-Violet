import bcrypt from "bcryptjs";
import cors from "cors";
import { randomUUID } from "crypto";
import express, { Request, Response } from "express";
import mongoose from "mongoose";
import nodemailer from "nodemailer";
import { connectDB } from "./db";
import User from "./models/User";

const app = express();

app.use(cors());
app.use(express.json());
connectDB();

// SIGN-UP
app.post("/signup", async (req: Request, res: Response) => {
  const email = req.body?.email?.trim().toLowerCase();
  const password = req.body?.password;
  const verificationCode = req.body?.verificationCode;
  const verificationCodeExpires = req.body?.verificationCodeExpires;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Email and password are required." });
  }

  if (password.length < 8) {
    return res
      .status(400)
      .json({ message: "Password must be at least 8 characters." });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Account already exists." });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      email,
      password: hashedPassword,
      verificationCode,
      verificationCodeExpires,
    });
    await newUser.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Verify Email",
      text: `Your verification code is ${verificationCode}`,
    });

    res.status(201).json({ message: "Account created!", userId: newUser._id });
  } catch (err) {
    if (err instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({ message: err.message });
    }

    if (err instanceof mongoose.mongo.MongoServerError && err.code === 11000) {
      return res.status(400).json({ message: "Account already exists." });
    }

    console.error("Signup failed:", err);
    res.status(500).json({ message: "Server error during signup" });
  }
});

// VERIFY EMAIL
app.post("/verifyemail/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        error: "Code are required",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    if (user.isVerified) {
      return res.json({
        success: true,
        message: "Email already verified",
        userId: user._id,
      });
    }

    if (!user.verificationCodeExpires) {
      return res.status(400).json({
        error: "No verification code found",
      });
    }

    if (user.verificationCodeExpires.getTime() < Date.now()) {
      return res.status(400).json({
        error: "Verification code expired",
      });
    }

    if (user.verificationCode !== code) {
      return res.status(400).json({
        error: "Invalid verification code",
      });
    }

    user.isVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpires = null;

    await user.save();

    return res.json({
      success: true,
      message: "Email verified successfully",
      userId: user._id,
    });
  } catch (err) {
    console.error("Verify Email Error:", err);

    res.status(500).json({
      error: "Server error",
    });
  }
});

app.post("/login", async (req: Request, res: Response) => {
  const email = req.body?.email?.trim().toLowerCase();
  const password = req.body?.password;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Email and password are required." });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    const pwMatch = await bcrypt.compare(password, user.password as string);
    if (!pwMatch) return res.status(400).json({ error: "Invalid credentials" });

    const token = `session_${randomUUID()}`;

    return res.status(200).json({ token, userId: user._id });
  } catch (err) {
    console.error("Login failed:", err);
    return res.status(500).json({ message: "Server error during login" });
  }
});

// --- PAGE 1: BASICS ---
app.put("/setup/page-1/:userId", async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { firstName, age, heightInches, pronouns, phone } = req.body;

  try {
    await User.findByIdAndUpdate(userId, {
      $set: {
        "profile.firstName": firstName,
        "profile.age": age,
        "profile.heightInches": heightInches,
        "profile.pronouns": pronouns,
        "profile.phone": phone,
      },
    });
    res.status(200).json({ message: "Page 1 saved!" });
  } catch (err) {
    res.status(500).json({ message: "Error saving Page 1" });
  }
});

// --- PAGE 2: PREFERENCES (Your existing code) ---
app.put("/setup/page-2/:userId", async (req: Request, res: Response) => {
  const { userId } = req.params;
  const {
    interests,
    minAge,
    maxAge,
    distanceMiles,
    relationshipType,
    latitude,
    longitude,
  } = req.body;

  try {
    await User.findByIdAndUpdate(userId, {
      $set: {
        interests,
        "preferences.minAge": minAge,
        "preferences.maxAge": maxAge,
        "preferences.distanceMiles": distanceMiles,
        "preferences.relationshipType": relationshipType,
        location: { type: "Point", coordinates: [longitude, latitude] },
      },
    });
    res.status(200).json({ message: "Page 2 saved!" });
  } catch (err) {
    res.status(500).json({ message: "Error saving Page 2" });
  }
});

// --- PAGE 3: PHOTOS & VERIFICATION TAG ---
app.put("/setup/page-3/:userId", async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { photos } = req.body; // Expecting: [{ url: "...", publicId: "...", isVerificationPhoto: true }, ...]

  try {
    if (!Array.isArray(photos) || photos.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one photo is required." });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const normalizedPhotos = photos.map((photo: any) => {
      const rawUrl = typeof photo?.url === "string" ? photo.url.trim() : "";
      const url =
        rawUrl && !rawUrl.startsWith("http") && cloudName
          ? `https://res.cloudinary.com/${cloudName}/image/upload/${rawUrl}`
          : rawUrl;

      return {
        url,
        isVerificationPhoto: Boolean(photo?.isVerificationPhoto),
      };
    });

    if (normalizedPhotos.some((photo: any) => !photo.url)) {
      return res
        .status(400)
        .json({ message: "Each photo must include a valid URL." });
    }

    // Basic check: Ensure at least one photo is tagged for verification
    const hasVerificationPhoto = normalizedPhotos.some(
      (photo: any) => photo.isVerificationPhoto,
    );
    if (!hasVerificationPhoto) {
      return res
        .status(400)
        .json({ message: "You must tag one photo for verification." });
    }

    const updateResult = await User.updateOne(
      { _id: userId },
      {
        $set: { "profile.photos": normalizedPhotos },
      },
    );

    if (updateResult.matchedCount === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({ message: "Photos uploaded!" });
  } catch (err) {
    res.status(500).json({ message: "Error saving photos" });
  }
});

// --- DELETE PHOTO ---
app.delete(
  "/users/:userId/photos/:photoIndex",
  async (req: Request, res: Response) => {
    try {
      const { userId, photoIndex } = req.params;

      if (!userId || photoIndex === undefined) {
        return res
          .status(400)
          .json({ message: "Missing userId or photoIndex" });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const index = parseInt(photoIndex as string, 10);
      if (isNaN(index) || index < 0 || index >= user.profile.photos.length) {
        return res.status(400).json({ message: "Invalid photo index" });
      }

      const photoToDelete = user.profile.photos[index];
      if (!photoToDelete) {
        return res.status(400).json({ message: "Photo not found" });
      }

      // Delete from Cloudify first (optional, requires API credentials and publicId)
      if (
        photoToDelete.publicId &&
        process.env.CLOUDINARY_API_SECRET &&
        process.env.CLOUDINARY_API_KEY
      ) {
        try {
          const cloudinary = require("cloudinary").v2;
          cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
          });

          await cloudinary.uploader.destroy(photoToDelete.publicId);
        } catch (cloudinaryError) {
          // Log but don't fail the request if Cloudinary deletion fails
          console.error("Cloudinary deletion error:", cloudinaryError);
        }
      }

      // Remove from MongoDB using proper array modification
      const updatedPhotos = user.profile.photos.filter((_, i) => i !== index);

      // If deleted photo was verification photo and there are still photos left, mark first as verification
      if (photoToDelete.isVerificationPhoto && updatedPhotos.length > 0) {
        updatedPhotos[0].isVerificationPhoto = true;
      }

      user.profile.photos = updatedPhotos;
      await user.save();

      res.status(200).json({ message: "Photo deleted successfully" });
    } catch (err) {
      console.error("Delete photo error:", err);
      res.status(500).json({ message: "Error deleting photo" });
    }
  },
);

// --- GET USER PHOTOS ---
app.get("/users/:userId/photos", async (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user.profile.photos);
  } catch (err) {
    res.status(500).json({ message: "Error retrieving photos" });
  }
});

// --- GET INTERESTS LIST ---
app.get("/interests", (req: Request, res: Response) => {
  const interests = [
    "Coffee",
    "Tea",
    "Boba",
    "Hiking",
    "Rock Climbing",
    "Yoga",
    "Painting",
    "Music",
    "Reading",
    "Gaming",
    "Cooking",
    "Traveling",
    "Photography",
    "Dancing",
    "Running",
    "Swimming",
    "Gardening",
    "Writing",
    "Board Games",
    "Meditation",
    "Skiing",
    "Cycling",
    "Crochet",
    "Thrifting",
    "Astrology",
    "Pottery",
    "Roller Skating",
    "Anime",
    "Horror Movies",
    "Study Dates",
    "Indie Music",
    "Stargazing",
    "Plants",
    "Film Photography",
    "Digital Art",
    "Poetry",
    "True Crime",
    "K-Pop",
    "Tarot",
    "Hammocking",
    "Foraging",
    "Vegan Cooking",
    "Weightlifting",
    "Tennis",
    "Late Night Snacks",
    "Museums",
    "Vinyl Records",
  ];
  res.status(200).json({ interests });
});

const startServer = async () => {
  await connectDB();

  app.listen(3000, () => console.log("Server running on port 3000"));
};

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
