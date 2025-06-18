import { Request, Response } from "express";
import bcrypt from "bcryptjs"; // Install: npm install bcryptjs @types/bcryptjs
import jwt from "jsonwebtoken"; // Install: npm install jsonwebtoken @types/jsonwebtoken
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "supersecretjwtkey"; // IMPORTANT: Use a strong secret in production!

export const registerUser = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username and password are required." });
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return res.status(409).json({ message: "Username already taken." });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
      },
      select: { id: true, username: true }, // Don't return hashed password
    });

    res
      .status(201)
      .json({ message: "User registered successfully!", user: newUser });
  } catch (error: any) {
    console.error("Error registering user:", error);
    res
      .status(500)
      .json({
        message: "Server error during registration.",
        error: error.message,
      });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username and password are required." });
  }

  try {
    // Find user by username
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    // Compare provided password with hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: "1h" } // Token expires in 1 hour
    );

    res.status(200).json({ message: "Logged in successfully!", token });
  } catch (error: any) {
    console.error("Error logging in user:", error);
    res
      .status(500)
      .json({ message: "Server error during login.", error: error.message });
  }
};
