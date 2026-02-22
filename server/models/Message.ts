import mongoose, { Document, Schema, Types } from "mongoose";

export interface IMessage extends Document {
  matchId: Types.ObjectId;
  senderId: Types.ObjectId;
  text: string;
  read: boolean;
  createdAt: Date;
}

const MessageSchema: Schema = new Schema({
  matchId: {
    type: Schema.Types.ObjectId,
    ref: "Match",
    required: true,
  },
  senderId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  text: {
    type: String,
    required: true,
    trim: true,
  },
  read: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model<IMessage>("Message", MessageSchema);
