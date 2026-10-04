import { Server } from "socket.io";
import http from "http";
import express from "express";
import jwt from "jsonwebtoken";
import Connection from "../models/connection.model.js";

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  "http://localhost:5173",
  process.env.CLIENT_URL,
].filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

// ---------------------------------------------------------
// Socket Authentication
// Only authenticated users can establish a socket connection.
// ---------------------------------------------------------
io.use((socket, next) => {
  try {
    const token = socket.handshake.headers.cookie
      ?.split("; ")
      .find((row) => row.startsWith("jwt="))
      ?.slice(4);

    if (!token) {
      return next(new Error("Unauthorized - No Token"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    socket.userId = decoded.userId;

    next();
  } catch (error) {
    return next(new Error("Unauthorized - Invalid Token"));
  }
});

// ---------------------------------------------------------
// Connected user socket map
// ---------------------------------------------------------
const userSocketMap = {};

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

// ---------------------------------------------------------
// Check Chat Access
//
// Only accepted connections can communicate.
// Pending / rejected / blocked connections are denied.
// ---------------------------------------------------------
const checkChatAccess = async (userA, userB) => {
  try {
    const connection = await Connection.findOne({
      $or: [
        {
          requesterId: userA,
          recipientId: userB,
        },
        {
          requesterId: userB,
          recipientId: userA,
        },
      ],
      status: "accepted",
    });

    return !!connection;
  } catch (error) {
    console.log("Error in checkChatAccess:", error.message);
    return false;
  }
};

// ---------------------------------------------------------
// Socket Connection
// ---------------------------------------------------------
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  const userId = socket.userId;

  if (userId) {
    userSocketMap[userId] = socket.id;
  }

  // Broadcast current online users.
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // -------------------------------------------------------
  // Typing
  // -------------------------------------------------------
  socket.on("typing", async (receiverId) => {
    try {
      if (!receiverId || !userId) {
        return;
      }

      const hasAccess = await checkChatAccess(
        userId,
        receiverId
      );

      if (!hasAccess) {
        return;
      }

      const receiverSocketId =
        getReceiverSocketId(receiverId);

      if (receiverSocketId) {
        io.to(receiverSocketId).emit(
          "userTyping",
          userId
        );
      }
    } catch (error) {
      console.log(
        "Error in typing authorization:",
        error.message
      );
    }
  });

  // -------------------------------------------------------
  // Stop Typing
  // -------------------------------------------------------
  socket.on("stopTyping", async (receiverId) => {
    try {
      if (!receiverId || !userId) {
        return;
      }

      const hasAccess = await checkChatAccess(
        userId,
        receiverId
      );

      if (!hasAccess) {
        return;
      }

      const receiverSocketId =
        getReceiverSocketId(receiverId);

      if (receiverSocketId) {
        io.to(receiverSocketId).emit(
          "userStoppedTyping",
          userId
        );
      }
    } catch (error) {
      console.log(
        "Error in stopTyping authorization:",
        error.message
      );
    }
  });

  // -------------------------------------------------------
  // Disconnect
  // -------------------------------------------------------
  socket.on("disconnect", () => {
    console.log(
      "A user disconnected:",
      socket.id
    );

    // Only remove the user if this socket is still
    // the active socket for that user.
    if (userSocketMap[userId] === socket.id) {
      delete userSocketMap[userId];
    }

    io.emit(
      "getOnlineUsers",
      Object.keys(userSocketMap)
    );
  });
});

export { io, app, server };