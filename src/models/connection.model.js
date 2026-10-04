import mongoose from "mongoose";

const connectionSchema = new mongoose.Schema(
  {
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "blocked"],
      default: "pending",
    },

    blockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

// Prevent duplicate requests between the same two users
connectionSchema.index(
  { requesterId: 1, recipientId: 1 },
  { unique: true }
);

const Connection = mongoose.model("Connection", connectionSchema);

export default Connection;