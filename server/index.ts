import bcrypt from "bcryptjs";
import cors from "cors";
import { randomUUID } from "crypto";
import dotenv from "dotenv";
import express, { Request, Response } from "express";
import mongoose from "mongoose";
import nodemailer from "nodemailer";
import path from "path";
import { connectDB } from "./db";
import Match from "./models/Match";
import Message from "./models/Message";
import User from "./models/User";

dotenv.config({ path: path.resolve(process.cwd(), "server/.env") });
dotenv.config({ path: path.resolve(__dirname, ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

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
      const rawPublicId =
        typeof photo?.publicId === "string" ? photo.publicId.trim() : "";
      const rawSourceTag =
        typeof photo?.sourceTag === "string" ? photo.sourceTag.trim() : "";
      const url =
        rawUrl && !rawUrl.startsWith("http") && cloudName
          ? `https://res.cloudinary.com/${cloudName}/image/upload/${rawUrl}`
          : rawUrl;

      return {
        url,
        publicId: rawPublicId || undefined,
        isVerificationPhoto: Boolean(photo?.isVerificationPhoto),
        sourceTag: rawSourceTag || undefined,
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

// --- GET USER PROFILE (READ-ONLY) ---
app.get("/users/:userId/profile", async (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId).lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      userId: user._id,
      email: user.email,
      profile: user.profile ?? {},
      interests: user.interests ?? [],
      preferences: user.preferences ?? {},
      location: user.location ?? null,
      locationPermission: user.locationPermission ?? null,
    });
  } catch (err) {
    return res.status(500).json({ message: "Error retrieving user profile" });
  }
});

// --- UPDATE USER PREFERENCE AGE RANGE ---
app.patch(
  "/users/:userId/preferences/age-range",
  async (req: Request, res: Response) => {
    const { userId } = req.params;
    const minAge = Number(req.body?.minAge);
    const maxAge = Number(req.body?.maxAge);

    if (!Number.isFinite(minAge) || !Number.isFinite(maxAge)) {
      return res
        .status(400)
        .json({ message: "minAge and maxAge are required" });
    }

    if (minAge < 18 || maxAge > 100 || minAge > maxAge) {
      return res.status(400).json({
        message: "Age range must be between 18 and 100, and minAge <= maxAge",
      });
    }

    try {
      const updated = await User.findByIdAndUpdate(
        userId,
        {
          $set: {
            "preferences.minAge": minAge,
            "preferences.maxAge": maxAge,
          },
        },
        { new: true },
      ).lean();

      if (!updated) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.status(200).json({
        message: "Age range updated",
        preferences: updated.preferences ?? {},
      });
    } catch (err) {
      return res.status(500).json({ message: "Error updating age range" });
    }
  },
);

// --- UPDATE USER PREFERENCE DISTANCE ---
app.patch(
  "/users/:userId/preferences/distance",
  async (req: Request, res: Response) => {
    const { userId } = req.params;
    const distanceMiles = Number(req.body?.distanceMiles);

    if (!Number.isFinite(distanceMiles)) {
      return res.status(400).json({ message: "distanceMiles is required" });
    }

    if (distanceMiles < 1 || distanceMiles > 1000) {
      return res
        .status(400)
        .json({ message: "distanceMiles must be between 1 and 1000" });
    }

    try {
      const updated = await User.findByIdAndUpdate(
        userId,
        {
          $set: {
            "preferences.distanceMiles": distanceMiles,
          },
        },
        { new: true },
      ).lean();

      if (!updated) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.status(200).json({
        message: "Distance updated",
        preferences: updated.preferences ?? {},
      });
    } catch (err) {
      return res.status(500).json({ message: "Error updating distance" });
    }
  },
);

// --- UPDATE USER PROFILE BANNED WORDS ---
app.patch(
  "/users/:userId/profile/banned-words",
  async (req: Request, res: Response) => {
    const defaultBannedWords = [
      "unicorn",
      "throuple",
      "threesome",
      "pineapple",
      "looking for a third",
    ];

    const { userId } = req.params;
    const inputWords = req.body?.bannedWords;

    if (!Array.isArray(inputWords)) {
      return res.status(400).json({ message: "bannedWords must be an array" });
    }

    const customWords = Array.from(
      new Set(
        inputWords
          .map((word) =>
            typeof word === "string" ? word.trim().toLowerCase() : "",
          )
          .filter(
            (word) => Boolean(word) && !defaultBannedWords.includes(word),
          ),
      ),
    ).slice(0, 50);

    const normalizedWords = [...defaultBannedWords, ...customWords];

    try {
      const updated = await User.findByIdAndUpdate(
        userId,
        {
          $set: {
            "profile.bannedWords": normalizedWords,
          },
        },
        { new: true },
      ).lean();

      if (!updated) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.status(200).json({
        message: "Banned words updated",
        bannedWords: updated.profile?.bannedWords ?? [],
        customBannedWords: customWords,
      });
    } catch (err) {
      return res.status(500).json({ message: "Error updating banned words" });
    }
  },
);

