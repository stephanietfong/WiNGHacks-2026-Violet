import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  email: string;
  password?: string;
  verificationCode: string | null;
  verificationCodeExpires: Date | null;
  isVerified: boolean;
  profile: {
    firstName?: string;
    age?: number;
    heightInches?: number;
    phone?: string;
    pronouns?: string;
    photos: {
      url: string;
      publicId?: string;
      isVerificationPhoto: boolean;
      sourceTag?: string;
    }[];
    bannedWords: string[];
  };
  interests?: string[];
  preferences?: {
    minAge?: number;
    maxAge?: number;
    distanceMiles?: number;
    relationshipType?: string;
  };
  location?: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
  locationPermission?: string;
}

const UserSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  verificationCode: { type: String },
  verificationCodeExpires: { type: Date },
  isVerified: { type: Boolean, default: false },
  profile: {
    firstName: String,
    age: Number,
    heightInches: Number,
    phone: String,
    pronouns: String,
    photos: [
      {
        url: String,
        publicId: String,
        isVerificationPhoto: Boolean,
        sourceTag: String,
      },
    ],
    // Pre-fill with your community safety words
    bannedWords: {
      type: [String],
      default: [
        "unicorn",
        "unic0rn",
        "uñicorn",
        "uñic0rn",
        "throuple",
        "thr0uple",
        "threesome",
        "pineapple",
        "pine4pple",
        "p1neapple",
        "p1ne4pple",
        "looking for a third",
        "couple",
        "c0uple",
        "cöuple",
        "cöup1e",
      ],
    },
  },
  interests: [String],
  preferences: {
    minAge: Number,
    maxAge: Number,
    distanceMiles: Number,
    relationshipType: String,
  },
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], index: "2dsphere" }, // Essential for radius search
  },
  locationPermission: String,
});

export default mongoose.model<IUser>("User", UserSchema);
