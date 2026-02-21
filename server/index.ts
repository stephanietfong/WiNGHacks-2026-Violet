import cors from "cors";
import express, { Request, Response } from "express";
import { connectDB } from "./db";
import User from "./models/User";

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

// --- SIGNUP (Already perfect) ---
app.post("/signup", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email.endsWith(".edu")) {
    return res.status(400).json({ message: "Only .edu emails are permitted." });
  }
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Account already exists." });

    const newUser = new User({ email, password });
    await newUser.save();

    res.status(201).json({ message: "Account created!", userId: newUser._id });
  } catch (err) {
    res.status(500).json({ message: "Server error during signup" });
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
    // Basic check: Ensure at least one photo is tagged for verification
    const hasVerificationPhoto = photos.some((p: any) => p.isVerificationPhoto);
    if (!hasVerificationPhoto) {
      return res
        .status(400)
        .json({ message: "You must tag one photo for verification." });
    }

    await User.findByIdAndUpdate(userId, {
      $set: { "profile.photos": photos },
    });
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

app.listen(3000, () => console.log("Server running on port 3000"));
