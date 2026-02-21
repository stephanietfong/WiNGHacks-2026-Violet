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
  const { photos } = req.body; // Expecting: [{ url: "...", isVerificationPhoto: true }, ...]

  try {
    // Basic check: Ensure at least one photo is tagged for verification
    const hasVerificationPhoto = photos.some((p: any) => p.isVerificationPhoto);
    if (!hasVerificationPhoto) {
      return res
        .status(400)
        .json({ message: "You must tag one photo for verification." });
    }

    await User.findByIdAndUpdate(userId, { $set: { photos } });
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

app.listen(3000, () => console.log("Server running on port 3000"));
