import mongoose, { Document, Schema, Types } from "mongoose";

export type MatchStatus = "matched" | "pending" | "blocked";

export interface IMatch extends Document {
  users: [Types.ObjectId, Types.ObjectId];
  status: MatchStatus;
  likedBy: Types.ObjectId;
  recipient: Types.ObjectId;
  matchedAt?: Date;
}

const MatchSchema: Schema = new Schema({
  users: {
    type: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
    validate: {
      validator: (value: Types.ObjectId[]) => value.length === 2,
      message: "users must contain exactly two user IDs",
    },
    required: true,
  },
  status: {
    type: String,
    enum: ["matched", "pending", "blocked"],
    default: "pending",
  },
  likedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  recipient: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  matchedAt: {
    type: Date,
    default: null,
  },
});

export default mongoose.model<IMatch>("Match", MatchSchema);
