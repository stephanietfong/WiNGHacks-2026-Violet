import cors from "cors";
import { randomUUID } from "crypto";
import express, { Request, Response } from "express";
import mongoose from "mongoose";
import { connectDB } from "./db";
import User from "./models/User";

const app = express();

app.use(cors());
app.use(express.json());

// --- SIGNUP (Already perfect) ---
app.post("/signup", async (req: Request, res: Response) => {
  const email = req.body?.email?.trim().toLowerCase();
  const password = req.body?.password;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Email and password are required." });
  }

  if (!email.endsWith(".edu")) {
    return res.status(400).json({ message: "Only .edu emails are permitted." });
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

    const newUser = new User({ email, password });
    await newUser.save();

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

const handleLogin = async (req: Request, res: Response) => {
  const email = req.body?.email?.trim().toLowerCase();
  const password = req.body?.password;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Email and password are required." });
  }

  try {
    const user = await User.findOne({ email });

    if (!user || user.password !== password) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    const token = `session_${randomUUID()}`;

    return res.status(200).json({ token, userId: user._id });
  } catch (err) {
    console.error("Login failed:", err);
    return res.status(500).json({ message: "Server error during login" });
  }
};

app.post("/login", handleLogin);
app.post("/auth/login", handleLogin);

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
  const { photos } = req.body; // Expecting: [{ url: "...", isVerificationPhoto: true }, ...]

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
