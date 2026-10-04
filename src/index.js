import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import connectionRoutes from "./routes/connection.route.js";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import { connectDB } from "./lib/db.js";
import { app, server } from "./lib/socket.js";
import { apiLimiter } from "./middleware/rateLimit.middleware.js";

dotenv.config();

const PORT = process.env.PORT || 5001;

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(helmet());

app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

app.use(apiLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/connections", connectionRoutes);

server.listen(PORT, () => {
  console.log(`Server running on PORT: ${PORT}`);
  connectDB();
});