// server/src/index.ts (Main entry point for your Express server)

import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/authRoutes";
import decisionRoutes from "./routes/decisionRoutes";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const app = express();
const prisma = new PrismaClient();

// Configure CORS
// Explicitly define allowedOrigins to include string and RegExp types
const allowedOrigins: (string | RegExp)[] = [
  // NEW: Type annotation (string | RegExp)[]
  "http://localhost:3000",
  "https://getconsensus.vercel.app",
  /^https:\/\/.*\.vercel\.app$/, // Regex to allow all Vercel subdomains (e.g., preview deployments)
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      // Check if origin is in the allowed string list
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Check if origin matches any allowed regex pattern
      const isRegexMatch = allowedOrigins.some((allowedOrigin) => {
        if (allowedOrigin instanceof RegExp) {
          // Use instanceof RegExp for type narrowing
          return allowedOrigin.test(origin);
        }
        return false;
      });

      if (isRegexMatch) {
        return callback(null, true);
      }

      // If neither string nor regex matches
      const msg =
        "The CORS policy for this site does not allow access from the specified Origin.";
      return callback(new Error(msg), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Collaborative Voting App Backend is Running!");
});

app.use("/api/auth", authRoutes);
app.use("/api/decisions", decisionRoutes);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res
    .status(500)
    .json({ message: "Something went wrong!", error: err.message });
});

const PORT: number = Number(process.env.PORT) || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(
    "Database URL:",
    process.env.DATABASE_URL ? "Configured" : "NOT CONFIGURED"
  );
});

process.on("beforeExit", async () => {
  await prisma.$disconnect();
  console.log("Prisma Client disconnected.");
});
