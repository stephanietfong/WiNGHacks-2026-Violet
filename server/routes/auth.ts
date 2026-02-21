import bcrypt from "bcryptjs";
import express from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User";

const router = express.Router();

router.post("/signup", async (req, res) => {
  const { email, password } = req.body;

  // Check existing
  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(400).json({ message: "User already exists" });
  }

  // Hash password
  const hashed = await bcrypt.hash(password, 10);

  const user = await User.create({
    email,
    password: hashed,
  });

  res.json({ message: "User created" });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  // Create token
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, {
    expiresIn: "7d",
  });

  res.json({ token });
});

export default router;
