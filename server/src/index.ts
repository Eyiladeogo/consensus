// server/src/index.ts (Main entry point for your Express server)

import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import cors from "cors"; // Install: npm install cors @types/cors
import authRoutes from "./routes/authRoutes";
import decisionRoutes from "./routes/decisionRoutes";
import { PrismaClient } from "@prisma/client"; // Prisma client will be generated after 'npx prisma generate'

dotenv.config(); // Load environment variables from .env file

const app = express();
const prisma = new PrismaClient(); // Initialize Prisma Client

// Middleware
app.use(
  cors({
    origin: "http://localhost:3000", // Allow requests from your React frontend
    credentials: true, // Allow cookies, authorization headers etc.
  })
);
app.use(express.json()); // Enable JSON body parsing for incoming requests

// Root route (for testing purposes)
app.get("/", (req: Request, res: Response) => {
  res.send("Collaborative Voting App Backend is Running!");
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/decisions", decisionRoutes);

// Error Handling Middleware (should be the last middleware)
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack); // Log the error stack for debugging
  res
    .status(500)
    .json({ message: "Something went wrong!", error: err.message });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(
    "Database URL:",
    process.env.DATABASE_URL ? "Configured" : "NOT CONFIGURED"
  );
});

// Graceful shutdown
process.on("beforeExit", async () => {
  await prisma.$disconnect();
  console.log("Prisma Client disconnected.");
});