// --- DISCOVERY: GET ALL PROFILES WITH CURRENT MATCH STATUS ---
app.get("/discovery/:userId/profiles", async (req: Request, res: Response) => {
  const userIdParam = req.params.userId;
  const userId = Array.isArray(userIdParam) ? userIdParam[0] : userIdParam;

  if (!userId) {
    return res.status(400).json({ message: "userId is required" });
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid userId" });
  }

  try {
    const currentUser = await User.findById(userId).select("_id").lean();
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const matches = await Match.find({
      users: userObjectId,
      status: { $in: ["matched", "blocked"] },
    })
      .select("users")
      .lean();

    const excludedUserIds = matches
      .map((match) =>
        match.users.find((id) => String(id) !== userId),
      )
      .filter((id): id is mongoose.Types.ObjectId => Boolean(id));

    const users = await User.find({
      _id: { $nin: [userObjectId, ...excludedUserIds] },
    })
      .select("email profile interests preferences")
      .lean();

    return res.status(200).json({
      profiles: users.map((user) => ({
        userId: user._id,
        email: user.email,
        profile: user.profile ?? {},
        interests: user.interests ?? [],
        preferences: user.preferences ?? {},
      })),
    });
  } catch (err) {
    return res.status(500).json({ message: "Error loading discovery profiles" });
  }
});

// --- MATCHES: UPDATE STATUS FOR A PROFILE ---
app.put("/matches/status", async (req: Request, res: Response) => {
  const actorUserId = req.body?.actorUserId;
  const targetUserId = req.body?.targetUserId;
  const status = req.body?.status;

  if (!actorUserId || !targetUserId || !status) {
    return res.status(400).json({ message: "actorUserId, targetUserId, and status are required" });
  }

  if (!mongoose.Types.ObjectId.isValid(actorUserId) || !mongoose.Types.ObjectId.isValid(targetUserId)) {
    return res.status(400).json({ message: "Invalid user id" });
  }

  if (actorUserId === targetUserId) {
    return res.status(400).json({ message: "Cannot set a match status for yourself" });
  }

  if (!["matched", "blocked"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  try {
    const actor = await User.findById(actorUserId).select("_id").lean();
    const target = await User.findById(targetUserId).select("_id").lean();

    if (!actor || !target) {
      return res.status(404).json({ message: "User not found" });
    }

    const matchedAt = status === "matched" ? new Date() : undefined;
    const actorObjectId = new mongoose.Types.ObjectId(actorUserId);
    const targetObjectId = new mongoose.Types.ObjectId(targetUserId);

    const existingMatch = await Match.findOne({
      users: { $all: [actorObjectId, targetObjectId] },
    });

    let updated;

    if (existingMatch) {
      existingMatch.status = status;
      existingMatch.likedBy = actorObjectId;
      existingMatch.recipient = targetObjectId;
      existingMatch.matchedAt = matchedAt;
      updated = await existingMatch.save();
    } else {
      updated = await Match.create({
        users: [actorObjectId, targetObjectId],
        status,
        likedBy: actorObjectId,
        recipient: targetObjectId,
        matchedAt,
      });
    }

    return res.status(200).json({
      message: "Match status updated",
      match: updated,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error updating match status";
    return res.status(500).json({ message });
  }
});

// --- LIKES: GET USERS WHO CHECKED ON ME ---
app.get("/likes/:userId/incoming", async (req: Request, res: Response) => {
  const userIdParam = req.params.userId;
  const userId = Array.isArray(userIdParam) ? userIdParam[0] : userIdParam;

  if (!userId) {
    return res.status(400).json({ message: "userId is required" });
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid userId" });
  }

  try {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const incomingMatches = await Match.find({
      recipient: userObjectId,
      likedBy: { $ne: userObjectId },
      status: "matched",
    })
      .select("likedBy matchedAt")
      .lean();

    if (incomingMatches.length === 0) {
      return res.status(200).json({ likes: [] });
    }

    const likedByIds = incomingMatches.map((match) => match.likedBy);

    const users = await User.find({
      _id: { $in: likedByIds },
    })
      .select("email profile interests preferences")
      .lean();

    const userById = new Map(users.map((user) => [String(user._id), user]));

    const likes = incomingMatches
      .map((match) => {
        const user = userById.get(String(match.likedBy));
        if (!user) return null;

        return {
          userId: user._id,
          email: user.email,
          profile: user.profile ?? {},
          interests: user.interests ?? [],
          preferences: user.preferences ?? {},
          matchedAt: match.matchedAt ?? null,
        };
      })
      .filter(Boolean);

    return res.status(200).json({ likes });
  } catch (err) {
    return res.status(500).json({ message: "Error loading likes" });
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

// --- GET ALL CHATS FOR A USER ---
app.get("/messages/chats/:userId", async (req: Request, res: Response) => {
  const { userId } = req.params as { userId?: string };

  if (!userId) {
    return res.status(400).json({ message: "userId is required" });
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid userId" });
  }

  try {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const matches = await Match.find({ users: userObjectId })
      .select("_id users status matchedAt")
      .lean();

    if (matches.length === 0) {
      return res.status(200).json({ chats: [] });
    }

    const matchIds = matches.map((match) => match._id);

    const messages = await Message.find({
      matchId: { $in: matchIds },
    })
      .sort({ createdAt: 1 })
      .lean();

    const messagesByMatch = new Map<string, typeof messages>();

    for (const message of messages) {
      const key = String(message.matchId);
      if (!messagesByMatch.has(key)) {
        messagesByMatch.set(key, []);
      }
      messagesByMatch.get(key)?.push(message);
    }

    const chats = matches.map((match) => ({
      matchId: match._id,
      users: match.users,
      status: match.status,
      matchedAt: match.matchedAt,
      messages: messagesByMatch.get(String(match._id)) ?? [],
    }));

    return res.status(200).json({ chats });
  } catch (err) {
    console.error("Fetch chats failed:", err);
    return res.status(500).json({ message: "Server error fetching chats" });
  }
});

const startServer = async () => {
  await connectDB();

  app.listen(3000, () => console.log("Server running on port 3000"));
};

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
