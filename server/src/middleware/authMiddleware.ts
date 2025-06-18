import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Extend the Request object to include userId
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || "supersecretjwtkey"; // Use the same secret as in authController

export const protect = (req: Request, res: Response, next: NextFunction) => {
  let token;

  // Check for 'Authorization' header with 'Bearer' token
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded: any = jwt.verify(token, JWT_SECRET); // Type 'any' for now, better to define an interface for decoded payload
      req.userId = decoded.userId; // Attach user ID to the request object
      next(); // Proceed to the next middleware/route handler
    } catch (error: any) {
      console.error("Token verification failed:", error.message);
      return res.status(401).json({ message: "Not authorized, token failed." });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token." });
  }
};
